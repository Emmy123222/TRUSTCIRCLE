#!/usr/bin/env node
/**
 * deploy-flow.js
 * Deploys TrustCircleSocial.cdc to Flow Testnet using the Flow CLI.
 *
 * Prerequisites:
 *   npm install -g @onflow/flow-cli
 *   flow accounts create --network testnet
 *
 * Usage:
 *   node scripts/deploy-flow.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const FLOW_NETWORK = process.env.FLOW_NETWORK || "testnet";
const FLOW_ACCOUNT = process.env.FLOW_ACCOUNT_ADDRESS;

if (!FLOW_ACCOUNT) {
  console.error("❌ Set FLOW_ACCOUNT_ADDRESS in .env");
  process.exit(1);
}

// ─── flow.json config ─────────────────────────────────────────────
const flowConfig = {
  networks: {
    testnet: "access.devnet.nodes.onflow.org:9000",
    mainnet: "access.mainnet.nodes.onflow.org:9000",
  },
  accounts: {
    "trustcircle-testnet": {
      address: FLOW_ACCOUNT,
      key: {
        type: "hex",
        index: 0,
        signatureAlgorithm: "ECDSA_P256",
        hashAlgorithm: "SHA3_256",
        privateKey: process.env.FLOW_PRIVATE_KEY,
      },
    },
  },
  contracts: {
    TrustCircleSocial: {
      source: "./cadence/contracts/TrustCircleSocial.cdc",
      aliases: {
        testnet: FLOW_ACCOUNT,
      },
    },
  },
  deployments: {
    testnet: {
      "trustcircle-testnet": ["TrustCircleSocial"],
    },
  },
};

// Write flow.json
fs.writeFileSync(
  path.join(__dirname, "../flow.json"),
  JSON.stringify(flowConfig, null, 2)
);
console.log("✅ flow.json written");

// ─── Deploy ───────────────────────────────────────────────────────
console.log(`\n🌊 Deploying to Flow ${FLOW_NETWORK}...\n`);

try {
  const output = execSync(
    `flow project deploy --network ${FLOW_NETWORK} --update`,
    { cwd: path.join(__dirname, ".."), stdio: "pipe" }
  ).toString();

  console.log(output);

  // Parse deployed address from output
  const match = output.match(/TrustCircleSocial.*?→\s*(0x[0-9a-fA-F]+)/);
  const contractAddress = match ? match[1] : FLOW_ACCOUNT;

  const deployment = {
    network: FLOW_NETWORK,
    deployedAt: new Date().toISOString(),
    deployer: FLOW_ACCOUNT,
    contracts: {
      TrustCircleSocial: contractAddress,
    },
  };

  const outPath = path.join(__dirname, `../deployments/flow-${FLOW_NETWORK}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));

  console.log("\n✅ Flow deployment complete!");
  console.log(`TrustCircleSocial: ${contractAddress}`);
  console.log(`Explorer: https://testnet.flowdiver.io/account/${contractAddress}`);
} catch (err) {
  console.error("❌ Flow deployment failed:", err.message);
  console.log("\n💡 Make sure you have flow-cli installed:");
  console.log("   npm install -g @onflow/flow-cli");
  console.log("   flow accounts create --network testnet");
}
