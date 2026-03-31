import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("\n🔐 Deploying TrustCircle Zama fhEVM contracts to Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // ─── 1. Deploy TrustScore ────────────────────────────────────────
  console.log("📊 Deploying TrustScore (fhEVM)...");
  const TrustScore = await ethers.getContractFactory("TrustScore");
  const trustScore = await TrustScore.deploy();
  await trustScore.waitForDeployment();
  const trustScoreAddr = await trustScore.getAddress();
  console.log(`   ✅ TrustScore deployed: ${trustScoreAddr}`);

  // ─── 2. Deploy EncryptedPosts ─────────────────────────────────────
  console.log("📝 Deploying EncryptedPosts (fhEVM)...");
  const EncryptedPosts = await ethers.getContractFactory("EncryptedPosts");
  const encryptedPosts = await EncryptedPosts.deploy();
  await encryptedPosts.waitForDeployment();
  const encryptedPostsAddr = await encryptedPosts.getAddress();
  console.log(`   ✅ EncryptedPosts deployed: ${encryptedPostsAddr}`);

  // ─── 3. Deploy EncryptedDM ────────────────────────────────────────
  console.log("💬 Deploying EncryptedDM (fhEVM)...");
  const EncryptedDM = await ethers.getContractFactory("EncryptedDM");
  const encryptedDM = await EncryptedDM.deploy();
  await encryptedDM.waitForDeployment();
  const encryptedDMAddr = await encryptedDM.getAddress();
  console.log(`   ✅ EncryptedDM deployed: ${encryptedDMAddr}`);

  // ─── 4. Deploy AgentRegistry (ERC-8004) ──────────────────────────
  console.log("🤖 Deploying AgentRegistry (ERC-8004)...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddr = await agentRegistry.getAddress();
  console.log(`   ✅ AgentRegistry deployed: ${agentRegistryAddr}`);

  // ─── 5. Register the AI Agent ────────────────────────────────────
  console.log("\n🤖 Registering TrustAgent with ERC-8004 identity...");
  const agentManifestCID = "bafybeig_PLACEHOLDER_MANIFEST_CID"; // Replace after uploading to Filecoin
  const tx = await agentRegistry.registerAgent("TrustAgent v1.0", agentManifestCID);
  const receipt = await tx.wait();
  console.log(`   ✅ Agent registered in tx: ${receipt?.hash}`);

  // ─── 6. Save deployment addresses ───────────────────────────────
  const deployments = {
    network: "sepolia",
    chainId: 11155111,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      TrustScore: trustScoreAddr,
      EncryptedPosts: encryptedPostsAddr,
      EncryptedDM: encryptedDMAddr,
      AgentRegistry: agentRegistryAddr,
    },
  };

  const outPath = path.join(__dirname, "../deployments/sepolia.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));
  console.log(`\n📁 Deployment addresses saved to deployments/sepolia.json`);

  // ─── Summary ─────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE");
  console.log("─".repeat(60));
  console.log(`TrustScore:      ${trustScoreAddr}`);
  console.log(`EncryptedPosts:  ${encryptedPostsAddr}`);
  console.log(`EncryptedDM:     ${encryptedDMAddr}`);
  console.log(`AgentRegistry:   ${agentRegistryAddr}`);
  console.log("─".repeat(60));
  console.log("\n🔍 Verify on Etherscan:");
  console.log(`npx hardhat verify --network sepolia ${trustScoreAddr}`);
  console.log(`npx hardhat verify --network sepolia ${encryptedPostsAddr} "${trustScoreAddr}"`);
  console.log(`npx hardhat verify --network sepolia ${encryptedDMAddr}`);
  console.log(`npx hardhat verify --network sepolia ${agentRegistryAddr}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
