/**
 * filecoin-storage.js
 * Helper for uploading/retrieving content via Storacha (Filecoin)
 * Used by both the AI agent and the frontend integration layer.
 */

const { create } = require("@storacha/client");
const { parse } = require("@ipld/dag-ucan/did");
require("dotenv").config();

class FilecoinStorage {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    try {
      this.client = await create();
      // Set the space where files will be stored
      if (process.env.STORACHA_SPACE_DID) {
        await this.client.setCurrentSpace(process.env.STORACHA_SPACE_DID);
      }
      this.initialized = true;
      console.log("✅ Storacha client initialized");
    } catch (err) {
      console.error("❌ Storacha init failed:", err.message);
      throw err;
    }
  }

  /**
   * Upload a JSON object to Filecoin via Storacha
   * @param {Object} data - JSON data to upload
   * @param {string} filename - File name for the upload
   * @returns {string} CID of the uploaded content
   */
  async uploadJSON(data, filename) {
    await this.initialize();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const file = new File([blob], filename, { type: "application/json" });
    const cid = await this.client.uploadFile(file);
    return cid.toString();
  }

  /**
   * Upload raw text content (e.g., encrypted post content)
   */
  async uploadText(text, filename) {
    await this.initialize();
    const blob = new Blob([text], { type: "text/plain" });
    const file = new File([blob], filename);
    const cid = await this.client.uploadFile(file);
    return cid.toString();
  }

  /**
   * Upload a directory of files (e.g., agent manifest + logs)
   */
  async uploadDirectory(files) {
    await this.initialize();
    const cid = await this.client.uploadDirectory(files);
    return cid.toString();
  }

  /**
   * Retrieve content from Filecoin by CID
   * Uses the w3s gateway for retrieval
   */
  async retrieve(cid) {
    const url = `https://${cid}.ipfs.w3s.link`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to retrieve CID ${cid}: ${response.status}`);
    return response.json();
  }

  /**
   * Upload agent.json manifest to Filecoin
   */
  async uploadAgentManifest(manifest) {
    const cid = await this.uploadJSON(manifest, "agent.json");
    console.log(`📦 Agent manifest uploaded: ${cid}`);
    return cid;
  }

  /**
   * Upload agent_log.json execution log to Filecoin
   */
  async uploadAgentLog(log) {
    const cid = await this.uploadJSON(log, "agent_log.json");
    console.log(`📋 Agent log uploaded: ${cid}`);
    return cid;
  }

  /**
   * Upload encrypted post content
   * Content is pre-encrypted client-side with AES-256.
   * The decryption key is stored on Sepolia via Zama fhEVM.
   */
  async uploadEncryptedPost(encryptedContent, postId) {
    const cid = await this.uploadText(encryptedContent, `post_${postId}.enc`);
    console.log(`🔐 Encrypted post uploaded: ${cid}`);
    return cid;
  }

  /**
   * Get gateway URL for a CID (for frontend display)
   */
  getGatewayUrl(cid) {
    return `https://${cid}.ipfs.w3s.link`;
  }
}

module.exports = new FilecoinStorage();
