#!/usr/bin/env node
require('dotenv').config()
const { ethers } = require('ethers')
const Groq = require('groq-sdk')
const cron = require('node-cron')
const fs = require('fs')
const path = require('path')
const express = require('express')

// ─── Validate env ─────────────────────────────────────────────────
const required = ['PRIVATE_KEY', 'SEPOLIA_RPC_URL', 'AGENT_REGISTRY_CONTRACT', 'ENCRYPTED_POSTS_CONTRACT', 'TRUST_SCORE_CONTRACT', 'GROQ_API_KEY']
for (const key of required) {
  if (!process.env[key]) { console.error(`Missing env: ${key}`); process.exit(1) }
}

// ─── Clients ──────────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── State ────────────────────────────────────────────────────────
let agentId = null
let lastScannedBlock = 0

const executionLog = {
  agentId: null, operator: wallet.address,
  startTime: new Date().toISOString(), tasks: [],
  stats: { totalRuns: 0, tasksCompleted: 0, tasksFailed: 0, botsDetected: 0, alertsGenerated: 0, apiCallsUsed: 0, filecoinUploads: 0, onChainTxs: 0 },
}

const COMPUTE_BUDGET = { maxApiCallsPerRun: 20 }

// ─── Storacha (optional — falls back to local save) ───────────────
async function uploadToFilecoin(data, filename) {
  // Always save locally
  const localPath = path.join(__dirname, filename)
  fs.writeFileSync(localPath, JSON.stringify(data, null, 2))
  console.log(`  💾 Saved locally: ${localPath}`)

  if (!process.env.STORACHA_SPACE_DID) {
    console.log('  ⚠️  STORACHA_SPACE_DID not set — skipping Filecoin upload')
    return null
  }

  try {
    const Client = require('@storacha/client')
    const client = await Client.create()
    if (process.env.STORACHA_EMAIL) {
      await client.login(process.env.STORACHA_EMAIL)
    }
    await client.setCurrentSpace(process.env.STORACHA_SPACE_DID)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const file = new File([blob], filename, { type: 'application/json' })
    const cid = await client.uploadFile(file)
    const cidStr = cid.toString()
    console.log(`  📦 Uploaded to Filecoin: ${cidStr}`)
    executionLog.stats.filecoinUploads++
    return cidStr
  } catch (err) {
    console.error(`  ❌ Filecoin upload failed: ${err.message}`)
    return null
  }
}

// ─── ABIs ─────────────────────────────────────────────────────────
const AGENT_ABI = [
  'function registerAgent(string name, string manifestCID) returns (bytes32)',
  'function recordTask(bytes32 agentId, bytes32 taskId, string description, bool success, string resultCID)',
  'function updateLogsCID(bytes32 agentId, string logsCID)',
  'function agents(bytes32) view returns (bytes32 id, address operator, string name, string manifestCID, string logsCID, int256 reputationScore, uint256 tasksCompleted, uint256 tasksFailed, uint256 registeredAt, uint256 lastActive, uint8 status, bool exists)',
  'function getOperatorAgents(address) view returns (bytes32[])',
  'event AgentRegistered(bytes32 indexed agentId, address indexed operator, string name)',
  'event TaskCompleted(bytes32 indexed agentId, bytes32 taskId, bool success)',
]
const POSTS_ABI = [
  'event PostCreated(uint256 indexed postId, address indexed author, bytes32 circleId, bool isEncrypted)',
  'function posts(uint256) view returns (uint256 id, address author, bytes32 circleId, string contentCID, bool isEncrypted, uint32 minTrustRequired, uint256 timestamp, uint256 likes, uint256 replies, uint256 reposts, bool exists, bool deleted)',
]
const TRUST_ABI = [
  'function profiles(address) view returns (address wallet, string handle, uint8 tier, bool isVerified, uint256 onChainSince, uint256 txCount, uint8[] badges, bool exists)',
]

