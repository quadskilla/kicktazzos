"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile, merreisCoinNetworkConfig } = require("./env");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const LOCAL_ENV_PATH = path.join(ROOT_DIR, ".env.crypto.local");
const DEPLOYMENTS_DIR = path.join(ROOT_DIR, "deployments");

function parseEnv(text) {
  const values = new Map();
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const index = trimmed.indexOf("=");
    if (index <= 0) return;
    values.set(trimmed.slice(0, index).trim(), trimmed.slice(index + 1).trim());
  });
  return values;
}

function writeLocalEnv(updates) {
  const existingText = fs.existsSync(LOCAL_ENV_PATH) ? fs.readFileSync(LOCAL_ENV_PATH, "utf8") : "";
  const values = parseEnv(existingText);
  Object.entries(updates).forEach(([key, value]) => values.set(key, String(value)));

  const orderedKeys = [
    "MERREISCOIN_TESTNET_ENABLED",
    "MERREISCOIN_NETWORK",
    "MERREISCOIN_CHAIN_ID",
    "MERREISCOIN_RPC_URL",
    "MERREISCOIN_EXPLORER_URL",
    "MERREISCOIN_CONTRACT_ADDRESS",
    "MERREISCOIN_DECIMALS",
    "MERREISCOIN_MAX_SUPPLY",
    "MERREISCOIN_DEPLOYER_PRIVATE_KEY",
    "MERREISCOIN_OWNER_ADDRESS",
    "MERREISCOIN_MINT_TO",
    "MERREISCOIN_MINT_AMOUNT",
    "MERREISCOIN_MINT_REASON"
  ];
  const seen = new Set();
  const lines = [
    "# Local MerreisCoin sandbox config. Git ignored.",
    "# Keep private keys only here or in your shell, never in chat.",
    ""
  ];

  orderedKeys.forEach((key) => {
    if (!values.has(key)) return;
    seen.add(key);
    lines.push(`${key}=${values.get(key)}`);
  });
  values.forEach((value, key) => {
    if (seen.has(key)) return;
    lines.push(`${key}=${value}`);
  });

  fs.writeFileSync(LOCAL_ENV_PATH, `${lines.join("\n")}\n`);
}

function main() {
  loadEnvFile(ROOT_DIR);
  const network = merreisCoinNetworkConfig();
  const deploymentFile = path.join(DEPLOYMENTS_DIR, `merreiscoin-${network.chainId}.json`);
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment nao encontrado: ${path.relative(ROOT_DIR, deploymentFile)}. Rode npm.cmd run crypto:deploy primeiro.`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  writeLocalEnv({
    MERREISCOIN_TESTNET_ENABLED: "true",
    MERREISCOIN_NETWORK: deployment.network || network.name,
    MERREISCOIN_CHAIN_ID: deployment.chainId || network.chainId,
    MERREISCOIN_RPC_URL: network.rpcUrl,
    MERREISCOIN_EXPLORER_URL: deployment.explorerUrl || network.explorerUrl,
    MERREISCOIN_CONTRACT_ADDRESS: deployment.address,
    MERREISCOIN_DECIMALS: deployment.decimals,
    MERREISCOIN_MAX_SUPPLY: deployment.maxSupplyDisplay || process.env.MERREISCOIN_MAX_SUPPLY || "1000000000"
  });

  console.log(`MerreisCoin testnet ativada em ${path.relative(ROOT_DIR, LOCAL_ENV_PATH)}`);
  console.log(`Contrato: ${deployment.address}`);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
