// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TrustScore
 * @notice Encrypted on-chain reputation using Zama fhEVM.
 *         Scores stored as euint32 — no one reads raw values without permission.
 * @dev Deployed on Sepolia via Zama fhEVM coprocessor.
 */
contract TrustScore is Ownable, ReentrancyGuard {

    event ProfileCreated(address indexed user, uint256 timestamp);
    event ScoreUpdated(address indexed user, uint256 timestamp);
    event TierChanged(address indexed user, TrustTier newTier);
    event BadgeAwarded(address indexed user, uint8 badgeId);

    enum TrustTier { Rising, Trusted, Verified, Genesis }

    struct EncryptedReputation {
        euint32 onChainActivity;
        euint32 communityVotes;
        euint32 holdingHistory;
        euint32 contractInteractions;
        euint32 ageScore;
        euint32 totalScore;
        uint256 lastUpdated;
    }

    struct PublicProfile {
        address wallet;
        string handle;
        TrustTier tier;
        bool isVerified;
        uint256 onChainSince;
        uint256 txCount;
        uint8[] badges;
        bool exists;
    }

    mapping(address => EncryptedReputation) private _reputations;
    mapping(address => PublicProfile) public profiles;
    mapping(address => mapping(address => bool)) public scoreViewPermission;

    uint32 public constant TRUSTED_THRESHOLD  = 400;
    uint32 public constant VERIFIED_THRESHOLD = 600;
    uint32 public constant GENESIS_THRESHOLD  = 800;

    uint32 public constant WEIGHT_ACTIVITY   = 25;
    uint32 public constant WEIGHT_VOTES      = 20;
    uint32 public constant WEIGHT_HOLDING    = 20;
    uint32 public constant WEIGHT_CONTRACTS  = 20;
    uint32 public constant WEIGHT_AGE        = 15;

    modifier profileExists(address user) {
        require(profiles[user].exists, "TrustScore: profile not found");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create profile with fhEVM-encrypted scores.
     * @param encActivity    externalEuint32 handle from fhevmjs
     * @param inputProof     proof bytes from fhevmjs .encrypt()
     */
    function createProfile(
        string calldata handle,
        uint256 onChainSince,
        externalEuint32 encActivity,
        externalEuint32 encVotes,
        externalEuint32 encHolding,
        externalEuint32 encContracts,
        externalEuint32 encAge,
        bytes calldata inputProof
    ) external nonReentrant {
        require(!profiles[msg.sender].exists, "TrustScore: already exists");
        require(bytes(handle).length > 0 && bytes(handle).length <= 32, "TrustScore: invalid handle");

        euint32 activity  = FHE.fromExternal(encActivity,  inputProof);
        euint32 votes     = FHE.fromExternal(encVotes,     inputProof);
        euint32 holding   = FHE.fromExternal(encHolding,   inputProof);
        euint32 contracts = FHE.fromExternal(encContracts, inputProof);
        euint32 age       = FHE.fromExternal(encAge,       inputProof);

        euint32 total = _computeWeightedScore(activity, votes, holding, contracts, age);

        _reputations[msg.sender] = EncryptedReputation({
            onChainActivity: activity,
            communityVotes: votes,
            holdingHistory: holding,
            contractInteractions: contracts,
            ageScore: age,
            totalScore: total,
            lastUpdated: block.timestamp
        });

        // Grant access permissions
        FHE.allow(total, msg.sender);
        FHE.allow(total, owner());

        profiles[msg.sender] = PublicProfile({
            wallet: msg.sender,
            handle: handle,
            tier: TrustTier.Rising,
            isVerified: false,
            onChainSince: onChainSince,
            txCount: 0,
            badges: new uint8[](0),
            exists: true
        });

        emit ProfileCreated(msg.sender, block.timestamp);
    }

    /**
     * @notice Update scores. Only user or owner.
     */
    function updateScores(
        address user,
        externalEuint32 encActivity,
        externalEuint32 encVotes,
        externalEuint32 encHolding,
        externalEuint32 encContracts,
        externalEuint32 encAge,
        bytes calldata inputProof
    ) external profileExists(user) {
        require(msg.sender == user || msg.sender == owner(), "TrustScore: unauthorized");

        euint32 activity  = FHE.fromExternal(encActivity,  inputProof);
        euint32 votes     = FHE.fromExternal(encVotes,     inputProof);
        euint32 holding   = FHE.fromExternal(encHolding,   inputProof);
        euint32 contracts = FHE.fromExternal(encContracts, inputProof);
        euint32 age       = FHE.fromExternal(encAge,       inputProof);

        euint32 total = _computeWeightedScore(activity, votes, holding, contracts, age);

        _reputations[user] = EncryptedReputation({
            onChainActivity: activity,
            communityVotes: votes,
            holdingHistory: holding,
            contractInteractions: contracts,
            ageScore: age,
            totalScore: total,
            lastUpdated: block.timestamp
        });

        FHE.allow(total, user);
        FHE.allow(total, owner());

        emit ScoreUpdated(user, block.timestamp);
    }

    /**
     * @notice Homomorphic threshold check — returns ebool, never reveals score.
     */
    function meetsThreshold(address user, euint32 minScore) external profileExists(user) returns (ebool) {
        return FHE.ge(_reputations[user].totalScore, minScore);
    }

    /**
     * @notice Grant another address read permission for your score.
     */
    function grantViewPermission(address viewer) external profileExists(msg.sender) {
        scoreViewPermission[msg.sender][viewer] = true;
        FHE.allow(_reputations[msg.sender].totalScore, viewer);
    }

    function revokeViewPermission(address viewer) external {
        scoreViewPermission[msg.sender][viewer] = false;
    }

    function awardBadge(address user, uint8 badgeId) external onlyOwner profileExists(user) {
        profiles[user].badges.push(badgeId);
        emit BadgeAwarded(user, badgeId);
    }

    function getUserBadges(address user) external view returns (uint8[] memory) {
        return profiles[user].badges;
    }

    function updateTier(address user, TrustTier newTier) external onlyOwner profileExists(user) {
        profiles[user].tier = newTier;
        emit TierChanged(user, newTier);
    }

    /**
     * @dev Weighted total computed fully homomorphically.
     *      total = (a*25 + v*20 + h*20 + c*20 + age*15) / 10  → max 1000
     */
    function _computeWeightedScore(
        euint32 activity,
        euint32 votes,
        euint32 holding,
        euint32 contracts,
        euint32 age
    ) internal returns (euint32) {
        euint32 w1 = FHE.mul(activity,  FHE.asEuint32(WEIGHT_ACTIVITY));
        euint32 w2 = FHE.mul(votes,     FHE.asEuint32(WEIGHT_VOTES));
        euint32 w3 = FHE.mul(holding,   FHE.asEuint32(WEIGHT_HOLDING));
        euint32 w4 = FHE.mul(contracts, FHE.asEuint32(WEIGHT_CONTRACTS));
        euint32 w5 = FHE.mul(age,       FHE.asEuint32(WEIGHT_AGE));

        euint32 sum = FHE.add(FHE.add(FHE.add(FHE.add(w1, w2), w3), w4), w5);
        return FHE.div(sum, 10);
    }
}