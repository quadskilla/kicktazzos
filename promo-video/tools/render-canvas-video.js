"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { CdpClient, createPage, sleep, waitForChrome, waitForFile } = require("./cdp-client");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT_DIR, "out");
const CHROME_PORT = 9335;
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

function launchChrome() {
  const profileDir = path.join(ROOT_DIR, ".chrome-render-profile");
  fs.mkdirSync(profileDir, { recursive: true });
  return spawn(chromePath(), [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-sync",
    "--autoplay-policy=no-user-gesture-required",
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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const htmlPath = path.join(ROOT_DIR, "render-ad.html");
  const chrome = launchChrome();
  let client;
  try {
    await waitForChrome(CHROME_PORT);
    const page = await createPage(CHROME_PORT);
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.connect();
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    try {
      await client.send("Browser.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: OUT_DIR
      });
    } catch {
      await client.send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: OUT_DIR
      });
    }
    await client.send("Page.navigate", { url: fileUrl(htmlPath) });
    await sleep(1200);
    const info = await evaluate(client, `
      (async () => {
        const blob = await window.renderPromoVideo();
        if (!blob.size) throw new Error("O navegador gravou um blob de video vazio.");
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        const name = "tazzo-strike-mobile-ad." + ext;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = name;
        document.body.appendChild(link);
        link.click();
        return { name, type: blob.type, size: blob.size };
      })();
    `, true);
    const output = path.join(OUT_DIR, info.name);
    const downloaded = await waitForFile(output, fs, 20000);
    if (!downloaded) throw new Error(`Download nao apareceu em ${output}.`);
    console.log(`video ${path.relative(ROOT_DIR, output)} ${info.type} ${info.size} bytes`);
  } finally {
    client?.close();
    chrome.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
