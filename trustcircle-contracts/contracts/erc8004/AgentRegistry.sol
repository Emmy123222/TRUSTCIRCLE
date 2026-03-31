// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentRegistry
 * @notice ERC-8004 compliant agent identity and reputation registry.
 *         Agents register an on-chain identity linked to an operator wallet.
 *         Reputation scores are updated based on task completion history.
 *         Used by TrustCircle's AI agent to establish verifiable identity.
 *
 * @dev Implements the ERC-8004 standard for autonomous agent identity:
 *      - identity registry: agent DID + operator link
 *      - reputation registry: task-based scoring
 *      - validation registry: capability attestations
 */
contract AgentRegistry is Ownable, ReentrancyGuard {
    // ─── Events ───────────────────────────────────────────────────────
    event AgentRegistered(bytes32 indexed agentId, address indexed operator, string name);
    event ReputationUpdated(bytes32 indexed agentId, int256 delta, string reason);
    event CapabilityAttested(bytes32 indexed agentId, bytes32 capability, address attester);
    event AgentDeactivated(bytes32 indexed agentId);
    event AgentSlashed(bytes32 indexed agentId, uint256 amount, string reason);
    event TaskCompleted(bytes32 indexed agentId, bytes32 taskId, bool success);

    // ─── Enums ────────────────────────────────────────────────────────
    enum AgentStatus { Active, Paused, Deactivated, Slashed }

    // ─── Structs ──────────────────────────────────────────────────────
    struct Agent {
        bytes32 id;              // keccak256(operator + name + timestamp)
        address operator;        // Wallet responsible for this agent
        string name;             // Human-readable name
        string manifestCID;      // Filecoin CID of agent.json manifest
        string logsCID;          // Filecoin CID of agent_log.json (updated)
        int256 reputationScore;  // Can go negative (bad behavior)
        uint256 tasksCompleted;
        uint256 tasksFailed;
        uint256 registeredAt;
        uint256 lastActive;
        AgentStatus status;
        bool exists;
    }

    struct TaskRecord {
        bytes32 taskId;
        bytes32 agentId;
        string description;
        bool success;
        int256 reputationDelta;
        uint256 timestamp;
        string resultCID; // Filecoin CID of task output
    }

    // ─── State ────────────────────────────────────────────────────────
    mapping(bytes32 => Agent) public agents;
    mapping(address => bytes32[]) public operatorAgents;
    mapping(bytes32 => bytes32[]) public agentCapabilities;
    mapping(bytes32 => mapping(bytes32 => bool)) public hasCapability;
    mapping(bytes32 => TaskRecord[]) public agentTasks;
    mapping(bytes32 => address[]) public capabilityAttesters;

    bytes32[] public allAgentIds;

    // Reputation bounds
    int256 public constant MIN_REPUTATION = -1000;
    int256 public constant MAX_REPUTATION = 1000;
    int256 public constant TASK_SUCCESS_DELTA = 10;
    int256 public constant TASK_FAIL_DELTA = -25;
    int256 public constant SLASH_THRESHOLD = -500;

    // ─── Constructor ──────────────────────────────────────────────────
    constructor() Ownable(msg.sender) {}

    // ─── Registration ─────────────────────────────────────────────────

    /**
     * @notice Register a new AI agent with ERC-8004 identity.
     * @param name          Human-readable agent name (e.g. "TrustAgent v1.0")
     * @param manifestCID   Filecoin CID of the agent.json manifest
     */
    function registerAgent(
        string calldata name,
        string calldata manifestCID
    ) external nonReentrant returns (bytes32) {
        require(bytes(name).length > 0 && bytes(name).length <= 64, "AgentRegistry: invalid name");

        bytes32 agentId = keccak256(abi.encodePacked(
            msg.sender,
            name,
            block.timestamp,
            block.chainid
        ));

        require(!agents[agentId].exists, "AgentRegistry: agent already exists");

        agents[agentId] = Agent({
            id: agentId,
            operator: msg.sender,
            name: name,
            manifestCID: manifestCID,
            logsCID: "",
            reputationScore: 0,
            tasksCompleted: 0,
            tasksFailed: 0,
            registeredAt: block.timestamp,
            lastActive: block.timestamp,
            status: AgentStatus.Active,
            exists: true
        });

        operatorAgents[msg.sender].push(agentId);
        allAgentIds.push(agentId);

        emit AgentRegistered(agentId, msg.sender, name);
        return agentId;
    }

    /**
     * @notice Update agent's Filecoin log CID after task execution.
     */
    function updateLogsCID(bytes32 agentId, string calldata logsCID) external {
        require(agents[agentId].operator == msg.sender, "AgentRegistry: not operator");
        agents[agentId].logsCID = logsCID;
        agents[agentId].lastActive = block.timestamp;
    }

    // ─── Reputation ───────────────────────────────────────────────────

    /**
     * @notice Record a completed task and update reputation accordingly.
     * @param agentId     The agent that completed the task
     * @param taskId      Unique task identifier
     * @param description Human-readable task description
     * @param success     Whether the task succeeded
     * @param resultCID   Filecoin CID of task output/logs
     */
    function recordTask(
        bytes32 agentId,
        bytes32 taskId,
        string calldata description,
        bool success,
        string calldata resultCID
    ) external {
        Agent storage agent = agents[agentId];
        require(agent.exists, "AgentRegistry: agent not found");
        require(agent.operator == msg.sender || msg.sender == owner(), "AgentRegistry: unauthorized");
        require(agent.status == AgentStatus.Active, "AgentRegistry: agent not active");

        int256 delta = success ? TASK_SUCCESS_DELTA : TASK_FAIL_DELTA;
        int256 newScore = agent.reputationScore + delta;

        // Clamp to bounds
        if (newScore > MAX_REPUTATION) newScore = MAX_REPUTATION;
        if (newScore < MIN_REPUTATION) newScore = MIN_REPUTATION;

        agent.reputationScore = newScore;
        agent.lastActive = block.timestamp;

        if (success) {
            agent.tasksCompleted++;
        } else {
            agent.tasksFailed++;
        }

        agentTasks[agentId].push(TaskRecord({
            taskId: taskId,
            agentId: agentId,
            description: description,
            success: success,
            reputationDelta: delta,
            timestamp: block.timestamp,
            resultCID: resultCID
        }));

        emit TaskCompleted(agentId, taskId, success);
        emit ReputationUpdated(agentId, delta, description);

        // Auto-slash if reputation hits threshold
        if (newScore <= SLASH_THRESHOLD) {
            agent.status = AgentStatus.Slashed;
            emit AgentSlashed(agentId, 0, "Reputation below threshold");
        }
    }

    /**
     * @notice Manual reputation adjustment (owner only — for governance slashing).
     */
    function adjustReputation(
        bytes32 agentId,
        int256 delta,
        string calldata reason
    ) external onlyOwner {
        require(agents[agentId].exists, "AgentRegistry: not found");
        int256 newScore = agents[agentId].reputationScore + delta;
        if (newScore > MAX_REPUTATION) newScore = MAX_REPUTATION;
        if (newScore < MIN_REPUTATION) newScore = MIN_REPUTATION;
        agents[agentId].reputationScore = newScore;
        emit ReputationUpdated(agentId, delta, reason);
    }

    // ─── Capabilities / Validation Registry ───────────────────────────

    /**
     * @notice Attest that an agent has a specific capability.
     *         Any trusted party can attest — trust is based on attestation count.
     * @param agentId     The agent being attested
     * @param capability  keccak256 of capability string (e.g., keccak256("sentiment_analysis"))
     */
    function attestCapability(bytes32 agentId, bytes32 capability) external {
        require(agents[agentId].exists, "AgentRegistry: not found");
        require(!hasCapability[agentId][capability], "AgentRegistry: already attested");

        hasCapability[agentId][capability] = true;
        agentCapabilities[agentId].push(capability);
        capabilityAttesters[capability].push(msg.sender);

        emit CapabilityAttested(agentId, capability, msg.sender);
    }

    function getAgentCapabilities(bytes32 agentId) external view returns (bytes32[] memory) {
        return agentCapabilities[agentId];
    }

    // ─── Trust Gating ─────────────────────────────────────────────────

    /**
     * @notice Check if an agent meets a minimum reputation threshold.
     *         Used by other contracts to gate agent access.
     */
    function meetsReputationThreshold(bytes32 agentId, int256 minRep) external view returns (bool) {
        if (!agents[agentId].exists) return false;
        if (agents[agentId].status != AgentStatus.Active) return false;
        return agents[agentId].reputationScore >= minRep;
    }

    // ─── Getters ──────────────────────────────────────────────────────

    function getOperatorAgents(address operator) external view returns (bytes32[] memory) {
        return operatorAgents[operator];
    }

    function getAgentTasks(bytes32 agentId) external view returns (TaskRecord[] memory) {
        return agentTasks[agentId];
    }

    function getTotalAgents() external view returns (uint256) {
        return allAgentIds.length;
    }

    function deactivateAgent(bytes32 agentId) external {
        require(agents[agentId].operator == msg.sender || msg.sender == owner(), "AgentRegistry: unauthorized");
        agents[agentId].status = AgentStatus.Deactivated;
        emit AgentDeactivated(agentId);
    }
}
