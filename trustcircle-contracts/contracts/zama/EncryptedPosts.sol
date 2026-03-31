// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EncryptedPosts
 * @notice Posts with optional fhEVM encryption.
 *         Public posts: content CID on Filecoin, indexed here.
 *         Encrypted posts: AES key stored as euint256, gated by trust threshold.
 */
contract EncryptedPosts is Ownable {

    event PostCreated(uint256 indexed postId, address indexed author, bytes32 circleId, bool isEncrypted);
    event PostLiked(uint256 indexed postId, address indexed liker);
    event PostDeleted(uint256 indexed postId);
    event AccessGranted(uint256 indexed postId, address indexed viewer);

    struct Post {
        uint256 id;
        address author;
        bytes32 circleId;
        string contentCID;
        bool isEncrypted;
        uint32 minTrustRequired;
        uint256 timestamp;
        uint256 likes;
        uint256 replies;
        uint256 reposts;
        bool exists;
        bool deleted;
    }

    mapping(uint256 => Post) public posts;
    mapping(uint256 => euint256) private _postKeys;
    mapping(uint256 => mapping(address => euint256)) private _viewerKeys;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    mapping(address => uint256[]) public userPostIds;
    mapping(bytes32 => uint256[]) public circlePostIds;

    uint256 private _postCounter;

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create a public post. Content stored on Filecoin (contentCID).
     */
    function createPublicPost(
        bytes32 circleId,
        string calldata contentCID,
        uint32 minTrust
    ) external returns (uint256) {
        uint256 postId = ++_postCounter;

        posts[postId] = Post({
            id: postId, author: msg.sender, circleId: circleId,
            contentCID: contentCID, isEncrypted: false,
            minTrustRequired: minTrust, timestamp: block.timestamp,
            likes: 0, replies: 0, reposts: 0, exists: true, deleted: false
        });

        userPostIds[msg.sender].push(postId);
        circlePostIds[circleId].push(postId);
        emit PostCreated(postId, msg.sender, circleId, false);
        return postId;
    }

    /**
     * @notice Create an encrypted post.
     *         contentCID → Filecoin (encrypted blob)
     *         encKey     → AES-256 key encrypted as euint256 via fhevmjs
     */
    function createEncryptedPost(
        bytes32 circleId,
        string calldata contentCID,
        uint32 minTrust,
        externalEuint256 encKey,
        bytes calldata inputProof
    ) external returns (uint256) {
        uint256 postId = ++_postCounter;

        euint256 symKey = FHE.fromExternal(encKey, inputProof);

        posts[postId] = Post({
            id: postId, author: msg.sender, circleId: circleId,
            contentCID: contentCID, isEncrypted: true,
            minTrustRequired: minTrust, timestamp: block.timestamp,
            likes: 0, replies: 0, reposts: 0, exists: true, deleted: false
        });

        _postKeys[postId] = symKey;
        FHE.allow(symKey, msg.sender);
        FHE.allow(symKey, owner());

        userPostIds[msg.sender].push(postId);
        circlePostIds[circleId].push(postId);
        emit PostCreated(postId, msg.sender, circleId, true);
        return postId;
    }

    /**
     * @notice Request access to encrypted post.
     *         Caller must provide their trust score handle so we can check homomorphically.
     *         If qualifies: viewer receives a re-encrypted copy of the AES key.
     * @param trustHandle  euint32 handle of caller's trust score (from TrustScore contract)
     */
    function requestPostAccess(uint256 postId, euint32 trustHandle) external {
        Post storage post = posts[postId];
        require(post.exists && !post.deleted, "EncryptedPosts: not found");
        require(post.isEncrypted, "EncryptedPosts: not encrypted");

        euint32 threshold = FHE.asEuint32(post.minTrustRequired);
        ebool qualifies = FHE.ge(trustHandle, threshold);

        euint256 authorKey = _postKeys[postId];
        euint256 zero = FHE.asEuint256(0);

        // Conditionally grant key — if score >= threshold give key, else give 0
        euint256 viewerKey = FHE.select(qualifies, authorKey, zero);
        _viewerKeys[postId][msg.sender] = viewerKey;
        FHE.allow(viewerKey, msg.sender);

        emit AccessGranted(postId, msg.sender);
    }

    function likePost(uint256 postId) external {
        require(posts[postId].exists, "EncryptedPosts: not found");
        require(!hasLiked[postId][msg.sender], "EncryptedPosts: already liked");
        hasLiked[postId][msg.sender] = true;
        posts[postId].likes++;
        emit PostLiked(postId, msg.sender);
    }

    function unlikePost(uint256 postId) external {
        require(hasLiked[postId][msg.sender], "EncryptedPosts: not liked");
        hasLiked[postId][msg.sender] = false;
        posts[postId].likes--;
    }

    function deletePost(uint256 postId) external {
        require(posts[postId].author == msg.sender || msg.sender == owner(), "EncryptedPosts: not author");
        posts[postId].deleted = true;
        emit PostDeleted(postId);
    }

    function getCirclePosts(bytes32 circleId) external view returns (uint256[] memory) {
        return circlePostIds[circleId];
    }

    function getUserPosts(address user) external view returns (uint256[] memory) {
        return userPostIds[user];
    }
}