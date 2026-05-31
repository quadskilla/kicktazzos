"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { CdpClient, createPage, sleep, waitForChrome } = require("./cdp-client");

const ROOT_DIR = path.resolve(__dirname, "..");
const GAME_DIR = path.resolve(ROOT_DIR, "..");
const OUT_DIR = path.join(ROOT_DIR, "shots-collection-clash");
const CHROME_PORT = 9338;
const GAME_URL = "http://127.0.0.1:8025/?promo=collection-clash";
const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe")
].filter(Boolean);

function chromePath() {
  const found = CHROME_PATHS.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error("Chrome nao encontrado.");
  return found;
}

function launchChrome() {
  const profileDir = path.join(ROOT_DIR, ".chrome-collection-clash-profile");
  fs.mkdirSync(profileDir, { recursive: true });
  return spawn(chromePath(), [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-sync",
    "--hide-scrollbars",
    "--mute-audio",
    "--no-first-run",
    `--remote-debugging-port=${CHROME_PORT}`,
    `--user-data-dir=${profileDir}`,
    "--window-size=390,844",
    "about:blank"
  ], { stdio: "ignore" });
}

async function gameResponds() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 900);
  try {
    const response = await fetch(GAME_URL, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function ensureGameServer() {
  if (await gameResponds()) return null;
  const server = spawn(process.execPath, ["server.js"], {
    cwd: GAME_DIR,
    env: { ...process.env, PORT: "8025" },
    stdio: "ignore"
  });
  for (let attempt = 0; attempt < 35; attempt += 1) {
    await sleep(250);
    if (await gameResponds()) return server;
  }
  server.kill();
  throw new Error("Nao consegui iniciar o jogo em http://127.0.0.1:8025/.");
}

async function evaluate(client, expression, awaitPromise = true) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Erro no Runtime.evaluate");
  }
  return result.result?.value;
}

async function ensureDemoProfile(client) {
  await evaluate(client, `
    (() => {
      const profile = {
        playerId: "promo-capture-player",
        name: "Tazzo Player",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        authProvider: "pin"
      };
      state.server.enabled = true;
      state.server.loading = false;
      state.server.status = "online";
      state.server.playerId = profile.playerId;
      applyProfile(profile);
      const gate = document.getElementById("entry-gate");
      if (gate) {
        gate.hidden = true;
        gate.style.display = "none";
      }
      const musicPlayer = document.getElementById("music-player");
      if (musicPlayer) musicPlayer.style.display = "none";
    })();
  `);
}

async function screenshot(client, name, delay = 450) {
  await ensureDemoProfile(client);
  await sleep(delay);
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false
  });
  const filePath = path.join(OUT_DIR, `${name}.png`);
  fs.writeFileSync(filePath, Buffer.from(result.data, "base64"));
  console.log(`captured ${path.relative(GAME_DIR, filePath)}`);
}

