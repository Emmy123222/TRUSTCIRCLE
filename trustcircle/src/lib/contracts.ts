// Auto-generated ABI exports for TrustCircle contracts
// Used by frontend hooks to interact with deployed contracts

export const TRUST_SCORE_ABI = [
  // Profile management
  "function createProfile(string handle, uint256 onChainSince, bytes32 encActivity, bytes32 encVotes, bytes32 encHolding, bytes32 encContracts, bytes32 encAge, bytes calldata inputProof) external",
  "function profiles(address) view returns (address wallet, string handle, uint8 tier, bool isVerified, uint256 onChainSince, uint256 txCount, bool exists)",
  "function grantViewPermission(address viewer) external",
  "function revokeViewPermission(address viewer) external",
  "function getUserBadges(address user) view returns (uint8[])",
  "function awardBadge(address user, uint8 badgeId) external",
  "function updateScores(address user, bytes32 encActivity, bytes32 encVotes, bytes32 encHolding, bytes32 encContracts, bytes32 encAge, bytes calldata inputProof) external",
  "function updateTier(address user, uint8 newTier) external",
  "function scoreViewPermission(address, address) view returns (bool)",

  // Encrypted comparisons
  "function meetsThreshold(address user, bytes32 minScore) external returns (bytes32)",

  // Constants
  "function GENESIS_THRESHOLD() view returns (uint32)",
  "function TRUSTED_THRESHOLD() view returns (uint32)",
  "function VERIFIED_THRESHOLD() view returns (uint32)",
  "function WEIGHT_ACTIVITY() view returns (uint32)",
  "function WEIGHT_AGE() view returns (uint32)",
  "function WEIGHT_CONTRACTS() view returns (uint32)",
  "function WEIGHT_HOLDING() view returns (uint32)",
  "function WEIGHT_VOTES() view returns (uint32)",

  // Events
  "event ProfileCreated(address indexed user, uint256 timestamp)",
  "event ScoreUpdated(address indexed user, uint256 timestamp)",
  "event TierChanged(address indexed user, uint8 newTier)",
  "event BadgeAwarded(address indexed user, uint8 badgeId)",
] as const;

export const ENCRYPTED_POSTS_ABI = [
  "function createPublicPost(bytes32 circleId, string contentCID, uint32 minTrust) external returns (uint256)",
  "function createEncryptedPost(bytes32 circleId, string contentCID, uint32 minTrust, bytes32 encKey, bytes calldata inputProof) external returns (uint256)",
  "function requestPostAccess(uint256 postId, bytes32 trustHandle) external",
  "function likePost(uint256 postId) external",
  "function unlikePost(uint256 postId) external",
  "function deletePost(uint256 postId) external",
  "function getCirclePosts(bytes32 circleId) view returns (uint256[])",
  "function getUserPosts(address user) view returns (uint256[])",
  "function posts(uint256) view returns (uint256 id, address author, bytes32 circleId, string contentCID, bool isEncrypted, uint32 minTrustRequired, uint256 timestamp, uint256 likes, uint256 replies, uint256 reposts, bool exists, bool deleted)",
  "function hasLiked(uint256, address) view returns (bool)",
  "function circlePostIds(bytes32, uint256) view returns (uint256)",
  "function userPostIds(address, uint256) view returns (uint256)",

  "event PostCreated(uint256 indexed postId, address indexed author, bytes32 circleId, bool isEncrypted)",
  "event PostLiked(uint256 indexed postId, address indexed liker)",
  "event AccessGranted(uint256 indexed postId, address indexed viewer)",
  "event PostDeleted(uint256 indexed postId)",
] as const;

export const ENCRYPTED_DM_ABI = [
  "function sendMessage(address to, string contentCID, bytes32 encSenderKey, bytes32 encRecipKey, bytes calldata inputProof) external returns (uint256)",
  "function deleteMessage(uint256 msgId) external",
  "function getThreadId(address a, address b) pure returns (bytes32)",
  "function getThreadMessages(bytes32 threadId) view returns (uint256[])",
  "function getUserThreads(address user) view returns (bytes32[])",
  "function messages(uint256) view returns (uint256 id, address from, address to, bytes32 threadId, string contentCID, uint256 timestamp, bool deleted, bool exists)",

  "event MessageSent(uint256 indexed msgId, address indexed from, address indexed to, uint256 timestamp)",
  "event ThreadCreated(bytes32 indexed threadId, address indexed a, address indexed b)",
  "event MessageDeleted(uint256 indexed msgId)",
] as const;