const agentRegistry = new ethers.Contract(process.env.AGENT_REGISTRY_CONTRACT, AGENT_ABI, wallet)
const postsContract = new ethers.Contract(process.env.ENCRYPTED_POSTS_CONTRACT, POSTS_ABI, provider)
const trustContract = new ethers.Contract(process.env.TRUST_SCORE_CONTRACT, TRUST_ABI, provider)

// ─── Helpers ──────────────────────────────────────────────────────
function logTask(type, description, success, data = {}) {
  const entry = { id: ethers.hexlify(ethers.randomBytes(8)), type, description, success, timestamp: new Date().toISOString(), data }
  executionLog.tasks.push(entry)
  success ? executionLog.stats.tasksCompleted++ : executionLog.stats.tasksFailed++
  console.log(`  [${success ? '✅' : '❌'}] ${description}`)
  return entry
}

async function recordTask(taskId, description, success, data) {
  if (!agentId) return
  try {
    const resultCID = await uploadToFilecoin({ taskId, description, success, data }, `task_${taskId.slice(2, 10)}.json`) || ''
    const taskIdBytes = ethers.keccak256(ethers.toUtf8Bytes(taskId))
    const tx = await agentRegistry.recordTask(agentId, taskIdBytes, description, success, resultCID)
    await tx.wait()
    executionLog.stats.onChainTxs++
    console.log(`  🔗 Task on-chain: ${tx.hash}`)
  } catch (err) {
    console.error(`  ❌ Record task failed: ${err.message}`)
  }
}

// ─── Groq analysis ────────────────────────────────────────────────
async function runGroq(prompt, maxTokens = 500) {
  if (executionLog.stats.apiCallsUsed >= COMPUTE_BUDGET.maxApiCallsPerRun) return null
  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are TrustAgent, an autonomous AI monitoring TrustCircle — a bot-free crypto social network. Be concise. Return only valid JSON when asked, no markdown.'
        },
        { role: 'user', content: prompt }
      ],
    })
    executionLog.stats.apiCallsUsed++
    const text = res.choices[0]?.message?.content || ''
    try { return JSON.parse(text) } catch { return text }
  } catch (err) {
    console.error(`  ❌ Groq API: ${err.message}`)
    return null
  }
}

// ─── Bot detection ────────────────────────────────────────────────
async function analyzeWallet(authorAddress) {
  try {
    const [profile, txCount] = await Promise.all([
      trustContract.profiles(authorAddress),
      provider.getTransactionCount(authorAddress),
    ])
    const signals = []
    if (!profile.exists) signals.push('no_trust_profile')
    if (Number(profile.tier) === 0) signals.push('rising_tier')
    if (txCount < 10) signals.push('low_tx_count')

    if (signals.length >= 2) {
      const analysis = await runGroq(
        `Wallet ${authorAddress} has these risk signals: ${signals.join(', ')}.
         tx count: ${txCount}, tier: ${Number(profile.tier)}, handle: "${profile.handle}".
         Return JSON: { botProbability: 0-100, action: "BLOCK"|"WARN"|"MONITOR", reason: string }`, 200
      )
      if (analysis && analysis.botProbability >= 60) {
        executionLog.stats.botsDetected++
        return { address: authorAddress, signals, analysis, flagged: true }
      }
    }
    return null
  } catch { return null }
}

