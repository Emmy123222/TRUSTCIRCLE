# TrustCircle — Smart Contracts & AI Agent

Bot-free crypto social network. All smart contracts, Cadence scripts, Filecoin integration, and AI agent.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TRUSTCIRCLE                              │
├────────────────┬────────────────┬──────────────┬───────────────┤
│  Flow Testnet  │ Sepolia (Zama) │  Filecoin    │  AI Agent     │
│                │   fhEVM        │  Calibration │  (ERC-8004)   │
├────────────────┼────────────────┼──────────────┼───────────────┤
│ Social graph   │ TrustScore.sol │ Content      │ TrustAgent    │
│ Circle membr.  │ EncryptedPosts │ Registry     │ v1.0          │
│ Post metadata  │ EncryptedDM    │ Deal verify  │ Claude AI     │
│ Follow graph   │ (euint types)  │ UCAN tokens  │ Cron loops    │
└────────────────┴────────────────┴──────────────┴───────────────┘
```

## Contracts

### Zama fhEVM — Sepolia Testnet

| Contract | Description |
|---|---|
| `TrustScore.sol` | Encrypted reputation scores (euint32). Homomorphic comparisons for trust-gating circles. Zama Gateway for async decryption. |
| `EncryptedPosts.sol` | Circle posts with optional fhEVM encryption. Encrypted symmetric key stored on-chain. FHE conditional access. |
| `EncryptedDM.sol` | E2E encrypted DMs. Separate sender/recipient keys stored as `euint256`. Soft delete zeroes keys. |

> ⚠️ Zama is NOT a separate blockchain. These contracts deploy to Sepolia and use Zama's fhEVM coprocessor for encrypted computation.

### ERC-8004 — Sepolia Testnet

| Contract | Description |
|---|---|
| `AgentRegistry.sol` | Identity + reputation registry for AI agents. Records tasks, updates reputation, attests capabilities. Slashes agents that hit -500 reputation. |

### Filecoin — Calibration Testnet

| Contract | Description |
|---|---|
| `FilecoinContentRegistry.sol` | On-chain index of Filecoin CIDs. Tracks posts, agent logs, user profiles. Records storage deals. Maintains immutable CID history. |

### Flow — Testnet (Cadence)

| Contract | Description |
|---|---|
| `TrustCircleSocial.cdc` | Social graph, circles, memberships, post metadata registration. Trust attestations from Zama bridge circle access. |

## Setup

```bash
cp .env.example .env
# Fill in PRIVATE_KEY, SEPOLIA_RPC_URL, etc.

npm install
```

## Deploy

```bash
# 1. Deploy Zama contracts + ERC-8004 to Sepolia
npm run deploy:sepolia

# 2. Deploy Filecoin registry to Calibration testnet
npm run deploy:filecoin

# 3. Deploy Flow social graph to Flow Testnet
npm run deploy:flow

# 4. All at once (except Flow)
npm run deploy:all
```

## Run AI Agent

```bash
# Add ANTHROPIC_API_KEY to .env first
npm run agent:start
```

The agent:
1. Registers its ERC-8004 identity on Sepolia
2. Uploads `agent.json` manifest to Filecoin
3. Runs bot detection every 5 minutes
4. Runs sentiment analysis every hour
5. Generates daily digest at 8am
6. Uploads `agent_log.json` to Filecoin every 4 hours
7. Records all tasks on-chain via AgentRegistry

## Test

```bash
npm test
```

## Cross-Chain Data Flow

```
User posts encrypted content:

1. Frontend encrypts content with AES-256 key (client-side)
2. Uploads encrypted blob → Filecoin (Storacha) → gets CID
3. Calls EncryptedPosts.createEncryptedPost(CID, encKey)
   → Zama fhEVM stores encrypted key as euint256 on Sepolia
4. Calls TrustCircleSocial.registerPost(CID, sepoliaTxHash)
   → Flow records post metadata + links to Sepolia key ref

Viewer requests access:

1. Calls EncryptedPosts.requestPostAccess(postId)
   → Zama checks: meetsThreshold(viewer, minTrust)
   → If true: re-encrypts key for viewer (TFHE.select)
2. Viewer retrieves encrypted key from Sepolia
3. Viewer fetches encrypted blob from Filecoin
4. Decrypts locally — never exposed on-chain
```

## Hackathon Track Coverage

| Track | Contract/Component |
|---|---|
| **Flow** | `TrustCircleSocial.cdc` — social graph, walletless circles |
| **Zama fhEVM** | `TrustScore.sol`, `EncryptedPosts.sol`, `EncryptedDM.sol` |
| **Filecoin** | `FilecoinContentRegistry.sol` + Storacha SDK |
| **ERC-8004** | `AgentRegistry.sol` + `agent/index.js` |
| **Fresh Code** | Entire codebase — built from scratch |
| **AI & Robotics** | Autonomous agent with Claude, cron loops, ERC-8004 |
| **Community Vote** | Tweet thread showcasing the above |