async function waitForLoad(client) {
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 4500);
    client.on("Page.loadEventFired", () => {
      clearTimeout(timer);
      setTimeout(resolve, 700);
    });
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const gameServer = await ensureGameServer();
  const chrome = launchChrome();
  let client;
  try {
    await waitForChrome(CHROME_PORT);
    const page = await createPage(CHROME_PORT);
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.connect();
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await client.send("Emulation.setUserAgentOverride", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    });
    await client.send("Page.navigate", { url: GAME_URL });
    await waitForLoad(client);

    await evaluate(client, `
      (() => {
        const holoIds = [
          "artilheiro-brasil",
          "vinicius-jr-tazzo",
          "rodrygo-tazzo",
          "endrick-tazzo",
          "angel-di-maria-tazzo",
          "judao-bellingol-tazzo",
          "bukayo-sacada-tazzo",
          "harri-kane-tazzo",
          "pickford-tazzo",
          "robozao-cr-7-tazzo",
          "kylian-mbrappe-tazzo",
          "dembeletico-tazzo"
        ];
        const save = defaultSave();
        save.starterOnboardingComplete = true;
        save.tutorial = Object.fromEntries(window.TAZZOMON_DATA.TUTORIAL_STEPS.map((step) => [step.id, true]));
        save.tutorialRewardClaimed = true;
        save.merreis = 68500;
        save.fragments = 1180;
        save.trophies = 620;
        save.onlineWins = 12;
        save.rankedWins = 22;
        window.TAZZOMON_DATA.MONSTERS.forEach((monster, index) => {
          if (index < 72 || holoIds.includes(monster.id)) {
            save.collection[monster.id] = monster.rarity === "Mistico Secreto" ? 1 : monster.rarity === "Mistico" ? 1 : 2;
          }
        });
        save.team = ["artilheiro-brasil", "vinicius-jr-tazzo", "rodrygo-tazzo"];
        save.goalkeeper = "goleiro-brasil-alison";
        localStorage.setItem("tazzomon-save-v1", JSON.stringify(save));
        location.reload();
      })();
    `, false);
    await waitForLoad(client);
    await ensureDemoProfile(client);

    await evaluate(client, `
      (() => {
        try { refreshSocial = () => Promise.resolve(); } catch {}
        try { refreshOnlineLobbies = () => Promise.resolve(); } catch {}
        try { refreshLeaderboard = () => Promise.resolve(); } catch {}
        const style = document.createElement("style");
        style.textContent = \`
          body.promo-collection-clash #entry-gate,
          body.promo-collection-clash #music-player { display: none !important; }
          body.promo-collection-clash #tutorial-coach,
          body.promo-collection-clash #tutorial-panel,
          body.promo-collection-clash .tutorial-overlay,
          body.promo-collection-clash .reward-celebration { display: none !important; }
          body.promo-collection-clash #tazzo-clash-panel .profile-message.is-error { display: none !important; }
          body.promo-collection-clash #view-online > .section-head,
          body.promo-collection-clash #view-online .online-current-card,
          body.promo-collection-clash #view-online .online-rooms-panel,
          body.promo-collection-clash #view-online .online-team-card { display: none !important; }
          body.promo-collection-clash #tazzo-clash-panel > .panel-heading,
          body.promo-collection-clash #tazzo-clash-panel > .tazzo-clash-note,
          body.promo-collection-clash #tazzo-clash-panel > .tazzo-clash-builder { display: none !important; }
          body.promo-collection-clash .holo-art.is-holo-moving .holo-art-foil { opacity: .52; }
          body.promo-collection-clash .monster-card { min-height: 345px; }
          body.promo-collection-clash .tazzo-clash-board { min-height: 360px; }
        \`;
        document.head.appendChild(style);
        document.body.classList.add("promo-capture", "promo-collection-clash");
        setServerStatus("online", "Demo");
        renderEntryGate();
        renderAll();
      })();
    `);

    await evaluate(client, `
      (() => {
        const priority = [
          "artilheiro-brasil",
          "vinicius-jr-tazzo",
          "rodrygo-tazzo",
          "endrick-tazzo",
          "angel-di-maria-tazzo",
          "judao-bellingol-tazzo",
          "bukayo-sacada-tazzo",
          "harri-kane-tazzo",
          "robozao-cr-7-tazzo",
          "kylian-mbrappe-tazzo",
          "dembeletico-tazzo"
        ];
        switchTab("collection");
        state.collectionFilters.owned = "owned";
        state.collectionFilters.rarity = "all";
        state.collectionFilters.type = "all";
        renderCollection();
        const grid = document.getElementById("collection-grid");
        if (grid) {
          const cards = Array.from(grid.children);
          const byId = new Map(cards.map((card) => [card.querySelector("[data-monster-view]")?.dataset.monsterView, card]));
          const used = new Set();
          const fragment = document.createDocumentFragment();
          priority.forEach((id) => {
            const card = byId.get(id);
            if (card) {
              used.add(card);
              fragment.appendChild(card);
            }
          });
          cards.forEach((card) => {
            if (!used.has(card)) fragment.appendChild(card);
          });
          grid.appendChild(fragment);
        }
        document.querySelectorAll(".holo-art").forEach((art, index) => {
          art.classList.add("is-holo-moving");
          art.style.setProperty("--holo-x", (28 + (index * 17) % 58) + "%");
          art.style.setProperty("--holo-y", (22 + (index * 13) % 52) + "%");
          art.style.setProperty("--holo-wipe", (18 + (index * 19) % 68) + "%");
        });
        window.scrollTo(0, 0);
      })();
    `);
    await screenshot(client, "01-collection-grid");

    await evaluate(client, `
      (() => {
        openTazzoViewer("artilheiro-brasil");
        document.querySelectorAll("#tazzo-viewer .holo-art").forEach((art) => {
          art.classList.add("is-holo-moving");
          art.style.setProperty("--holo-x", "64%");
          art.style.setProperty("--holo-y", "34%");
          art.style.setProperty("--holo-wipe", "48%");
        });
      })();
    `);
    await screenshot(client, "02-holographic-zoom");

    await evaluate(client, `
      (() => {
        const viewer = document.getElementById("tazzo-viewer");
        if (typeof closeTazzoViewer === "function") closeTazzoViewer();
        else if (viewer) {
          viewer.hidden = true;
          viewer.classList.remove("is-open");
          viewer.setAttribute("aria-hidden", "true");
        }
        const playerId = state.server.playerId;
        const friendId = "promo-friend-rafa";
        const now = new Date().toISOString();
        state.online.loading = false;
        state.online.lobbies = [];
        state.online.currentLobby = null;
        state.social.loading = false;
        state.social.loadedAt = Date.now();
        state.social.message = "Duelo aceito: mesa pronta.";
        state.social.error = "";
        state.social.clashFriendId = friendId;
        state.social.friends = [{
          playerId: friendId,
          name: "Rafa",
          status: "accepted",
          collection: [
            { monsterId: "angel-di-maria-tazzo", count: 1 },
            { monsterId: "judao-bellingol-tazzo", count: 1 },
            { monsterId: "harri-kane-tazzo", count: 1 }
          ]
        }];
        const offeredIds = ["artilheiro-brasil", "vinicius-jr-tazzo", "rodrygo-tazzo"];
        const requestedIds = ["angel-di-maria-tazzo", "judao-bellingol-tazzo", "harri-kane-tazzo"];
        const entries = [
          ...offeredIds.map((monsterId, index) => ({ key: "you-" + index, monsterId, ownerPlayerId: playerId, capturedByPlayerId: null })),
          ...requestedIds.map((monsterId, index) => ({ key: "friend-" + index, monsterId, ownerPlayerId: friendId, capturedByPlayerId: null }))
        ];
        state.social.clashes = [{
          id: "promo-clash",
          status: "active",
          fromPlayerId: playerId,
          toPlayerId: friendId,
          from: { playerId, name: "Tazzo Player" },
          to: { playerId: friendId, name: "Rafa" },
          offeredIds,
          requestedIds,
          entries,
          currentTurnPlayerId: playerId,
          startedByPlayerId: playerId,
          winnerPlayerId: "",
          scores: { [playerId]: 0, [friendId]: 0 },
          valuesBalanced: true,
          log: [{ message: "Cara ou coroa decidiu: voce bate primeiro." }],
          createdAt: now,
          updatedAt: now
        }];
        state.social.clashAnimation = null;
        switchTab("online");
        renderOnline();
        const duel = document.querySelector("[data-clash-duel-card]");
        if (duel) {
          duel.scrollIntoView({ block: "start" });
          window.scrollBy(0, -12);
        }
      })();
    `);
    await screenshot(client, "03-tazzo-clash-table");

    await evaluate(client, `
      (() => {
        const clash = state.social.clashes[0];
        const playerId = state.server.playerId;
        if (clash) {
          clash.entries = clash.entries.map((entry) => {
            if (entry.key === "friend-0" || entry.key === "friend-1") {
              return { ...entry, capturedByPlayerId: playerId };
            }
            return entry;
          });
          clash.scores = { ...clash.scores, [playerId]: 2 };
          clash.currentTurnPlayerId = clash.toPlayerId;
          clash.log = [{ message: "Batida perfeita: dois tazzos viraram na mesa!" }];
          state.social.clashAnimation = {
            duelId: clash.id,
            at: Date.now(),
            flippedKeys: ["friend-0", "friend-1"]
          };
        }
        renderOnline();
        const duel = document.querySelector("[data-clash-duel-card]");
        if (duel) {
          duel.scrollIntoView({ block: "start" });
          window.scrollBy(0, -12);
        }
      })();
    `);
    await screenshot(client, "04-tazzo-clash-impact", 950);
  } finally {
    client?.close();
    chrome.kill();
    gameServer?.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
