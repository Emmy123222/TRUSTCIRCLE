# TrustCircle Complete Deployment Guide

## Prerequisites

### 1. Install Required Tools
```bash
# Install Flow CLI
npm install -g @onflow/flow-cli

# Install Storacha CLI (already done)
npm install -g @storacha/cli
```

### 2. Set Up Wallets and Keys

#### Ethereum/Sepolia Wallet
- Create a wallet (MetaMask, etc.) and get the private key
- Get some Sepolia ETH from faucets:
  - https://sepoliafaucet.com/
  - https://www.alchemy.com/faucets/ethereum-sepolia

#### Flow Testnet Account
```bash
flow accounts create --network testnet
```
This will create a Flow account and give you the address and private key.

#### Filecoin Calibration Testnet
- Use the same Ethereum private key
- Get Calibration testnet FIL from: https://faucet.calibration.fildev.network/

### 3. Get API Keys

#### Etherscan API Key (Optional, for verification)
- Go to https://etherscan.io/apis
- Create a free account and get an API key

#### Storacha Setup
Follow the steps in `STORACHA_SETUP.md`

## Environment Configuration

Update `trustcircle-contracts/.env` with your actual values:

```env
# ─── Wallet ───────────────────────────────────────────
PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE

# ─── RPC Endpoints ────────────────────────────────────
SEPOLIA_RPC_URL=https://rpc.sepolia.org
# Or use Alchemy: https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# ─── API Keys ─────────────────────────────────────────
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY

# ─── Filecoin ─────────────────────────────────────────
STORACHA_SPACE_DID=did:key:YOUR_SPACE_DID
STORACHA_PRINCIPAL=YOUR_PRINCIPAL_KEY

# ─── Flow ─────────────────────────────────────────────
FLOW_ACCOUNT_ADDRESS=0xYOUR_FLOW_ADDRESS
FLOW_PRIVATE_KEY=YOUR_FLOW_PRIVATE_KEY
FLOW_NETWORK=testnet
```

## Deployment Steps

### 1. Compile Contracts
```bash
cd trustcircle-contracts
npm run compile
```

### 2. Deploy to Sepolia (Zama fhEVM + ERC-8004)
```bash
npm run deploy:sepolia
```

### 3. Deploy to Filecoin Calibration
```bash
npm run deploy:filecoin
```

### 4. Deploy to Flow Testnet
```bash
npm run deploy:flow
```

### 5. Deploy All at Once
```bash
npm run deploy:all
```

## Verification

### Verify Sepolia Contracts on Etherscan
```bash
# After deployment, use the addresses from deployments/sepolia.json
npx hardhat verify --network sepolia <TRUST_SCORE_ADDRESS>
npx hardhat verify --network sepolia <ENCRYPTED_POSTS_ADDRESS> "<TRUST_SCORE_ADDRESS>"
npx hardhat verify --network sepolia <ENCRYPTED_DM_ADDRESS>
npx hardhat verify --network sepolia <AGENT_REGISTRY_ADDRESS>
```

## Post-Deployment

### 1. Update Frontend Configuration
Copy the deployed contract addresses to `trustcircle/src/lib/contracts.ts`

### 2. Start the AI Agent
```bash
cd trustcircle-contracts
npm run agent:start
```

### 3. Run the Frontend
```bash
cd trustcircle
npm install
npm run dev
```

## Troubleshooting

### Common Issues
1. **Insufficient funds**: Make sure you have enough testnet tokens
2. **Flow CLI not found**: Install with `npm install -g @onflow/flow-cli`
3. **Storacha authentication**: Make sure you've completed the email verification
4. **Private key format**: Ensure it starts with `0x`

### Getting Help
- Flow Discord: https://discord.gg/flow
- Zama Discord: https://discord.gg/zama
- Filecoin Slack: https://filecoin.io/slack