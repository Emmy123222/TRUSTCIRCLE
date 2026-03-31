import { useState, useEffect } from 'react'

const AGENT_URL = import.meta.env.VITE_AGENT_URL || 'https://trustcircle.onrender.com'

interface AgentStats {
  postsAnalyzed: number
  alertsGenerated: number
  walletsAnalyzed: number
  uptime: string
}

interface AgentStatus {
  status: string
  agent_address: string
  stats: AgentStats
  last_activity: string | null
}

interface RecentActivity {
  recent_tasks: Array<{
    id: string
    type: string
    description: string
    success: boolean
    timestamp: string
    data?: any
  }>
  total_tasks: number
}

export function useAgent() {
  const [status, setStatus] = useState<AgentStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch agent status
  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${AGENT_URL}/api/status`)
      if (!response.ok) throw new Error('Failed to fetch agent status')
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Agent status error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch recent activity
  const fetchRecentActivity = async (limit = 10): Promise<RecentActivity | null> => {
    try {
      const response = await fetch(`${AGENT_URL}/api/recent-activity?limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch recent activity')
      return await response.json()
    } catch (err) {
      console.error('Recent activity error:', err)
      return null
    }
  }

  // Analyze wallet
  const analyzeWallet = async (address: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${AGENT_URL}/api/analyze-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })
      if (!response.ok) throw new Error('Failed to analyze wallet')
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Analyze sentiment for posts
  const analyzeSentiment = async (postIds: string[]) => {
    try {
      setLoading(true)
      const response = await fetch(`${AGENT_URL}/api/analyze-sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds })
      })
      if (!response.ok) throw new Error('Failed to analyze sentiment')
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sentiment analysis failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Get daily digest
  const getDigest = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${AGENT_URL}/api/digest`)
      if (!response.ok) throw new Error('Failed to get digest')
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get digest')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    status,
    loading,
    error,
    fetchStatus,
    fetchRecentActivity,
    analyzeWallet,
    analyzeSentiment,
    getDigest,
    isOnline: status?.status === 'active'
  }
}