// ─── Poll for PostCreated events ──────────────────────────────────
// Uses queryFilter() — works with HTTP RPC (contract.on needs WebSocket)
async function pollForNewPosts() {
  try {
    const latestBlock = await provider.getBlockNumber()
    if (lastScannedBlock === 0) {
      lastScannedBlock = latestBlock - 10
    }
    if (latestBlock <= lastScannedBlock) return

    const events = await postsContract.queryFilter(
      postsContract.filters.PostCreated(),
      lastScannedBlock + 1,
      latestBlock
    )
    lastScannedBlock = latestBlock

    for (const event of events) {
      const postId = event.args?.postId
      const author = event.args?.author
      if (!author) continue

      console.log(`\n📬 New post #${postId} from ${author}`)
      executionLog.stats.totalRuns++

      const botResult = await analyzeWallet(author)
      const botTask = logTask('bot_detection', `Bot check for ${author}`, true, botResult || { flagged: false })
      if (botResult?.flagged) {
        executionLog.stats.alertsGenerated++
        await recordTask(botTask.id, `Bot check: ${author} flagged`, true, botResult)
      }
    }
  } catch (err) {
    console.error(`  ❌ Poll error: ${err.message}`)
  }
}

// ─── Sentiment ────────────────────────────────────────────────────
async function analyzeSentimentBatch(postIds) {
  const posts = []
  for (const postId of postIds.slice(-10)) {
    try {
      const raw = await postsContract.posts(postId)
      if (raw.isEncrypted || !raw.contentCID) continue
      const res = await fetch(`https://w3s.link/ipfs/${raw.contentCID}`)
      if (!res.ok) continue
      const data = await res.json()
      if (data.content) posts.push({ content: data.content.slice(0, 200), author: raw.author })
    } catch {}
  }
  if (posts.length === 0) return null
  return runGroq(
    `Analyze sentiment of these crypto social posts. Return JSON array:
     [{ sentiment: "bullish"|"bearish"|"neutral", confidence: 0-1, keyTopics: string[] }]
     Posts: ${JSON.stringify(posts)}`, 600
  )
}

// ─── Daily digest ─────────────────────────────────────────────────
async function generateDigest() {
  const latestBlock = await provider.getBlockNumber()
  const fromBlock = Math.max(0, latestBlock - 7200)
  const events = await postsContract.queryFilter(postsContract.filters.PostCreated(), fromBlock, latestBlock)
  const uniqueAuthors = new Set(events.map(e => e.args?.author))
  return runGroq(
    `Generate a TrustCircle daily digest. Stats:
     - Posts in last 24h: ${events.length}
     - Unique authors: ${uniqueAuthors.size}
     - Encrypted posts: ${events.filter(e => e.args?.isEncrypted).length}
     - Bots blocked today: ${executionLog.stats.botsDetected}
     Return JSON: { headline: string, topInsight: string, agentNote: string }`, 400
  )
}

// ─── Upload log ───────────────────────────────────────────────────
async function uploadLog() {
  const logCID = await uploadToFilecoin(executionLog, 'agent_log.json')
  if (logCID && agentId) {
    try {
      const tx = await agentRegistry.updateLogsCID(agentId, logCID)
      await tx.wait()
      executionLog.stats.onChainTxs++
      console.log(`  📋 Log CID on-chain: ${logCID}`)
    } catch (err) {
      console.error(`  ❌ Log CID update failed: ${err.message}`)
    }
  }
}

// ─── ERC-8004 registration ────────────────────────────────────────
async function registerAgent() {
  console.log('\n🤖 Registering ERC-8004 agent identity…')
  try {
    const existing = await agentRegistry.getOperatorAgents(wallet.address)
    if (existing.length > 0) {
      agentId = existing[existing.length - 1]
      executionLog.agentId = agentId
      console.log(`  ✅ Using existing agent: ${agentId}`)
      return true
    }
    const manifest = {
      name: 'TrustAgent v1.0', version: '1.0.0', operator: wallet.address,
      capabilities: ['bot_detection', 'sentiment_analysis', 'daily_digest'],
      storage: 'Filecoin via Storacha', ai: 'Groq llama-3.3-70b-versatile',
      contracts: { agentRegistry: process.env.AGENT_REGISTRY_CONTRACT, posts: process.env.ENCRYPTED_POSTS_CONTRACT },
      registeredAt: new Date().toISOString(),
    }
    const manifestCID = await uploadToFilecoin(manifest, 'agent.json') || 'local'
    const tx = await agentRegistry.registerAgent('TrustAgent v1.0', manifestCID)
    const receipt = await tx.wait()
    executionLog.stats.onChainTxs++
    const event = receipt.logs
      .map(l => { try { return agentRegistry.interface.parseLog(l) } catch { return null } })
      .find(e => e?.name === 'AgentRegistered')
    agentId = event?.args?.agentId || ethers.keccak256(ethers.toUtf8Bytes('TrustAgent_' + Date.now()))
    executionLog.agentId = agentId
    console.log(`  ✅ Agent registered: ${agentId}`)
    console.log(`  📋 Tx: ${receipt.hash}`)
    return true
  } catch (err) {
    console.error(`  ❌ Registration failed: ${err.message}`)
    return false
  }
}

