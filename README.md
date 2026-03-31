# 🛡️ TrustCircle

**A bot-free crypto social network powered by Zama fhEVM, Flow blockchain, and AI agents**

TrustCircle combines confidential computing, multi-chain architecture, and autonomous AI to create the first truly secure social platform for the crypto community.

## 🌟 Features

- **🔐 Confidential Computing**: Encrypted trust scores using Zama fhEVM
- **🤖 AI Bot Detection**: ERC-8004 compliant autonomous agents
- **🌊 Multi-Chain**: Sepolia (fhEVM) + Flow + Filecoin integration
- **📱 Demo Mode**: Works immediately without blockchain setup
- **🎯 Trust-Based Access**: Content gated by encrypted reputation scores
- **💬 Encrypted Messaging**: Private DMs with client-side encryption

## 🏗️ Architecture

```
Frontend (React/Vite)          AI Agent (Node.js)
├── Wallet Integration         ├── Bot Detection
├── Trust Score UI             ├── Sentiment Analysis  
├── Encrypted Posts            ├── Daily Digests
└── Demo Mode                  └── ERC-8004 Compliance

         ↓                           ↓
    Smart Contracts (Multi-Chain)
    ├── Sepolia: fhEVM (Zama)
    ├── Flow: Social Features
    └── Filecoin: Content Storage
```

## 🚀 Quick Start

### Frontend (Demo Mode)
```bash
cd trustcircle
npm install
npm run dev
```
Visit `http://localhost:5173` - works immediately in demo mode!

### AI Agent
```bash
cd trustcircle-contracts/agent
npm install
npm start
```

### Smart Contracts
```bash
cd trustcircle-contracts
npm install
npx hardhat compile
```

## 📦 Deployment

### Live Services
- **Frontend**: https://trustcircle-sigma.vercel.app/ ✅ Live
- **AI Agent**: https://trustcircle.onrender.com ✅ Active

### Frontend
- **Vercel**: `vercel --prod` ✅ Deployed
- **Netlify**: Drag `dist` folder after `npm run build`
- **GitHub Pages**: `npm run deploy`

### AI Agent
- **Railway**: Deploy from GitHub (recommended)
- **Render**: Connect repository ✅ Deployed
- **Heroku**: `git push heroku main`

## 🔧 Environment Setup

### Frontend (.env)
```bash
VITE_TRUST_SCORE_CONTRACT=0x16027C8826BFcef3Ad71C8be56b49eC6BE1e0054
VITE_ENCRYPTED_POSTS_CONTRACT=0x3694F823564Ce16677F80bCb5e5Bb0aa8c1E1863
VITE_FLOW_CONTRACT_ADDRESS=0x7a79d79c5acf824b
VITE_STORACHA_SPACE_DID=did:key:z6Mkpy1mgr68NZA9gopVfjYwupcsbyHmoqPdHjkCoysUF7RV
```

### Agent (.env)
```bash
PRIVATE_KEY=your_private_key
GROQ_API_KEY=your_groq_key
AGENT_REGISTRY_CONTRACT=0x5C1CE48302B96a177E1d76AB2A6b63fb09750917
```

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** + **Framer Motion**
- **Ethers.js** + **fhevmjs** + **@onflow/fcl**
- **Zustand** (state management)

### Smart Contracts
- **Solidity 0.8.24** + **Hardhat**
- **Zama fhEVM** (confidential computing)
- **Cadence** (Flow blockchain)
- **OpenZeppelin** (security standards)

### AI Agent
- **Node.js** + **Groq SDK**
- **ERC-8004** compliance
- **Cron jobs** + **Ethers.js**
- **Storacha** (Filecoin storage)

## 📋 Contract Addresses

### Sepolia Testnet (Zama fhEVM)
- **TrustScore**: `0x16027C8826BFcef3Ad71C8be56b49eC6BE1e0054`
- **EncryptedPosts**: `0x3694F823564Ce16677F80bCb5e5Bb0aa8c1E1863`
- **EncryptedDM**: `0xC7d38258a15D1f4302D7080081c466716A55b3F0`
- **AgentRegistry**: `0x5C1CE48302B96a177E1d76AB2A6b63fb09750917`

### Flow Testnet
- **TrustCircleSocial**: `0x7a79d79c5acf824b`

### Filecoin Calibration
- **ContentRegistry**: `0x13dAD754D9DAE6dDFd00dAcBcacf89fDbA7d05A0`

## 🎯 Key Features

### 🔐 Confidential Trust Scores
- Encrypted reputation using Zama fhEVM
- Zero-knowledge threshold comparisons
- Privacy-preserving social proof

### 🤖 Autonomous AI Agents
- Real-time bot detection
- Sentiment analysis
- Community health monitoring
- ERC-8004 compliant identity

### 🌊 Multi-Chain Integration
- **Sepolia**: Confidential computing layer
- **Flow**: Social features & governance
- **Filecoin**: Decentralized content storage

### 📱 Demo Mode
- Works without wallet connection
- Local storage fallback
- Full UI/UX testing
- Production-ready graceful degradation

## 🔒 Security Features

- **Client-side encryption** for sensitive data
- **Multi-signature** wallet support
- **Rate limiting** and **spam protection**
- **Automated bot detection** with AI
- **Confidential computing** for trust scores

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama** for fhEVM confidential computing
- **Flow** for scalable blockchain infrastructure  
- **Groq** for fast AI inference
- **Storacha** for decentralized storage
- **OpenZeppelin** for security standards

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**Built with ❤️ for a bot-free crypto future**