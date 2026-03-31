# TrustCircle Deployed Contracts

## Deployment Summary

All TrustCircle contracts have been successfully deployed across multiple blockchain networks!

---

## Sepolia Testnet (Zama fhEVM + ERC-8004)

### TrustScore Contract
- **Address**: `0x16027C8826BFcef3Ad71C8be56b49eC6BE1e0054`
- **Purpose**: Encrypted on-chain reputation system using Zama fhEVM
- **Explorer**: https://sepolia.etherscan.io/address/0x16027C8826BFcef3Ad71C8be56b49eC6BE1e0054

### EncryptedPosts Contract
- **Address**: `0x3694F823564Ce16677F80bCb5e5Bb0aa8c1E1863`
- **Purpose**: Encrypted social posts with trust-gated access
- **Explorer**: https://sepolia.etherscan.io/address/0x3694F823564Ce16677F80bCb5e5Bb0aa8c1E1863

### EncryptedDM Contract
- **Address**: `0xC7d38258a15D1f4302D7080081c466716A55b3F0`
- **Purpose**: End-to-end encrypted direct messages
- **Explorer**: https://sepolia.etherscan.io/address/0xC7d38258a15D1f4302D7080081c466716A55b3F0

### AgentRegistry Contract (ERC-8004)
- **Address**: `0x5C1CE48302B96a177E1d76AB2A6b63fb09750917`
- **Purpose**: AI agent identity and reputation registry
- **Explorer**: https://sepolia.etherscan.io/address/0x5C1CE48302B96a177E1d76AB2A6b63fb09750917
- **Agent Registration TX**: `0x2f8ff36a269df7c8c8b34a07a7a0191a8928141e23bb7530ef3637e9147878ec`

---

## Filecoin Calibration Testnet

### FilecoinContentRegistry Contract
- **Address**: `0x13dAD754D9DAE6dDFd00dAcBcacf89fDbA7d05A0`
- **Purpose**: Content registry for Filecoin storage
- **Explorer**: https://calibration.filfox.info/address/0x13dAD754D9DAE6dDFd00dAcBcacf89fDbA7d05A0

---

## Flow Testnet

### TrustCircleSocial Contract
- **Address**: `0x7a79d79c5acf824b`
- **Purpose**: Social graph (profiles, circles, following, post metadata)
- **Transaction**: `ec0e418da3a0b31f1a2632aa47c4b15ad9eb91f04364ca8c83fda2723e54c290`
- **Explorer**: https://testnet.flowdiver.io/account/0x7a79d79c5acf824b

---

## Verification Commands

### Verify Sepolia Contracts on Etherscan

```bash
# TrustScore
npx hardhat verify --network sepolia 0x16027C8826BFcef3Ad71C8be56b49eC6BE1e0054

# EncryptedPosts
npx hardhat verify --network sepolia 0x3694F823564Ce16677F80bCb5e5Bb0aa8c1E1863

# EncryptedDM
npx hardhat verify --network sepolia 0xC7d38258a15D1f4302D7080081c466716A55b3F0

# AgentRegistry
npx hardhat verify --network sepolia 0x5C1CE48302B96a177E1d76AB2A6b63fb09750917
```

---

## Deployed Services

### AI Agent (ERC-8004 Compliant)
- **URL**: https://trustcircle.onrender.com
- **Platform**: Render
- **Status**: ✅ Active
- **Features**: Bot detection, sentiment analysis, daily digests
- **Agent Identity**: `0xc696a2e9afaaf6b9b2a31e94b87bdc72b066b540279f78ff01d43f63e1a63af8`
- **Deployment**: March 31, 2026

### Frontend Application
- **Status**: Ready for deployment
- **Recommended Platforms**: Vercel, Netlify, Render
- **Demo Mode**: ✅ Enabled (works without wallet connection)

---

## Next Steps

1. **Update Frontend Configuration**
   - Copy these addresses to `trustcircle/src/lib/contracts.ts`
   - Update the frontend to use the deployed contracts

2. **Start the AI Agent**
   ```bash
   cd trustcircle-contracts
   npm run agent:start
   ```

3. **Run the Frontend**
   ```bash
   cd trustcircle
   npm install
   npm run dev
   ```

4. **Upload Agent Manifest to Storacha**
   - Upload `agent/agent.json` to Storacha
   - Register the CID in FilecoinContentRegistry

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                               │
│  React + TypeScript + Tailwind  ·  ethers.js  ·  Flow FCL           │
└──────────┬────────────┬─────────────┬────────────┬───────────────────┘
           │            │             │            │
    ┌──────▼──────┐  ┌──▼──────────┐ │  ┌─────────▼─────────┐
    │   FLOW      │  │  SEPOLIA    │ │  │   FILECOIN        │
    │  Testnet    │  │ (Zama fhEVM)│ │  │  Calibration      │
    │             │  │             │ │  │                   │
    │ 0x7a79d79c  │  │ TrustScore  │ │  │ 0x13dAD754...     │
    │ Social      │  │ EncPosts    │ │  │ ContentRegistry   │
    │ Circles     │  │ EncDMs      │ │  │ Post blobs        │
    │ Following   │  │ AgentReg    │ │  │ Agent logs        │
    │ Post meta   │  │             │ │  │ User profiles     │
    └─────────────┘  └─────────────┘ │  └───────────────────┘
                                     │
                              ┌──────▼──────────┐
                              │   AI AGENT      │
                              │  (Node.js)      │
                              │                 │
                              │  ERC-8004 ID    │
                              │  Claude AI      │
                              │  Bot detection  │
                              │  Sentiment      │
                              │  Cron loops     │
                              └─────────────────┘
```

---

## Deployment Information

- **Deployer Address**: `0x21384CDe50cF0BC2d7A3B5ee8abd19ccaeb50EEF`
- **Deployment Date**: March 26, 2026
- **Networks**: Sepolia, Filecoin Calibration, Flow Testnet
- **Total Contracts**: 5 contracts across 3 networks