// ─── Main ─────────────────────────────────────────────────────────
// HTTP Server for Frontend API
const cors = require('cors')
const app = express()
const PORT = parseInt(process.env.PORT) || 3000

console.log(`🔍 Debug: PORT env var = "${process.env.PORT}" (type: ${typeof process.env.PORT})`)
console.log(`🔍 Debug: Parsed PORT = ${PORT} (type: ${typeof PORT})`)

app.use(cors())
app.use(express.json())

// API Endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    agent: 'TrustCircle AI Agent',
    version: '1.0.0',
    uptime: process.uptime(),
    stats: executionLog.stats
  })
})

app.get('/api/status', (req, res) => {
  res.json({
    status: 'active',
    agent_address: wallet.address,
    stats: executionLog.stats,
    last_activity: executionLog.tasks.slice(-1)[0]?.timestamp || null
  })
})

app.get('/api/stats', (req, res) => {
  res.json(executionLog.stats)
})

app.get('/api/recent-activity', (req, res) => {
  const limit = parseInt(req.query.limit) || 10
  res.json({
    recent_tasks: executionLog.tasks.slice(-limit),
    total_tasks: executionLog.tasks.length
  })
})

app.post('/api/analyze-wallet', async (req, res) => {
  try {
    const { address } = req.body
    if (!address) return res.status(400).json({ error: 'Address required' })
    
    const analysis = await analyzeWallet(address)
    res.json({ address, analysis })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/analyze-sentiment', async (req, res) => {
  try {
    const { postIds } = req.body
    if (!postIds || !Array.isArray(postIds)) {
      return res.status(400).json({ error: 'postIds array required' })
    }
    
    const sentiment = await analyzeSentimentBatch(postIds)
    res.json({ postIds, sentiment })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/digest', async (req, res) => {
  try {
    const digest = await generateDigest()
    res.json({ digest, generated_at: new Date().toISOString() })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

async function main() {
  console.log('═'.repeat(60))
  console.log(' 🤖 TrustCircle AI Agent')
  console.log(' Groq · ERC-8004 · Filecoin via Storacha · Sepolia')
  console.log('═'.repeat(60))
  console.log(`Operator: ${wallet.address}`)

  await registerAgent()
  await uploadLog()

  // Start HTTP Server with error handling
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌐 API Server running on port ${PORT}`)
    console.log(`   Status: http://0.0.0.0:${PORT}/`)
    console.log(`   API: http://0.0.0.0:${PORT}/api/status`)
  })

  server.on('error', (err) => {
    console.error(`❌ Server failed to start on port ${PORT}:`, err.message)
    console.error('This might be a Render configuration issue.')
    console.error('Trying to continue without HTTP server...')
    
    // Continue with background tasks even if HTTP server fails
    console.log('\n⚠️  Running in background-only mode (no HTTP API)')
  })

  // Poll every 30 seconds — no WebSocket needed
  console.log('\n👂 Polling for PostCreated events every 30s…')
  await pollForNewPosts()
  cron.schedule('*/30 * * * * *', pollForNewPosts)

  // Hourly sentiment
  cron.schedule('0 * * * *', async () => {
    console.log('\n[CRON] Hourly sentiment analysis…')
    try {
      const latest = await provider.getBlockNumber()
      const events = await postsContract.queryFilter(postsContract.filters.PostCreated(), Math.max(0, latest - 300), latest)
      const postIds = events.map(e => e.args?.postId).filter(Boolean)
      if (postIds.length === 0) return
      const sentiment = await analyzeSentimentBatch(postIds)
      if (sentiment) {
        const task = logTask('sentiment_analysis', `Sentiment for ${postIds.length} recent posts`, true, sentiment)
        executionLog.stats.alertsGenerated++
        await recordTask(task.id, 'Hourly sentiment analysis', true, sentiment)
      }
    } catch (err) { logTask('sentiment_analysis', 'Sentiment failed', false, { error: err.message }) }
  })

  // Daily digest at 8am UTC
  cron.schedule('0 8 * * *', async () => {
    console.log('\n[CRON] Daily digest…')
    try {
      const digest = await generateDigest()
      if (digest) {
        const task = logTask('daily_digest', 'Daily community digest', true, digest)
        executionLog.stats.alertsGenerated++
        await recordTask(task.id, 'Daily digest', true, digest)
      }
    } catch (err) { logTask('daily_digest', 'Digest failed', false, { error: err.message }) }
  })

  // Upload log every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    console.log('\n[CRON] Uploading log…')
    await uploadLog()
  })

  console.log('\n✅ Agent live.\n')
  console.log('  • HTTP API:       port', PORT)
  console.log('  • Post polling:   every 30 seconds')
  console.log('  • Sentiment:      every hour')
  console.log('  • Daily digest:   8:00 AM UTC')
  console.log('  • Filecoin log:   every 4 hours')
  if (!process.env.STORACHA_SPACE_DID) {
    console.log('\n  💡 Add STORACHA_EMAIL + STORACHA_SPACE_DID to .env to enable Filecoin uploads')
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
    if (server && server.listening) {
      server.close(() => {
        console.log('✅ Server closed')
        process.exit(0)
      })
    } else {
      console.log('✅ Background tasks stopped')
      process.exit(0)
    }
  })

  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...')
    if (server && server.listening) {
      server.close(() => {
        console.log('✅ Server closed')
        process.exit(0)
      })
    } else {
      console.log('✅ Background tasks stopped')
      process.exit(0)
    }
  })
}

