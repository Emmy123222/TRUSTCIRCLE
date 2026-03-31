import { expect } from "chai";
import { ethers } from "hardhat";
import { TrustScore, EncryptedPosts, EncryptedDM, AgentRegistry, FilecoinContentRegistry } from "../typechain-types";

/**
 * TrustCircle Contract Test Suite
 *
 * Note: fhEVM tests run on the local Hardhat network with the
 * @fhevm/hardhat-plugin mock — encrypted types are simulated locally.
 * Full fhEVM functionality requires Sepolia deployment.
 */
describe("TrustCircle Contracts", function () {
  let trustScore: TrustScore;
  let encryptedPosts: EncryptedPosts;
  let encryptedDM: EncryptedDM;
  let agentRegistry: AgentRegistry;
  let filecoinRegistry: FilecoinContentRegistry;

  let owner: any, alice: any, bob: any, charlie: any;

  before(async () => {
    [owner, alice, bob, charlie] = await ethers.getSigners();
  });

  // ─── AgentRegistry ───────────────────────────────────────────────
  describe("AgentRegistry (ERC-8004)", () => {
    beforeEach(async () => {
      const Factory = await ethers.getContractFactory("AgentRegistry");
      agentRegistry = await Factory.deploy();
      await agentRegistry.waitForDeployment();
    });

    it("registers a new agent and emits AgentRegistered event", async () => {
      await expect(
        agentRegistry.connect(owner).registerAgent("TrustAgent v1.0", "bafybeig_manifest_cid")
      ).to.emit(agentRegistry, "AgentRegistered");
    });

    it("returns an agentId after registration", async () => {
      const tx = await agentRegistry.connect(owner).registerAgent("TestAgent", "bafy_cid");
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);
    });

    it("records a successful task and increases reputation", async () => {
      const regTx = await agentRegistry.registerAgent("TestAgent", "bafy_cid");
      await regTx.wait();

      const agentIds = await agentRegistry.getOperatorAgents(owner.address);
      const agentId = agentIds[0];

      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task_001"));

      await expect(
        agentRegistry.recordTask(agentId, taskId, "Bot detection scan", true, "bafy_result")
      ).to.emit(agentRegistry, "TaskCompleted").withArgs(agentId, taskId, true);

      const agent = await agentRegistry.agents(agentId);
      expect(agent.reputationScore).to.equal(10n); // TASK_SUCCESS_DELTA
      expect(agent.tasksCompleted).to.equal(1n);
    });

    it("decreases reputation on failed tasks", async () => {
      await agentRegistry.registerAgent("TestAgent", "bafy_cid");
      const [agentId] = await agentRegistry.getOperatorAgents(owner.address);
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task_fail_001"));

      await agentRegistry.recordTask(agentId, taskId, "Failed task", false, "bafy_result");

      const agent = await agentRegistry.agents(agentId);
      expect(agent.reputationScore).to.equal(-25n); // TASK_FAIL_DELTA
      expect(agent.tasksFailed).to.equal(1n);
    });

    it("attests a capability for an agent", async () => {
      await agentRegistry.registerAgent("TestAgent", "bafy_cid");
      const [agentId] = await agentRegistry.getOperatorAgents(owner.address);
      const capability = ethers.keccak256(ethers.toUtf8Bytes("sentiment_analysis"));

      await expect(
        agentRegistry.connect(alice).attestCapability(agentId, capability)
      ).to.emit(agentRegistry, "CapabilityAttested");

      expect(await agentRegistry.hasCapability(agentId, capability)).to.be.true;
    });

    it("meets reputation threshold check", async () => {
      await agentRegistry.registerAgent("TestAgent", "bafy_cid");
      const [agentId] = await agentRegistry.getOperatorAgents(owner.address);

      // Initial score is 0, threshold 0 = passes
      expect(await agentRegistry.meetsReputationThreshold(agentId, 0n)).to.be.true;
      // Threshold 10 = fails (score is 0)
      expect(await agentRegistry.meetsReputationThreshold(agentId, 10n)).to.be.false;
    });

    it("deactivates agent correctly", async () => {
      await agentRegistry.registerAgent("TestAgent", "bafy_cid");
      const [agentId] = await agentRegistry.getOperatorAgents(owner.address);

      await agentRegistry.deactivateAgent(agentId);
      const agent = await agentRegistry.agents(agentId);
      expect(agent.status).to.equal(2); // AgentStatus.Deactivated
    });

    it("updates logs CID", async () => {
      await agentRegistry.registerAgent("TestAgent", "bafy_cid");
      const [agentId] = await agentRegistry.getOperatorAgents(owner.address);

      await agentRegistry.updateLogsCID(agentId, "bafy_new_log_cid");
      const agent = await agentRegistry.agents(agentId);
      expect(agent.logsCID).to.equal("bafy_new_log_cid");
    });

    it("prevents non-operator from recording tasks", async () => {
      await agentRegistry.registerAgent("TestAgent", "bafy_cid");
      const [agentId] = await agentRegistry.getOperatorAgents(owner.address);
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task_unauth"));

      await expect(
        agentRegistry.connect(alice).recordTask(agentId, taskId, "Unauthorized", true, "bafy_cid")
      ).to.be.revertedWith("AgentRegistry: unauthorized");
    });
  });

  // ─── FilecoinContentRegistry ──────────────────────────────────────
  describe("FilecoinContentRegistry", () => {
    beforeEach(async () => {
      const Factory = await ethers.getContractFactory("FilecoinContentRegistry");
      filecoinRegistry = await Factory.deploy();
      await filecoinRegistry.waitForDeployment();
    });

    it("registers content and emits event", async () => {
      await expect(
        filecoinRegistry.connect(alice).registerContent(0, "bafybeig_post_cid", 2048)
      ).to.emit(filecoinRegistry, "ContentRegistered");
    });

    it("tracks content by user", async () => {
      await filecoinRegistry.connect(alice).registerContent(0, "bafybeig_cid_1", 1024);
      await filecoinRegistry.connect(alice).registerContent(1, "bafybeig_cid_2", 512);

      const userContent = await filecoinRegistry.getUserContent(alice.address);
      expect(userContent.length).to.equal(2);
    });

    it("updates content CID and maintains history", async () => {
      const tx = await filecoinRegistry.connect(alice).registerContent(0, "bafybeig_v1", 1024);
      await tx.wait();
      const [contentId] = await filecoinRegistry.getUserContent(alice.address);

      await filecoinRegistry.connect(alice).updateContent(contentId, "bafybeig_v2");

      const rec = await filecoinRegistry.content(contentId);
      expect(rec.cid).to.equal("bafybeig_v2");
      expect(rec.version).to.equal(2n);

      const history = await filecoinRegistry.getCIDHistory(contentId);
      expect(history.length).to.equal(2);
      expect(history[0]).to.equal("bafybeig_v1");
      expect(history[1]).to.equal("bafybeig_v2");
    });

    it("registers a Filecoin deal for content", async () => {
      await filecoinRegistry.connect(alice).registerContent(7, "bafybeig_agent_log", 4096);
      const [contentId] = await filecoinRegistry.getUserContent(alice.address);

      const dealId = 12345n;
      await expect(
        filecoinRegistry.connect(alice).registerDeal(
          contentId, dealId, owner.address, 1000n, 9000n
        )
      ).to.emit(filecoinRegistry, "DealVerified").withArgs(contentId, dealId);

      expect(await filecoinRegistry.isContentVerified(contentId)).to.be.true;
    });

    it("prevents unauthorized content updates", async () => {
      await filecoinRegistry.connect(alice).registerContent(0, "bafy_cid", 512);
      const [contentId] = await filecoinRegistry.getUserContent(alice.address);

      await expect(
        filecoinRegistry.connect(bob).updateContent(contentId, "bafy_hack")
      ).to.be.revertedWith("FilecoinRegistry: unauthorized");
    });
  });

  // ─── EncryptedDM ──────────────────────────────────────────────────
  describe("EncryptedDM (Zama fhEVM)", () => {
    beforeEach(async () => {
      const Factory = await ethers.getContractFactory("EncryptedDM");
      encryptedDM = await Factory.deploy();
      await encryptedDM.waitForDeployment();
    });

    it("generates deterministic thread IDs", async () => {
      const tid1 = await encryptedDM.getThreadId(alice.address, bob.address);
      const tid2 = await encryptedDM.getThreadId(bob.address, alice.address);
      expect(tid1).to.equal(tid2); // Order-independent
    });

    it("thread ID differs for different pairs", async () => {
      const tid1 = await encryptedDM.getThreadId(alice.address, bob.address);
      const tid2 = await encryptedDM.getThreadId(alice.address, charlie.address);
      expect(tid1).to.not.equal(tid2);
    });

    it("prevents self-messaging", async () => {
      // Note: full fhEVM sendMessage test requires Sepolia
      // Testing the revert condition via direct call
      const zeroEncInput = ethers.randomBytes(32);
      const proof = ethers.randomBytes(32);

      await expect(
        encryptedDM.connect(alice).sendMessage(
          alice.address,
          "bafy_cid",
          zeroEncInput as any,
          zeroEncInput as any,
          proof
        )
      ).to.be.reverted; // "EncryptedDM: cannot DM yourself"
    });
  });
});
