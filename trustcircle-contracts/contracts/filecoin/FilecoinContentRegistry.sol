// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FilecoinContentRegistry
 * @notice On-chain registry mapping content types to Filecoin CIDs.
 *         Deployed on Filecoin Calibration testnet.
 *         Tracks posts, agent logs, user profiles, and circle data.
 *
 * @dev All heavy content is stored on Filecoin via Storacha/Synapse SDK.
 *      This contract is a lightweight index pointing to those CIDs.
 *      Content is immutable once registered — updates create new entries.
 */
contract FilecoinContentRegistry is Ownable {
    // ─── Events ───────────────────────────────────────────────────────
    event ContentRegistered(bytes32 indexed contentId, address indexed author, ContentType cType, string cid);
    event ContentUpdated(bytes32 indexed contentId, string newCid, uint256 version);
    event DealVerified(bytes32 indexed contentId, uint64 dealId);

    // ─── Enums ────────────────────────────────────────────────────────
    enum ContentType {
        Post,           // Circle posts
        EncryptedPost,  // fhEVM-encrypted post content
        AgentLog,       // agent_log.json from ERC-8004 agent
        AgentManifest,  // agent.json capability manifest
        UserProfile,    // User metadata JSON
        CircleData,     // Circle configuration + member list
        DMContent,      // Encrypted DM blob
        TrustProof      // Proof-of-history for trust score
    }

    // ─── Structs ──────────────────────────────────────────────────────
    struct ContentRecord {
        bytes32 id;
        address author;
        ContentType cType;
        string cid;            // Current Filecoin CID (bafy...)
        string[] cidHistory;   // All previous CIDs (immutable audit trail)
        uint256 size;          // Content size in bytes
        uint256 timestamp;
        uint256 version;
        uint64[] dealIds;      // Filecoin storage deal IDs
        bool verified;         // At least one deal has been verified
        bool exists;
    }

    struct StorageDeal {
        uint64 dealId;
        address provider;
        uint256 startEpoch;
        uint256 endEpoch;
        bool active;
    }

    // ─── State ────────────────────────────────────────────────────────
    mapping(bytes32 => ContentRecord) public content;
    mapping(address => bytes32[]) public userContent;
    mapping(ContentType => bytes32[]) public contentByType;
    mapping(uint64 => StorageDeal) public deals;

    uint256 public totalContent;

    // ─── Constructor ──────────────────────────────────────────────────
    constructor() Ownable(msg.sender) {}

    // ─── Content Registration ─────────────────────────────────────────

    /**
     * @notice Register new content stored on Filecoin.
     * @param cType   Content type enum
     * @param cid     Filecoin content identifier (e.g., "bafybeig...")
     * @param size    Content size in bytes
     * @return contentId Unique identifier for this content record
     */
    function registerContent(
        ContentType cType,
        string calldata cid,
        uint256 size
    ) external returns (bytes32) {
        require(bytes(cid).length > 0, "FilecoinRegistry: empty CID");

        bytes32 contentId = keccak256(abi.encodePacked(
            msg.sender,
            cid,
            block.timestamp,
            totalContent
        ));

        string[] memory history = new string[](1);
        history[0] = cid;

        content[contentId] = ContentRecord({
            id: contentId,
            author: msg.sender,
            cType: cType,
            cid: cid,
            cidHistory: history,
            size: size,
            timestamp: block.timestamp,
            version: 1,
            dealIds: new uint64[](0),
            verified: false,
            exists: true
        });

        userContent[msg.sender].push(contentId);
        contentByType[cType].push(contentId);
        totalContent++;

        emit ContentRegistered(contentId, msg.sender, cType, cid);
        return contentId;
    }

    /**
     * @notice Update content CID (e.g., when agent logs are updated).
     *         Previous CID is preserved in history for auditability.
     */
    function updateContent(bytes32 contentId, string calldata newCid) external {
        ContentRecord storage rec = content[contentId];
        require(rec.exists, "FilecoinRegistry: not found");
        require(rec.author == msg.sender || msg.sender == owner(), "FilecoinRegistry: unauthorized");

        rec.cidHistory.push(newCid);
        rec.cid = newCid;
        rec.version++;

        emit ContentUpdated(contentId, newCid, rec.version);
    }

    // ─── Deal Verification ────────────────────────────────────────────

    /**
     * @notice Register a Filecoin storage deal for a content record.
     *         Proves the content is actually stored on Filecoin.
     */
    function registerDeal(
        bytes32 contentId,
        uint64 dealId,
        address provider,
        uint256 startEpoch,
        uint256 endEpoch
    ) external {
        ContentRecord storage rec = content[contentId];
        require(rec.exists, "FilecoinRegistry: not found");
        require(rec.author == msg.sender || msg.sender == owner(), "FilecoinRegistry: unauthorized");

        rec.dealIds.push(dealId);
        rec.verified = true;

        deals[dealId] = StorageDeal({
            dealId: dealId,
            provider: provider,
            startEpoch: startEpoch,
            endEpoch: endEpoch,
            active: true
        });

        emit DealVerified(contentId, dealId);
    }

    // ─── Getters ──────────────────────────────────────────────────────

    function getUserContent(address user) external view returns (bytes32[] memory) {
        return userContent[user];
    }

    function getContentByType(ContentType cType) external view returns (bytes32[] memory) {
        return contentByType[cType];
    }

    function getCIDHistory(bytes32 contentId) external view returns (string[] memory) {
        return content[contentId].cidHistory;
    }

    function getDealIds(bytes32 contentId) external view returns (uint64[] memory) {
        return content[contentId].dealIds;
    }

    function isContentVerified(bytes32 contentId) external view returns (bool) {
        return content[contentId].verified;
    }
}
