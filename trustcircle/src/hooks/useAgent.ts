import { useCallback, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { AGENT_REGISTRY_ABI, CONTRACT_ADDRESSES } from '../lib/contracts'
import { useWalletContext } from './useWallet'
import { useAppStore, AgentStats, LiveAlert } from '../lib/store'

const FILECOIN_GATEWAY = 'https://w3s.link/ipfs'

export function useAgent() {
  const { provider, address } = useWalletContext()
  const { agentStats, alerts, setAgentStats, setAlerts, addAlert, markAlertRead } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const contract = useCallback(() => {
    const addr = CONTRACT_ADDRESSES.sepolia.AgentRegistry
    if (!addr || !provider) return null
    return new ethers.Contract(addr, AGENT_REGISTRY_ABI, provider)
  }, [provider])

  /**
   * Load the operator's registered agent from AgentRegistry.
   * Then fetch the execution log from Filecoin to get alert history.
   */
  const loadAgent = useCallback(async () => {
    if (!provider || !address) return
    setIsLoading(true)
    setError(null)
    try {
      const c = contract()
      if (!c) return

      console.log('🔍 Loading agent for operator:', address)
      console.log('🔍 AgentRegistry contract:', CONTRACT_ADDRESSES.sepolia.AgentRegistry)
      console.log('🔍 Expected agent operator from terminal: 0x21384CDe50cF0BC2d7A3B5ee8abd19ccaeb50EEF')
      console.log('🔍 Current MetaMask address:', address)

      // Get agent IDs for this operator
      const agentIdsResult = await c.getOperatorAgents(address)
      const agentIds: string[] = Array.from(agentIdsResult || [])
      console.log('🔍 Found agent IDs:', agentIds)
      console.log('🔍 Raw result:', agentIdsResult)
      
      if (agentIds.length === 0) {
        console.log('🔍 No agents found for operator')
        
        // Let's also check if there are any agents at all in the contract
        try {
          // Try to check if the agent from terminal exists
          const terminalAgentIds = await c.getOperatorAgents('0x21384CDe50cF0BC2d7A3B5ee8abd19ccaeb50EEF')
          console.log('🔍 Agents for terminal address (0x21384CDe50cF0BC2d7A3B5ee8abd19ccaeb50EEF):', Array.from(terminalAgentIds || []))
        } catch (e) {
          console.log('🔍 Error checking terminal address:', e)
        }
        
        setAgentStats({ agentId: null, reputationScore: 0, tasksCompleted: 0, tasksFailed: 0, logsCID: '', manifestCID: '', lastActive: 0, status: 'Not registered', isRegistered: false })
        return
      }

      // Use the most recent agent
      const agentId = agentIds[agentIds.length - 1]
      console.log('🔍 Using agent ID:', agentId)
      
      const raw = await c.agents(agentId)
      console.log('🔍 Agent data:', raw)
      
      const statuses = ['Active', 'Paused', 'Deactivated', 'Slashed']

      const stats: AgentStats = {
        agentId,
        reputationScore: Number(raw.reputationScore),
        tasksCompleted: Number(raw.tasksCompleted),
        tasksFailed: Number(raw.tasksFailed),
        logsCID: raw.logsCID,
        manifestCID: raw.manifestCID,
        lastActive: Number(raw.lastActive),
        status: statuses[Number(raw.status)] || 'Unknown',
        isRegistered: raw.exists,
      }
      console.log('🔍 Processed stats:', stats)
      setAgentStats(stats)

      // Fetch execution log from Filecoin to get alerts
      if (raw.logsCID) {
        console.log('🔍 Loading alerts from Filecoin CID:', raw.logsCID)
        await loadAlertsFromFilecoin(raw.logsCID)
      }
    } catch (e: any) {
      console.error('🔍 Agent loading error:', e)
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [provider, address, contract, setAgentStats])

  /**
   * Pull agent_log.json from Filecoin and convert tasks to alerts
   */
  const loadAlertsFromFilecoin = useCallback(async (logsCID: string) => {
    try {
      const res = await fetch(`${FILECOIN_GATEWAY}/${logsCID}`)
      if (!res.ok) return
      const log = await res.json()

      const liveAlerts: LiveAlert[] = (log.tasks || [])
        .slice(-50)         // last 50 tasks
        .reverse()          // newest first
        .map((task: any) => ({
          id: task.id || `task_${task.timestamp}`,
          type: task.type === 'bot_detection' ? 'suspicious'
              : task.type === 'sentiment_analysis' ? 'sentiment'
              : task.type === 'daily_digest' ? 'digest'
              : 'trust_update',
          title: task.description || task.type,
          body: typeof task.data === 'string' ? task.data : JSON.stringify(task.data || {}),
          timestamp: task.timestamp || new Date().toISOString(),
          severity: task.type === 'bot_detection' ? 'high'
                  : task.type === 'sentiment_analysis' ? 'medium' : 'low',
          read: false,
          filecoinCID: logsCID,
        }))

      setAlerts(liveAlerts)
    } catch {
      // Filecoin fetch failure is non-fatal
    }
  }, [setAlerts])

  /**
   * Listen for real-time TaskCompleted events from AgentRegistry
   */
  useEffect(() => {
    const c = contract()
    if (!c || !address) return

    const onTask = async (agentId: string, taskId: string, success: boolean, event: any) => {
      const raw = await c.agents(agentId).catch(() => null)
      if (!raw) return
      if (raw.operator.toLowerCase() !== address.toLowerCase()) return

      const newAlert: LiveAlert = {
        id: taskId,
        type: 'trust_update',
        title: success ? 'Agent task completed' : 'Agent task failed',
        body: `Task ${taskId.slice(0, 10)}… — reputation ${success ? '+10' : '-25'}`,
        timestamp: new Date().toISOString(),
        severity: success ? 'low' : 'high',
        read: false,
        txHash: event.transactionHash,
      }
      addAlert(newAlert)
      await loadAgent()
    }

    c.on('TaskCompleted', onTask)
    return () => { c.off('TaskCompleted', onTask) }
  }, [contract, address, addAlert, loadAgent])

  useEffect(() => { loadAgent() }, [loadAgent])

  return { agentStats, alerts, isLoading, error, loadAgent, markAlertRead }
}
