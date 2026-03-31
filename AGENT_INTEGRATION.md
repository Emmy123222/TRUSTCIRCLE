# 🤖 AI Agent Integration Guide

## Overview

The TrustCircle AI Agent is deployed at **https://trustcircle.onrender.com** and provides real-time bot detection, sentiment analysis, and wallet analysis services to the frontend application.

## 🔗 Frontend ↔ Agent Integration

### 1. **Real-Time Agent Status**
- **Component**: `AgentStatus` in right sidebar
- **Updates**: Every 30 seconds automatically
- **Shows**: Online status, stats (posts analyzed, alerts generated, wallets analyzed)
- **Actions**: View recent activity, get daily digest

### 2. **Wallet Analysis During Profile Creation**
- **Component**: `CreateProfileModal`
- **Feature**: "AI Analyze" button
- **Function**: Analyzes user's wallet and suggests trust score values
- **Benefit**: More accurate initial trust scores based on on-chain behavior

### 3. **Post Sentiment Analysis**
- **API Endpoint**: `POST /api/analyze-sentiment`
- **Usage**: Analyze sentiment of specific posts
- **Integration**: Can be called from post components for real-time sentiment

### 4. **Daily Community Digest**
- **API Endpoint**: `GET /api/digest`
- **Usage**: Get AI-generated community summary
- **Display**: Modal in AgentStatus component

## 🛠️ API Endpoints

### Base URL: `https://trustcircle.onrender.com`

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/` | GET | Agent health check | None |
| `/api/status` | GET | Agent status & stats | None |
| `/api/recent-activity` | GET | Recent agent tasks | `?limit=10` |
| `/api/analyze-wallet` | POST | Wallet behavior analysis | `{ address: string }` |
| `/api/analyze-sentiment` | POST | Post sentiment analysis | `{ postIds: string[] }` |
| `/api/digest` | GET | Daily community digest | None |

## 📊 Agent Background Tasks

The agent runs continuously with these automated tasks:

### 🔍 **Post Monitoring** (Every 30 seconds)
- Monitors `PostCreated` events on Sepolia
- Analyzes new posts for bot behavior
- Updates statistics in real-time

### 💭 **Sentiment Analysis** (Every hour)
- Analyzes recent posts for community sentiment
- Generates alerts for negative trends
- Stores results for frontend access

### 📰 **Daily Digest** (8:00 AM UTC)
- Creates AI-generated community summary
- Highlights trending topics and sentiment
- Available via API for frontend display

### 💾 **Log Upload** (Every 4 hours)
- Uploads agent logs to Filecoin via Storacha
- Maintains permanent record of agent activity
- Ensures transparency and auditability

## 🎯 User Experience Flow

### Profile Creation with AI
1. User opens "Create Profile" modal
2. User sees "AI Analyze" button (if agent online)
3. User clicks button → Agent analyzes wallet
4. AI suggests trust score values based on on-chain behavior
5. User can accept suggestions or manually adjust
6. Profile created with more accurate initial scores

### Real-Time Agent Monitoring
1. Agent status widget shows in right sidebar
2. Green dot = online, red dot = offline
3. Live stats update every 30 seconds
4. Users can view recent activity and daily digest
5. Transparent view of agent's work

## 🔧 Environment Configuration

### Frontend (.env)
```bash
VITE_AGENT_URL=https://trustcircle.onrender.com
```

### Agent (.env)
```bash
# Core Configuration
NODE_ENV=production
PRIVATE_KEY=your_private_key_here
GROQ_API_KEY=your_groq_api_key_here

# Contract Addresses
TRUST_SCORE_CONTRACT=0x16027C8826BFcef3Ad71C8be56b49eC6BE1e0054
ENCRYPTED_POSTS_CONTRACT=0x3694F823564Ce16677F80bCb5e5Bb0aa8c1E1863
AGENT_REGISTRY_CONTRACT=0x5C1CE48302B96a177E1d76AB2A6b63fb09750917

# Optional Filecoin Integration
STORACHA_SPACE_DID=your_storacha_space_did
STORACHA_PRINCIPAL=your_storacha_principal
STORACHA_EMAIL=your_email@example.com
```

## 🚀 Deployment Status

- ✅ **Agent**: Deployed on Render at https://trustcircle.onrender.com
- ✅ **API**: HTTP endpoints active with CORS enabled
- ✅ **Frontend Integration**: Components and hooks implemented
- ✅ **Background Tasks**: All cron jobs running
- ✅ **ERC-8004 Compliance**: Agent registered on-chain

## 🔮 Future Enhancements

### Planned Features
1. **Real-time WebSocket updates** for instant notifications
2. **Advanced bot detection** using ML models
3. **Personalized recommendations** based on user behavior
4. **Cross-chain analysis** for multi-network users
5. **Community governance** via agent voting

### Integration Opportunities
1. **Post creation**: Real-time bot detection during posting
2. **Message filtering**: Automatic spam/bot message detection
3. **Trust score updates**: Dynamic scoring based on agent analysis
4. **Alert system**: Push notifications for important events
5. **Analytics dashboard**: Detailed community health metrics

---

**The AI agent is now fully integrated and provides intelligent, automated services that enhance the TrustCircle user experience while maintaining transparency and user control.**