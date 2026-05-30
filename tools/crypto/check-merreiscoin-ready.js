"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { ethers } = require("ethers");
const { ARTIFACT_FILE, compile } = require("./compile-merreiscoin");
const { loadEnvFile, merreisCoinNetworkConfig, optionalInt } = require("./env");

const ROOT_DIR = path.resolve(__dirname, "..", "..");

function formatEth(value) {
  return Number(ethers.formatEther(value)).toLocaleString("pt-BR", {
    maximumFractionDigits: 8
  });
}

async function main() {
  loadEnvFile(ROOT_DIR);

  const network = merreisCoinNetworkConfig();
  const provider = new ethers.JsonRpcProvider(network.rpcUrl, network.chainId);
  const actualNetwork = await provider.getNetwork();
  const actualChainId = Number(actualNetwork.chainId);

  console.log(`Rede configurada: ${network.name} (${network.chainId})`);
  console.log(`RPC: ${network.rpcUrl}`);
  if (actualChainId !== network.chainId) {
    throw new Error(`RPC respondeu chain ${actualChainId}, mas MERREISCOIN_CHAIN_ID=${network.chainId}.`);
  }
  console.log("RPC OK");

  const privateKey = String(process.env.MERREISCOIN_DEPLOYER_PRIVATE_KEY || "").trim();
  if (!privateKey) {
    console.log("Deployer: nao configurado ainda em MERREISCOIN_DEPLOYER_PRIVATE_KEY.");
  } else {
    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Deployer: ${wallet.address}`);
    console.log(`Saldo: ${formatEth(balance)} ETH testnet`);
    if (balance === 0n) {
      console.log("Aviso: essa wallet ainda precisa de ETH da faucet para fazer deploy.");
    }
  }

  const contractAddress = String(process.env.MERREISCOIN_CONTRACT_ADDRESS || "").trim();
  if (!contractAddress) {
    console.log("Contrato: ainda nao configurado.");
    return;
  }
  if (!ethers.isAddress(contractAddress)) {
    throw new Error(`MERREISCOIN_CONTRACT_ADDRESS invalido: ${contractAddress}`);
  }

  if (!fs.existsSync(ARTIFACT_FILE)) compile();
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_FILE, "utf8"));
  const code = await provider.getCode(contractAddress);
  if (code === "0x") {
    throw new Error(`Nao existe contrato em ${contractAddress} na rede ${network.name}.`);
  }

  const decimals = optionalInt("MERREISCOIN_DECIMALS", 0);
  const contract = new ethers.Contract(contractAddress, artifact.abi, provider);
  const [name, symbol, onchainDecimals] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals()
  ]);
  console.log(`Contrato: ${contractAddress}`);
  console.log(`Token: ${name} (${symbol}), decimals=${onchainDecimals}`);
  if (Number(onchainDecimals) !== decimals) {
    console.log(`Aviso: .env usa MERREISCOIN_DECIMALS=${decimals}, mas o contrato usa ${onchainDecimals}.`);
  }
  console.log(`${network.explorerUrl}/address/${contractAddress}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