if (require.main === module) {
  main().catch(console.error)
}

// Agent status endpoint
app.get('/status', (req, res) => {
  res.json({
    agentId: agentId,
    operator: wallet?.address,
    stats: executionLog.stats,
    recentTasks: executionLog.tasks.slice(-10),
    isRunning: true
  })
})

// Manual trigger endpoints (useful for testing)
app.post('/trigger/bot-check', async (req, res) => {
  try {
    await pollForNewPosts()
    res.json({ success: true, message: 'Bot check triggered' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/trigger/sentiment', async (req, res) => {
  try {
    const latest = await provider.getBlockNumber()
    const events = await postsContract.queryFilter(postsContract.filters.PostCreated(), Math.max(0, latest - 300), latest)
    const postIds = events.map(e => e.args?.postId).filter(Boolean)
    if (postIds.length === 0) {
      return res.json({ success: true, message: 'No recent posts to analyze' })
    }
    const sentiment = await analyzeSentimentBatch(postIds)
    res.json({ success: true, sentiment, postsAnalyzed: postIds.length })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Start the HTTP server and then initialize the agent
app.listen(PORT, () => {
  console.log(`🌐 TrustCircle Agent API running on port ${PORT}`)
  console.log(`📊 Status: http://localhost:${PORT}/`)
  console.log(`🔍 Health: http://localhost:${PORT}/status`)
  
  // Initialize the agent after server starts
  main().catch(err => { console.error('Fatal:', err); process.exit(1) })
})