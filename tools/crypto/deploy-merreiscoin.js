"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { ethers } = require("ethers");
const { ARTIFACT_FILE, compile } = require("./compile-merreiscoin");
const { loadEnvFile, merreisCoinNetworkConfig, optionalInt, requiredEnv } = require("./env");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const DEPLOYMENTS_DIR = path.join(ROOT_DIR, "deployments");

function parseTokenUnits(value, decimals) {
  return ethers.parseUnits(String(value), decimals);
}

async function main() {
  loadEnvFile(ROOT_DIR);
  if (!fs.existsSync(ARTIFACT_FILE)) compile();

  const network = merreisCoinNetworkConfig();
  const privateKey = requiredEnv("MERREISCOIN_DEPLOYER_PRIVATE_KEY");
  const decimals = optionalInt("MERREISCOIN_DECIMALS", 0);
  const maxSupplyText = String(process.env.MERREISCOIN_MAX_SUPPLY || "1000000000").trim();
  const provider = new ethers.JsonRpcProvider(network.rpcUrl, network.chainId);
  const wallet = new ethers.Wallet(privateKey, provider);
  const owner = String(process.env.MERREISCOIN_OWNER_ADDRESS || wallet.address).trim();
  const maxSupply = parseTokenUnits(maxSupplyText, decimals);
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_FILE, "utf8"));

  const actualNetwork = await provider.getNetwork();
  if (Number(actualNetwork.chainId) !== network.chainId) {
    throw new Error(`RPC em chain ${actualNetwork.chainId}, mas MERREISCOIN_CHAIN_ID=${network.chainId}.`);
  }

  console.log(`Deploy MerreisCoin em ${network.name} (${network.chainId})`);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Owner:    ${owner}`);
  console.log(`Decimals: ${decimals}`);
  console.log(`Cap:      ${maxSupplyText} MER`);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(owner, decimals, maxSupply);
  const tx = contract.deploymentTransaction();
  console.log(`Tx:       ${tx?.hash || "pendente"}`);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`Address:  ${address}`);

  fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  const deployment = {
    contract: "MerreisCoin",
    address,
    owner,
    deployer: wallet.address,
    chainId: network.chainId,
    network: network.name,
    explorerUrl: network.explorerUrl,
    decimals,
    maxSupply: maxSupply.toString(),
    maxSupplyDisplay: maxSupplyText,
    transactionHash: tx?.hash || "",
    deployedAt: new Date().toISOString()
  };
  const filePath = path.join(DEPLOYMENTS_DIR, `merreiscoin-${network.chainId}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(`Deployment salvo em ${path.relative(ROOT_DIR, filePath)}`);
  console.log("");
  console.log("Para ligar no jogo, coloque no .env:");
  console.log("MERREISCOIN_TESTNET_ENABLED=true");
  console.log(`MERREISCOIN_CONTRACT_ADDRESS=${address}`);
  console.log(`MERREISCOIN_CHAIN_ID=${network.chainId}`);
  console.log(`MERREISCOIN_NETWORK=${network.name}`);
  console.log(`MERREISCOIN_EXPLORER_URL=${network.explorerUrl}`);
  console.log(`MERREISCOIN_DECIMALS=${decimals}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
