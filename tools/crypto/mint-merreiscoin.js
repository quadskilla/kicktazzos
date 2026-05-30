"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { ethers } = require("ethers");
const { ARTIFACT_FILE, compile } = require("./compile-merreiscoin");
const { loadEnvFile, merreisCoinNetworkConfig, optionalInt, requiredEnv } = require("./env");

const ROOT_DIR = path.resolve(__dirname, "..", "..");

async function main() {
  loadEnvFile(ROOT_DIR);
  if (!fs.existsSync(ARTIFACT_FILE)) compile();

  const to = requiredEnv("MERREISCOIN_MINT_TO");
  const amountText = requiredEnv("MERREISCOIN_MINT_AMOUNT");
  const reason = String(process.env.MERREISCOIN_MINT_REASON || "testnet grant").trim().slice(0, 120);
  const address = requiredEnv("MERREISCOIN_CONTRACT_ADDRESS");
  const privateKey = requiredEnv("MERREISCOIN_DEPLOYER_PRIVATE_KEY");
  const decimals = optionalInt("MERREISCOIN_DECIMALS", 0);
  const network = merreisCoinNetworkConfig();
  const provider = new ethers.JsonRpcProvider(network.rpcUrl, network.chainId);
  const wallet = new ethers.Wallet(privateKey, provider);
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_FILE, "utf8"));
  const contract = new ethers.Contract(address, artifact.abi, wallet);
  const amount = ethers.parseUnits(amountText, decimals);

  console.log(`Mint ${amountText} MER para ${to} em ${network.name}`);
  const tx = await contract.mint(to, amount, reason);
  console.log(`Tx: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Confirmado no bloco ${receipt.blockNumber}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