export const AGENT_REGISTRY_ABI = [
  "function registerAgent(string name, string manifestCID) external returns (bytes32)",
  "function recordTask(bytes32 agentId, bytes32 taskId, string description, bool success, string resultCID) external",
  "function updateLogsCID(bytes32 agentId, string logsCID) external",
  "function adjustReputation(bytes32 agentId, int256 delta, string reason) external",
  "function attestCapability(bytes32 agentId, bytes32 capability) external",
  "function deactivateAgent(bytes32 agentId) external",
  "function meetsReputationThreshold(bytes32 agentId, int256 minRep) view returns (bool)",
  "function getOperatorAgents(address operator) view returns (bytes32[])",
  "function getAgentCapabilities(bytes32 agentId) view returns (bytes32[])",
  "function getAgentTasks(bytes32 agentId) view returns (tuple(bytes32 taskId, bytes32 agentId, string description, bool success, int256 reputationDelta, uint256 timestamp, string resultCID)[])",
  "function getTotalAgents() view returns (uint256)",
  "function agents(bytes32) view returns (bytes32 id, address operator, string name, string manifestCID, string logsCID, int256 reputationScore, uint256 tasksCompleted, uint256 tasksFailed, uint256 registeredAt, uint256 lastActive, uint8 status, bool exists)",
  "function hasCapability(bytes32, bytes32) view returns (bool)",
  "function agentCapabilities(bytes32, uint256) view returns (bytes32)",
  "function agentTasks(bytes32, uint256) view returns (bytes32 taskId, bytes32 agentId, string description, bool success, int256 reputationDelta, uint256 timestamp, string resultCID)",
  "function allAgentIds(uint256) view returns (bytes32)",
  "function operatorAgents(address, uint256) view returns (bytes32)",
  "function capabilityAttesters(bytes32, uint256) view returns (address)",

  // Constants
  "function MAX_REPUTATION() view returns (int256)",
  "function MIN_REPUTATION() view returns (int256)",
  "function SLASH_THRESHOLD() view returns (int256)",
  "function TASK_FAIL_DELTA() view returns (int256)",
  "function TASK_SUCCESS_DELTA() view returns (int256)",

  "event AgentRegistered(bytes32 indexed agentId, address indexed operator, string name)",
  "event ReputationUpdated(bytes32 indexed agentId, int256 delta, string reason)",
  "event CapabilityAttested(bytes32 indexed agentId, bytes32 capability, address attester)",
  "event TaskCompleted(bytes32 indexed agentId, bytes32 taskId, bool success)",
  "event AgentDeactivated(bytes32 indexed agentId)",
  "event AgentSlashed(bytes32 indexed agentId, uint256 amount, string reason)",
] as const;

export const FILECOIN_REGISTRY_ABI = [
  "function registerContent(uint8 cType, string cid, uint256 size) external returns (bytes32)",
  "function updateContent(bytes32 contentId, string newCid) external",
  "function registerDeal(bytes32 contentId, uint64 dealId, address provider, uint256 startEpoch, uint256 endEpoch) external",
  "function getUserContent(address user) view returns (bytes32[])",
  "function getContentByType(uint8 cType) view returns (bytes32[])",
  "function getCIDHistory(bytes32 contentId) view returns (string[])",
  "function getDealIds(bytes32 contentId) view returns (uint64[])",
  "function isContentVerified(bytes32 contentId) view returns (bool)",
  "function content(bytes32) view returns (bytes32 id, address author, uint8 cType, string cid, uint256 size, uint256 timestamp, uint256 version, bool verified, bool exists)",
  "function totalContent() view returns (uint256)",

  "event ContentRegistered(bytes32 indexed contentId, address indexed author, uint8 cType, string cid)",
  "event ContentUpdated(bytes32 indexed contentId, string newCid, uint256 version)",
  "event DealVerified(bytes32 indexed contentId, uint64 dealId)",
] as const;

// Contract addresses — filled from .env after deployment
export const CONTRACT_ADDRESSES = {
  sepolia: {
    TrustScore: import.meta.env.VITE_TRUST_SCORE_CONTRACT || '',
    EncryptedPosts: import.meta.env.VITE_ENCRYPTED_POSTS_CONTRACT || '',
    EncryptedDM: import.meta.env.VITE_ENCRYPTED_DM_CONTRACT || '',
    AgentRegistry: import.meta.env.VITE_AGENT_REGISTRY_CONTRACT || '',
  },
  calibrationnet: {
    FilecoinContentRegistry: import.meta.env.VITE_FILECOIN_REGISTRY_CONTRACT || '',
  },
} as const;

// Zama fhEVM Sepolia Configuration (correct architecture)
export const ZAMA_SEPOLIA = {
  chainId: 11155111,                    // Sepolia testnet
  gatewayChainId: 10901,                // Gateway Chain ID (no URL - accessed via relayer)
  
  // Legacy property names (for backward compatibility)
  KMSVerifierAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
  ACLAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',
  FHEVMExecutorAddress: '0x848B00667933BcC60346Da1F490493573998D595',
  InputVerifierAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
  
  // New property names (for fhevmjs)
  aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',
  kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
  inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
  fhevmExecutorAddress: '0x848B00667933BcC60346Da1F490493573998D595',
  inputVerificationAddress: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',

  // URLs - Gateway accessed indirectly through relayer
  relayerUrl: 'https://relayer.testnet.zama.org/',
  networkUrl: 'https://eth-sepolia.public.blastapi.io',
} as const;

export type SupportedChain = 'sepolia' | 'calibrationnet';

// Trust tier mapping (mirrors Solidity enum)
export const TRUST_TIER = {
  0: 'rising',
  1: 'trusted',
  2: 'verified',
  3: 'genesis',
} as const;

// Content type mapping (mirrors Solidity enum)
export const CONTENT_TYPE = {
  Post: 0,
  EncryptedPost: 1,
  AgentLog: 2,
  AgentManifest: 3,
  UserProfile: 4,
  CircleData: 5,
  DMContent: 6,
  TrustProof: 7,
} as const;