"use strict";

const http = require("node:http");

function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, options, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP ${response.statusCode}: ${body}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("error", reject);
    request.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.webSocketUrl);
      this.ws.addEventListener("open", () => resolve());
      this.ws.addEventListener("error", reject);
      this.ws.addEventListener("message", (event) => this.onMessage(event.data));
    });
  }

  onMessage(data) {
    const message = JSON.parse(data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message || JSON.stringify(message.error)));
      else resolve(message.result || {});
      return;
    }
    if (message.method && this.events.has(message.method)) {
      this.events.get(message.method).forEach((handler) => handler(message.params || {}));
    }
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
    });
  }

  on(method, handler) {
    if (!this.events.has(method)) this.events.set(method, new Set());
    this.events.get(method).add(handler);
  }

  close() {
    try {
      this.ws?.close();
    } catch {
      // no-op
    }
  }
}

async function waitForChrome(port, timeoutMs = 10000) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await requestJson(`http://127.0.0.1:${port}/json/version`);
    } catch (error) {
      lastError = error;
      await sleep(150);
    }
  }
  throw lastError || new Error("Chrome DevTools nao respondeu.");
}

async function createPage(port, url = "about:blank") {
  const encoded = encodeURIComponent(url);
  try {
    return await requestJson(`http://127.0.0.1:${port}/json/new?${encoded}`, { method: "PUT" });
  } catch {
    const pages = await requestJson(`http://127.0.0.1:${port}/json/list`);
    return pages.find((page) => page.type === "page");
  }
}

async function waitForFile(filePath, fs, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(filePath)) return true;
    await sleep(250);
  }
  return false;
}

module.exports = {
  CdpClient,
  createPage,
  requestJson,
  sleep,
  waitForChrome,
  waitForFile
};
