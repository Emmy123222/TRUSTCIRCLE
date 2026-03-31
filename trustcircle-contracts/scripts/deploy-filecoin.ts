import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("\n📦 Deploying TrustCircle Filecoin contracts to Calibration testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // ─── Deploy FilecoinContentRegistry ──────────────────────────────
  console.log("📋 Deploying FilecoinContentRegistry...");
  const Registry = await ethers.getContractFactory("FilecoinContentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`   ✅ FilecoinContentRegistry deployed: ${registryAddr}`);

  // ─── Register initial content types ──────────────────────────────
  console.log("\n📝 Registering example agent manifest on Filecoin...");
  // In real deployment: first upload agent.json to Storacha, get CID, then register
  // const agentManifestCID = "bafybeig..."; // From Storacha upload
  // const tx = await registry.registerContent(7, agentManifestCID, 2048);
  // await tx.wait();
  console.log("   ⚠️  Upload agent.json to Storacha first, then register CID");

  // ─── Save deployment ─────────────────────────────────────────────
  const deployments = {
    network: "calibrationnet",
    chainId: 314159,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      FilecoinContentRegistry: registryAddr,
    },
  };

  const outPath = path.join(__dirname, "../deployments/calibrationnet.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));

  console.log("\n✅ FilecoinContentRegistry deployed!");
  console.log(`Address: ${registryAddr}`);
  console.log(`Explorer: https://calibration.filfox.info/address/${registryAddr}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
