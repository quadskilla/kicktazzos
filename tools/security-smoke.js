const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ROOT_DIR = path.resolve(__dirname, "..");
const SESSION_SECRET = "security-smoke-session-secret";

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function headerValue(headers, name) {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join("; ") : String(value || "");
}

function responseCookie(headers, name) {
  const values = headers["set-cookie"];
  const cookies = Array.isArray(values) ? values : [String(values || "")];
  return cookies.map((cookie) => cookie.split(";")[0]).find((cookie) => cookie.startsWith(`${name}=`)) || "";
}

function signedPlayerCookie(playerId) {
  const payload = `v1.${playerId}`;
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `kick_tazzos_player=${encodeURIComponent(`${payload}.${signature}`)}`;
}

function seedProfile(dataDir, playerId, key, name) {
  const database = new DatabaseSync(path.join(dataDir, "kick-tazzos.db"));
  const now = new Date().toISOString();
  const profile = {
    playerId,
    key,
    name,
    createdAt: now,
    lastLoginAt: now,
    authProviders: {
      firebase: {
        uid: `smoke-${playerId}`,
        email: `${key}@example.test`,
        emailVerified: true,
        provider: "google",
        picture: ""
      }
    }
  };
  database.prepare(`
    INSERT INTO profiles (profile_key, player_id, name, data_json)
    VALUES (?, ?, ?, ?)
  `).run(key, playerId, name, JSON.stringify(profile));
  database.close();
}

function request(port, { method = "GET", pathname = "/", headers = {}, body = "" } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: "127.0.0.1",
      port,
      path: pathname,
      method,
      headers: {
        ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
        ...headers
      }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString("utf8")
        });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function waitForExit(child, timeoutMs = 5000) {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, timeoutMs);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function waitForServer(child, port, logs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited early:\n${logs.join("")}`);
    }
    try {
      const response = await request(port, { pathname: "/api/health" });
      if (response.status === 200) return response;
    } catch (error) {
      // Server is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not start:\n${logs.join("")}`);
}

