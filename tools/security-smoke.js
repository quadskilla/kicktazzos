const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");

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
      SESSION_SECRET: "security-smoke-session-secret",
      RATE_LIMIT_WINDOW_MS: "60000",
      RATE_LIMIT_MAX: "50",
      RATE_LIMIT_SENSITIVE_MAX: "1",
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
