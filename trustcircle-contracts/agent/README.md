# TrustCircle AI Agent

ERC-8004 compliant AI agent for bot detection and sentiment analysis on TrustCircle social network.

## Features

- **Bot Detection**: Analyzes wallet patterns to detect potential bot accounts
- **Sentiment Analysis**: Hourly analysis of community posts
- **Daily Digests**: Automated community reports at 8AM UTC
- **Filecoin Storage**: Optional decentralized storage via Storacha
- **HTTP API**: Web service endpoints for monitoring and manual triggers

## Deployment on Render

### 1. Web Service Setup

1. Connect your GitHub repository to Render
2. Choose "Web Service" (not Background Worker)
3. Set the following configuration:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node.js
   - **Region**: Choose closest to your users

### 2. Environment Variables

Add these environment variables in Render dashboard:

```bash
# Required
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
GROQ_API_KEY=your_groq_api_key_here

# Contract Addresses
AGENT_REGISTRY_CONTRACT=0x5C1CE48302B96a177E1d76AB2A6b63fb09750917
ENCRYPTED_POSTS_CONTRACT=0x3694F823564Ce16677F80bCb5e5Bb0aa8c1E1863
TRUST_SCORE_CONTRACT=0x16027C8826BFcef3Ad71C8be56b49eC6BE1e0054

# Optional (for Filecoin uploads)
STORACHA_SPACE_DID=did:key:z6Mkpy1mgr68NZA9gopVfjYwupcsbyHmoqPdHjkCoysUF7RV
STORACHA_EMAIL=emmanuelogheneovo17@gmail.com
```

### 3. Health Check

Render will automatically monitor the service health via the root endpoint (`/`).

## API Endpoints

- `GET /` - Health check and agent status
- `GET /status` - Detailed agent statistics
- `POST /trigger/bot-check` - Manual bot detection scan
- `POST /trigger/sentiment` - Manual sentiment analysis

## Local Development

```bash
npm install
npm start
```

The agent will start on port 3000 and begin monitoring blockchain events.

## Agent Identity

- **Agent ID**: `0xc696a2e9afaaf6b9b2a31e94b87bdc72b066b540279f78ff01d43f63e1a63af8`
- **Operator**: `0x21384CDe50cF0BC2d7A3B5ee8abd19ccaeb50EEF`
- **ERC-8004 Compliant**: Yes

## Monitoring

The agent automatically:
- Polls for new posts every 30 seconds
- Runs sentiment analysis every hour
- Generates daily digests at 8AM UTC
- Uploads logs to Filecoin every 4 hours (if configured)

All activities are logged and can be viewed via the `/status` endpoint.