// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EncryptedDM
 * @notice End-to-end encrypted direct messages using Zama fhEVM.
 *         Message content stored on Filecoin (contentCID).
 *         AES key stored as euint256 — separate copies for sender and recipient.
 */
contract EncryptedDM is Ownable {

    event MessageSent(uint256 indexed msgId, address indexed from, address indexed to, uint256 timestamp);
    event MessageDeleted(uint256 indexed msgId);
    event ThreadCreated(bytes32 indexed threadId, address indexed a, address indexed b);

    struct Message {
        uint256 id;
        address from;
        address to;
        bytes32 threadId;
        string contentCID;
        uint256 timestamp;
        bool deleted;
        bool exists;
    }

    mapping(uint256 => Message) public messages;
    mapping(uint256 => euint256) private _senderKeys;
    mapping(uint256 => euint256) private _recipientKeys;
    mapping(bytes32 => uint256[]) public threadMessages;
    mapping(address => bytes32[]) public userThreads;
    mapping(bytes32 => bool) public threadExists;

    uint256 private _msgCounter;

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Get deterministic thread ID for two addresses (order-independent).
     */
    function getThreadId(address a, address b) public pure returns (bytes32) {
        if (uint160(a) < uint160(b)) return keccak256(abi.encodePacked(a, b));
        return keccak256(abi.encodePacked(b, a));
    }

    /**
     * @notice Send an encrypted DM.
     *         contentCID  → Filecoin (AES-encrypted message blob)
     *         encSenderKey   → AES key encrypted for sender as euint256
     *         encRecipKey    → AES key encrypted for recipient as euint256
     *         inputProof     → fhevmjs proof bytes
     */
    function sendMessage(
        address to,
        string calldata contentCID,
        externalEuint256 encSenderKey,
        externalEuint256 encRecipKey,
        bytes calldata inputProof
    ) external returns (uint256) {
        require(to != msg.sender, "EncryptedDM: cannot DM yourself");
        require(to != address(0), "EncryptedDM: invalid recipient");

        bytes32 threadId = getThreadId(msg.sender, to);
        if (!threadExists[threadId]) {
            threadExists[threadId] = true;
            userThreads[msg.sender].push(threadId);
            userThreads[to].push(threadId);
            emit ThreadCreated(threadId, msg.sender, to);
        }

        euint256 sKey = FHE.fromExternal(encSenderKey, inputProof);
        euint256 rKey = FHE.fromExternal(encRecipKey,  inputProof);

        uint256 msgId = ++_msgCounter;

        messages[msgId] = Message({
            id: msgId, from: msg.sender, to: to,
            threadId: threadId, contentCID: contentCID,
            timestamp: block.timestamp, deleted: false, exists: true
        });

        _senderKeys[msgId]    = sKey;
        _recipientKeys[msgId] = rKey;

        FHE.allow(sKey, msg.sender);
        FHE.allow(rKey, to);

        threadMessages[threadId].push(msgId);
        emit MessageSent(msgId, msg.sender, to, block.timestamp);
        return msgId;
    }

    /**
     * @notice Soft-delete a message. Zeroes out both keys so content is unrecoverable.
     */
    function deleteMessage(uint256 msgId) external {
        Message storage m = messages[msgId];
        require(m.exists && !m.deleted, "EncryptedDM: not found");
        require(m.from == msg.sender || m.to == msg.sender, "EncryptedDM: unauthorized");

        m.deleted = true;
        _senderKeys[msgId]    = FHE.asEuint256(0);
        _recipientKeys[msgId] = FHE.asEuint256(0);
        emit MessageDeleted(msgId);
    }

    function getThreadMessages(bytes32 threadId) external view returns (uint256[] memory) {
        return threadMessages[threadId];
    }

    function getUserThreads(address user) external view returns (bytes32[] memory) {
        return userThreads[user];
    }
}