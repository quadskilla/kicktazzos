"use strict";

const fs = require("node:fs");
const path = require("node:path");

const INITIAL_ENV_KEYS = new Set(Object.keys(process.env));
const LOCAL_ENV_FILES = [".env", ".env.local", ".env.crypto.local"];

function applyEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const index = trimmed.indexOf("=");
    if (index <= 0) return;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!INITIAL_ENV_KEYS.has(key) || !String(process.env[key] || "").trim()) {
      process.env[key] = value;
    }
  });
}

function loadEnvFile(rootDir = process.cwd()) {
  LOCAL_ENV_FILES.forEach((fileName) => applyEnvFile(path.join(rootDir, fileName)));
}

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Defina ${name} no .env antes de continuar.`);
  }
  return value;
}

function optionalInt(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? Math.floor(value) : fallback;
}

function merreisCoinNetworkConfig() {
  return {
    name: String(process.env.MERREISCOIN_NETWORK || "base-sepolia").trim(),
    rpcUrl: String(process.env.MERREISCOIN_RPC_URL || process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org").trim(),
    chainId: optionalInt("MERREISCOIN_CHAIN_ID", 84532),
    explorerUrl: String(process.env.MERREISCOIN_EXPLORER_URL || "https://sepolia.basescan.org").trim()
  };
}

module.exports = {
  loadEnvFile,
  merreisCoinNetworkConfig,
  optionalInt,
  requiredEnv
};
