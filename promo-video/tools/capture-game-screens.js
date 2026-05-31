"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { CdpClient, createPage, sleep, waitForChrome } = require("./cdp-client");

const ROOT_DIR = path.resolve(__dirname, "..");
const GAME_DIR = path.resolve(ROOT_DIR, "..");
const OUT_DIR = path.join(ROOT_DIR, "shots");
const CHROME_PORT = 9334;
const GAME_URL = "http://127.0.0.1:8025/?promo=mobile-ad";
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
  const profileDir = path.join(ROOT_DIR, ".chrome-capture-profile");
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

async function screenshot(client, name) {
  await ensureDemoProfile(client);
  await sleep(450);
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
        const monsters = window.TAZZOMON_DATA.MONSTERS;
        const save = defaultSave();
        save.starterOnboardingComplete = true;
        save.tutorial = Object.fromEntries(window.TAZZOMON_DATA.TUTORIAL_STEPS.map((step) => [step.id, true]));
        save.tutorialRewardClaimed = true;
        save.merreis = 45000;
        save.fragments = 720;
        save.trophies = 360;
        save.rankedWins = 18;
        save.tournamentWins = 3;
        save.onlineWins = 7;
        monsters.slice(0, 36).forEach((monster) => {
          save.collection[monster.id] = monster.rarity === "Mistico" ? 1 : 2;
        });
        ["artilheiro-brasil", "vinicius-jr-tazzo", "rodrygo-tazzo", "goleiro-brasil-alison"].forEach((id) => {
          save.collection[id] = Math.max(1, save.collection[id] || 0);
        });
        save.team = ["artilheiro-brasil", "vinicius-jr-tazzo", "rodrygo-tazzo"];
        save.goalkeeper = "goleiro-brasil-alison";
        save.packPity = { sinceLegendaryPlus: 8 };
        localStorage.setItem("tazzomon-save-v1", JSON.stringify(save));
        location.reload();
      })();
    `, false);
    await waitForLoad(client);
    await ensureDemoProfile(client);
    await evaluate(client, `setServerStatus("online", "Demo"); renderEntryGate(); renderAll();`);

    await evaluate(client, `document.body.classList.add("promo-capture"); window.scrollTo(0, 0); switchTab("home");`);
    await screenshot(client, "01-home");

    await evaluate(client, `switchTab("packs"); window.scrollTo(0, 0);`);
    await screenshot(client, "02-packs");

    await evaluate(client, `
      (() => {
        switchTab("packs");
        state.save.merreis = 45000;
        const pack = PACKS.find((item) => item.id === "recheado") || PACKS[0];
        openPackLocally(pack);
      })();
    `);
    await sleep(700);
    await screenshot(client, "03-pack-opening");
    await sleep(1600);
    await evaluate(client, `showPackCards(); revealAllPulls();`);
    await sleep(1200);
    await screenshot(client, "04-pack-reveal");

    await evaluate(client, `closePackResults(); switchTab("collection"); window.scrollTo(0, 0);`);
    await screenshot(client, "05-collection");

    await evaluate(client, `
      (() => {
        switchTab("battle");
        state.battleSceneOpen = false;
        state.battleSetup.mode = "casual";
        state.battleSetup.opponent = battleOpponentOptions("casual")[0]?.id || "random";
        state.battleSetup.formation = "center";
        state.battleSetup.positions = formationPositions("center");
        startConfiguredBattle();
        state.battleSceneOpen = true;
        renderBattle();
      })();
    `);
    await sleep(900);
    await screenshot(client, "06-battle");

    await evaluate(client, `state.battleSceneOpen = false; switchTab("online"); window.scrollTo(0, 0);`);
    await screenshot(client, "07-online");
  } finally {
    client?.close();
    chrome.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
