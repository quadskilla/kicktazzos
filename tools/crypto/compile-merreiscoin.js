"use strict";

const fs = require("node:fs");
const path = require("node:path");
const solc = require("solc");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const CONTRACT_FILE = path.join(ROOT_DIR, "contracts", "MerreisCoin.sol");
const ARTIFACT_DIR = path.join(ROOT_DIR, "artifacts", "contracts");
const ARTIFACT_FILE = path.join(ARTIFACT_DIR, "MerreisCoin.json");

function findImports(importPath) {
  const candidates = [
    path.resolve(ROOT_DIR, importPath),
    path.resolve(ROOT_DIR, "contracts", importPath),
    path.resolve(ROOT_DIR, "node_modules", importPath)
  ];
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) return { error: `Import nao encontrado: ${importPath}` };
  return { contents: fs.readFileSync(filePath, "utf8") };
}

function compile() {
  const source = fs.readFileSync(CONTRACT_FILE, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      "contracts/MerreisCoin.sol": { content: source }
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"]
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  const errors = output.errors || [];
  errors.forEach((entry) => {
    const line = entry.formattedMessage || entry.message;
    if (entry.severity === "error") console.error(line);
    else console.warn(line);
  });
  if (errors.some((entry) => entry.severity === "error")) process.exit(1);

  const contract = output.contracts?.["contracts/MerreisCoin.sol"]?.MerreisCoin;
  if (!contract?.abi || !contract?.evm?.bytecode?.object) {
    throw new Error("Compilacao nao gerou artefato MerreisCoin.");
  }

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const artifact = {
    contractName: "MerreisCoin",
    sourceName: "contracts/MerreisCoin.sol",
    compilerVersion: solc.version(),
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
    deployedBytecode: `0x${contract.evm.deployedBytecode.object}`
  };
  fs.writeFileSync(ARTIFACT_FILE, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(`MerreisCoin compilado em ${path.relative(ROOT_DIR, ARTIFACT_FILE)}`);
  return artifact;
}

if (require.main === module) {
  compile();
}

module.exports = { ARTIFACT_FILE, compile };
