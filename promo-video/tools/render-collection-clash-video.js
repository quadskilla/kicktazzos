"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const ffmpeg = require("@ffmpeg-installer/ffmpeg");
const { CdpClient, createPage, sleep, waitForChrome } = require("./cdp-client");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT_DIR, "out");
const FRAME_DIR = path.join(ROOT_DIR, "frames-collection-clash");
const CHROME_PORT = 9339;
const FPS = 30;
const DURATION = 15;
const TOTAL_FRAMES = Math.round(FPS * DURATION);
const OUTPUT = path.join(OUT_DIR, "tazzo-strike-collection-clash-ad.mp4");
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

function fileUrl(filePath) {
  return `file:///${filePath.replace(/\\/g, "/").replace(/ /g, "%20")}`;
}

function emptyDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function launchChrome() {
  const profileDir = path.join(ROOT_DIR, ".chrome-collection-clash-frames-profile");
  fs.mkdirSync(profileDir, { recursive: true });
  return spawn(chromePath(), [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-sync",
    "--hide-scrollbars",
    "--no-first-run",
    `--remote-debugging-port=${CHROME_PORT}`,
    `--user-data-dir=${profileDir}`,
    "--window-size=1080,1920",
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

function runFfmpeg() {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg.path, [
      "-y",
      "-framerate", String(FPS),
      "-i", path.join(FRAME_DIR, "frame-%04d.jpg"),
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-preset", "medium",
      "-crf", "20",
      "-movflags", "+faststart",
      OUTPUT
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg saiu com codigo ${code}`));
    });
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  emptyDir(FRAME_DIR);
  const htmlPath = path.join(ROOT_DIR, "render-collection-clash-ad.html");
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
      width: 1080,
      height: 1920,
      deviceScaleFactor: 1,
      mobile: false
    });
    await client.send("Page.navigate", { url: fileUrl(htmlPath) });
    await sleep(1000);
    await evaluate(client, `window.drawPromoFrameAt(0)`);

    for (let index = 0; index < TOTAL_FRAMES; index += 1) {
      const time = index / FPS;
      await evaluate(client, `window.drawPromoFrameAt(${time.toFixed(4)})`);
      const frame = await client.send("Page.captureScreenshot", {
        format: "jpeg",
        quality: 92,
        captureBeyondViewport: false
      });
      const name = `frame-${String(index + 1).padStart(4, "0")}.jpg`;
      fs.writeFileSync(path.join(FRAME_DIR, name), Buffer.from(frame.data, "base64"));
      if ((index + 1) % 60 === 0) console.log(`frames ${index + 1}/${TOTAL_FRAMES}`);
    }
  } finally {
    client?.close();
    chrome.kill();
  }

  await runFfmpeg();
  const stats = fs.statSync(OUTPUT);
  console.log(`video ${path.relative(ROOT_DIR, OUTPUT)} ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