async function main() {
  const port = await freePort();
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "kick-tazzos-security-"));
  const logs = [];
  const child = spawn(process.execPath, ["server.js"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      NODE_ENV: "production",
      HOST: "127.0.0.1",
      PORT: String(port),
      DATA_DIR: dataDir,
      SESSION_SECRET,
      RATE_LIMIT_WINDOW_MS: "60000",
      RATE_LIMIT_MAX: "50",
      RATE_LIMIT_SENSITIVE_MAX: "1",
      COMPETITIVE_MIN_POSITIVE_RESOLVE_MS: "2000",
      TRAINING_AI_MIN_RESOLVE_MS: "1000",
      MERCADO_PAGO_WEBHOOK_SECRET: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => logs.push(chunk.toString("utf8")));
  child.stderr.on("data", (chunk) => logs.push(chunk.toString("utf8")));

  try {
    const health = await waitForServer(child, port, logs);
    assert.equal(headerValue(health.headers, "x-content-type-options"), "nosniff");
    assert.equal(headerValue(health.headers, "x-frame-options"), "DENY");
    assert.match(headerValue(health.headers, "content-security-policy"), /default-src 'self'/);
    assert.match(headerValue(health.headers, "content-security-policy"), /frame-ancestors 'none'/);
    assert.match(headerValue(health.headers, "content-security-policy"), /https:\/\/www\.gstatic\.com/);
    assert.match(headerValue(health.headers, "content-security-policy"), /https:\/\/www\.mercadopago\.com/);
    const initialCookie = headerValue(health.headers, "set-cookie");
    assert.match(initialCookie, /kick_tazzos_player=v1\./);
    assert.match(initialCookie, /HttpOnly/);
    assert.match(initialCookie, /SameSite=Lax/);
    const playerCookie = responseCookie(health.headers, "kick_tazzos_player");
    assert.match(playerCookie, /^kick_tazzos_player=v1\./);

    const evilPost = await request(port, {
      method: "POST",
      pathname: "/api/telemetry",
      headers: {
        Origin: "http://evil.example",
        "Content-Type": "application/json"
      },
      body: "{}"
    });
    assert.equal(evilPost.status, 403);

    const sameOrigin = `http://127.0.0.1:${port}`;
    const goodPost = await request(port, {
      method: "POST",
      pathname: "/api/telemetry",
      headers: {
        Origin: sameOrigin,
        "Content-Type": "application/json"
      },
      body: "{\"type\":\"smoke\",\"data\":{}}"
    });
    assert.equal(goodPost.status, 200);

    const migrationAttempt = await request(port, {
      method: "POST",
      pathname: "/api/save/migrate",
      headers: {
        Cookie: playerCookie,
        Origin: sameOrigin,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        save: {
          merreis: 9999999,
          fragments: 999999,
          trophies: 99999,
          collection: { "vinicius-jr-tazzo": 50 },
          musicVolume: 0.2
        }
      })
    });
    assert.equal(migrationAttempt.status, 200);
    const migrationPayload = JSON.parse(migrationAttempt.body);
    assert.deepEqual(migrationPayload.ignoredProtectedFields.sort(), ["collection", "fragments", "merreis", "trophies"]);
    assert.equal(migrationPayload.save.merreis, 1250);
    assert.equal(migrationPayload.save.fragments, 0);
    assert.equal(migrationPayload.save.trophies, 0);
    assert.equal(migrationPayload.save.collection["vinicius-jr-tazzo"], undefined);
    assert.equal(migrationPayload.save.musicVolume, 0.2);

    const migratedSave = await request(port, {
      pathname: "/api/save",
      headers: { Cookie: playerCookie }
    });
    assert.equal(migratedSave.status, 200);
    const migratedSavePayload = JSON.parse(migratedSave.body);
    assert.equal(migratedSavePayload.save.merreis, 1250);
    assert.equal(migratedSavePayload.save.collection["vinicius-jr-tazzo"], undefined);

    const ownerPlayerId = crypto.randomUUID();
    const visitorPlayerId = crypto.randomUUID();
    seedProfile(dataDir, ownerPlayerId, "owner-smoke", "Owner Smoke");
    seedProfile(dataDir, visitorPlayerId, "visitor-smoke", "Visitor Smoke");
    const ownerCookie = signedPlayerCookie(ownerPlayerId);
    const visitorCookie = signedPlayerCookie(visitorPlayerId);

    const shareLink = await request(port, {
      method: "POST",
      pathname: "/api/share-link",
      headers: {
        Cookie: ownerCookie,
        Origin: sameOrigin,
        "Content-Type": "application/json"
      },
      body: "{\"networkId\":\"discord\"}"
    });
    assert.equal(shareLink.status, 200);

    const guestShareVisit = await request(port, {
      method: "POST",
      pathname: "/api/share-visit",
      headers: {
        Cookie: playerCookie,
        Origin: sameOrigin,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ownerPlayerId, networkId: "discord" })
    });
    assert.equal(guestShareVisit.status, 401);

    const visitorShareVisit = await request(port, {
      method: "POST",
      pathname: "/api/share-visit",
      headers: {
        Cookie: visitorCookie,
        Origin: sameOrigin,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ownerPlayerId, networkId: "discord" })
    });
    assert.equal(visitorShareVisit.status, 200);
    assert.equal(JSON.parse(visitorShareVisit.body).validated, true);

    const shareClaim = await request(port, {
      method: "POST",
      pathname: "/api/share-reward",
      headers: {
        Cookie: ownerCookie,
        Origin: sameOrigin,
        "Content-Type": "application/json"
      },
      body: "{\"networkId\":\"discord\"}"
    });
    assert.equal(shareClaim.status, 200);
    const shareClaimPayload = JSON.parse(shareClaim.body);
    assert.equal(shareClaimPayload.save.merreis, 1250 + Number(shareClaimPayload.network.reward));

    const trainingPlayerId = crypto.randomUUID();
    seedProfile(dataDir, trainingPlayerId, "training-smoke", "Training Smoke");
    const trainingPlayerCookie = signedPlayerCookie(trainingPlayerId);
    const trainingStart = await request(port, {
      method: "POST",
      pathname: "/api/training-ai/start",
      headers: {
        Cookie: trainingPlayerCookie,
        Origin: sameOrigin,
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.31"
      },
      body: "{}"
    });
    assert.equal(trainingStart.status, 200);
    const trainingPayload = JSON.parse(trainingStart.body);
    assert.match(trainingPayload.session.id, /^[a-f0-9-]{36}$/i);
    assert.equal(trainingPayload.save.activeTrainingAi.id, trainingPayload.session.id);
    const trainingCookie = responseCookie(trainingStart.headers, "kick_tazzos_training_ai");
    assert.match(trainingCookie, /^kick_tazzos_training_ai=v1\./);
    assert.match(headerValue(trainingStart.headers, "set-cookie"), /kick_tazzos_training_ai=.*HttpOnly/);

    const forgedTrainingResolve = await request(port, {
      method: "POST",
      pathname: "/api/training-ai/resolve",
      headers: {
        Cookie: trainingPlayerCookie,
        Origin: sameOrigin,
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.32"
      },
      body: JSON.stringify({ sessionId: trainingPayload.session.id, outcome: "loss" })
    });
    assert.equal(forgedTrainingResolve.status, 403);

    const tooFastTrainingResolve = await request(port, {
      method: "POST",
      pathname: "/api/training-ai/resolve",
      headers: {
        Cookie: `${trainingPlayerCookie}; ${trainingCookie}`,
        Origin: sameOrigin,
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.33"
      },
      body: JSON.stringify({ sessionId: trainingPayload.session.id, outcome: "loss" })
    });
    assert.equal(tooFastTrainingResolve.status, 409);

    await new Promise((resolve) => setTimeout(resolve, 1200));
    const acceptedTrainingResolve = await request(port, {
      method: "POST",
      pathname: "/api/training-ai/resolve",
      headers: {
        Cookie: `${trainingPlayerCookie}; ${trainingCookie}`,
        Origin: sameOrigin,
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.34"
      },
      body: JSON.stringify({ sessionId: trainingPayload.session.id, outcome: "loss" })
    });
    assert.equal(acceptedTrainingResolve.status, 200);
    const acceptedTrainingPayload = JSON.parse(acceptedTrainingResolve.body);
    assert.equal(acceptedTrainingPayload.save.merreis, 1275);
    assert.equal(acceptedTrainingPayload.save.dailyEconomy.trainingAiMatches, 1);
    assert.equal(acceptedTrainingPayload.save.activeTrainingAi, null);
    assert.match(headerValue(acceptedTrainingResolve.headers, "set-cookie"), /kick_tazzos_training_ai=;/);

    const rankedPlayerA = crypto.randomUUID();
    const rankedPlayerB = crypto.randomUUID();
    seedProfile(dataDir, rankedPlayerA, "ranked-a-smoke", "Ranked A Smoke");
    seedProfile(dataDir, rankedPlayerB, "ranked-b-smoke", "Ranked B Smoke");
    const rankedCookieA = signedPlayerCookie(rankedPlayerA);
    const rankedCookieB = signedPlayerCookie(rankedPlayerB);
    const rankedStartARequest = request(port, {
      method: "POST",
      pathname: "/api/ranked/start",
      headers: {
        Cookie: rankedCookieA,
        Origin: sameOrigin,
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.21"
      },
      body: "{}"
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    const rankedStartBRequest = request(port, {
      method: "POST",
      pathname: "/api/ranked/start",
      headers: {
        Cookie: rankedCookieB,
        Origin: sameOrigin,
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.22"
      },
      body: "{}"
    });
    const [rankedStartA, rankedStartB] = await Promise.all([rankedStartARequest, rankedStartBRequest]);
    assert.equal(rankedStartA.status, 200);
    assert.equal(rankedStartB.status, 200);
    const rankedPayloadA = JSON.parse(rankedStartA.body);
    const rankedPayloadB = JSON.parse(rankedStartB.body);
    assert.equal(rankedPayloadA.match.id, rankedPayloadB.match.id);
    assert.equal(rankedPayloadA.match.requiresResolveCookie, true);
    const competitiveCookieA = responseCookie(rankedStartA.headers, "kick_tazzos_competitive");
    assert.match(competitiveCookieA, /^kick_tazzos_competitive=v1\./);
    assert.match(headerValue(rankedStartA.headers, "set-cookie"), /kick_tazzos_competitive=.*HttpOnly/);

    const forgedCompetitiveResolve = await request(port, {
      method: "POST",
      pathname: "/api/competitive/resolve",
      headers: {
        Cookie: rankedCookieA,
        Origin: sameOrigin,
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.23"
      },
      body: JSON.stringify({ matchId: rankedPayloadA.match.id, outcome: "win" })
    });
    assert.equal(forgedCompetitiveResolve.status, 403);

    const tooFastCompetitiveResolve = await request(port, {
      method: "POST",
      pathname: "/api/competitive/resolve",
      headers: {
        Cookie: `${rankedCookieA}; ${competitiveCookieA}`,
        Origin: sameOrigin,
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.24"
      },
      body: JSON.stringify({ matchId: rankedPayloadA.match.id, outcome: "win" })
    });
    assert.equal(tooFastCompetitiveResolve.status, 409);

    await new Promise((resolve) => setTimeout(resolve, 2100));
    const acceptedCompetitiveResolve = await request(port, {
      method: "POST",
      pathname: "/api/competitive/resolve",
      headers: {
        Cookie: `${rankedCookieA}; ${competitiveCookieA}`,
        Origin: sameOrigin,
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.25"
      },
      body: JSON.stringify({ matchId: rankedPayloadA.match.id, outcome: "win" })
    });
    assert.equal(acceptedCompetitiveResolve.status, 200);
    const acceptedCompetitivePayload = JSON.parse(acceptedCompetitiveResolve.body);
    assert.equal(acceptedCompetitivePayload.save.rankedWins, 1);
    assert.equal(acceptedCompetitivePayload.save.activeCompetitive, null);
    assert.ok(acceptedCompetitivePayload.save.trophies > 0);
    assert.match(headerValue(acceptedCompetitiveResolve.headers, "set-cookie"), /kick_tazzos_competitive=;/);

    const legacyPlayerId = crypto.randomUUID();
    const legacyProfile = await request(port, {
      pathname: "/api/profile",
      headers: {
        Cookie: `kick_tazzos_player=${legacyPlayerId}`
      }
    });
    assert.equal(legacyProfile.status, 200);
    assert.notEqual(JSON.parse(legacyProfile.body).playerId, legacyPlayerId);
    assert.match(headerValue(legacyProfile.headers, "set-cookie"), /kick_tazzos_player=v1\./);

    const webhook = await request(port, {
      method: "POST",
      pathname: "/api/mercadopago/webhook?type=payment&data.id=123",
      headers: {
        "Content-Type": "application/json"
      },
      body: "{\"type\":\"payment\",\"data\":{\"id\":\"123\"}}"
    });
    assert.equal(webhook.status, 401);

    const firstLogin = await request(port, {
      method: "POST",
      pathname: "/api/profile/login",
      headers: {
        Origin: sameOrigin,
        "Content-Type": "application/json"
      },
      body: "{\"name\":\"fake\",\"pin\":\"wrong\"}"
    });
    assert.notEqual(firstLogin.status, 429);

    const secondLogin = await request(port, {
      method: "POST",
      pathname: "/api/profile/login",
      headers: {
        Origin: sameOrigin,
        "Content-Type": "application/json"
      },
      body: "{\"name\":\"fake\",\"pin\":\"wrong\"}"
    });
    assert.equal(secondLogin.status, 429);
    assert.match(headerValue(secondLogin.headers, "retry-after"), /^[1-9][0-9]*$/);

    console.log("Security smoke checks passed.");
  } finally {
    if (child.exitCode === null) child.kill();
    await waitForExit(child);
    await fs.rm(dataDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
