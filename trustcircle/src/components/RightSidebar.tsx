import { useEffect, useState } from 'react'
import { TrendingUp, Zap, Shield, Loader } from 'lucide-react'
import { useAppStore } from '../lib/store'
import { useWalletContext } from '../hooks/useWallet'
import { TrustBadge } from './TrustBadge'
import { AgentStatus } from './AgentStatus'
import { ethers } from 'ethers'
import { ENCRYPTED_POSTS_ABI, CONTRACT_ADDRESSES } from '../lib/contracts'

const TIER_SCORE: Record<string, number> = { rising: 200, trusted: 600, verified: 800, genesis: 950 }

interface TrendingTag { tag: string; count: number }
interface TopUser { address: string; handle: string; tier: string; score: number }

export function RightSidebar() {
  const { circles } = useAppStore()
  const { provider } = useWalletContext()
  const [trending, setTrending] = useState<TrendingTag[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const joinedCircles = circles.filter(c => c.isJoined).slice(0, 4)

  /**
   * Derive trending tags from recent PostCreated events on Sepolia.
   * We fetch post content from Filecoin and extract hashtags.
   */
  useEffect(() => {
    if (!provider) return
    const addr = CONTRACT_ADDRESSES.sepolia.EncryptedPosts
    if (!addr) return

    setIsLoading(true)
    const contract = new ethers.Contract(addr, ENCRYPTED_POSTS_ABI, provider)

    provider.getBlockNumber().then(async (latest) => {
      try {
        const from = Math.max(0, latest - 2000)
        const events = await contract.queryFilter(contract.filters.PostCreated(), from, latest)

        // Collect tag frequencies across recent public posts
        const tagCount: Record<string, number> = {}

        await Promise.all(events.slice(-20).map(async (e: any) => {
          try {
            const postId = e.args?.postId
            if (!postId) return
            const raw = await contract.posts(postId)
            if (raw.isEncrypted || !raw.contentCID) return
            const res = await fetch(`https://w3s.link/ipfs/${raw.contentCID}`)
            if (!res.ok) return
            const data = await res.json()
            const text = data.content || ''
            const tags = text.match(/#[a-zA-Z0-9_]+/g) || []
            tags.forEach((t: string) => { tagCount[t] = (tagCount[t] || 0) + 1 })
          } catch {}
        }))

        const sorted = Object.entries(tagCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({ tag, count }))

        setTrending(sorted)
      } catch {}
      finally { setIsLoading(false) }
    })
  }, [provider])

  return (
    <aside className="w-72 flex-shrink-0 space-y-4">
      {/* AI Agent Status */}
      <AgentStatus />

      {/* Trending tags */}
      <div className="card-panel rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} style={{ color: '#4fffb0' }} />
          <span className="font-mono text-xs tracking-widest" style={{ color: '#6b6b8a' }}>TRENDING</span>
        </div>
        {isLoading && <div className="flex justify-center py-3"><Loader size={14} className="animate-spin" style={{ color: '#4fffb0' }} /></div>}
        {!isLoading && trending.length === 0 && (
          <p className="font-mono text-xs" style={{ color: '#404058' }}>Post to see trending tags here.</p>
        )}
        <div className="space-y-2.5">
          {trending.map(({ tag, count }) => (
            <div key={tag} className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
              <div>
                <div className="text-sm font-medium" style={{ color: '#38bdf8' }}>{tag}</div>
                <div className="font-mono text-xs" style={{ color: '#6b6b8a' }}>{count} post{count !== 1 ? 's' : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My circles */}
      {joinedCircles.length > 0 && (
        <div className="card-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} style={{ color: '#4fffb0' }} />
            <span className="font-mono text-xs tracking-widest" style={{ color: '#6b6b8a' }}>MY CIRCLES</span>
          </div>
          <div className="space-y-2.5">
            {joinedCircles.map(circle => (
              <div key={circle.id} className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: `${circle.color}15`, border: `1px solid ${circle.color}25` }}>
                  {circle.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{circle.name}</div>
                  <div className="font-mono text-[10px]" style={{ color: '#6b6b8a' }}>{circle.memberCount.toLocaleString()} members</div>
                </div>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: circle.color }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tech stack */}
      <div className="rounded-xl p-3" style={{ background: '#0c0c14', border: '1px solid #1e1e2e' }}>
        <div className="font-mono text-[10px] space-y-1.5" style={{ color: '#404058' }}>
          <div className="font-medium mb-2" style={{ color: '#6b6b8a' }}>DEPLOYED ON</div>
          {[
            { label: 'Flow Testnet', color: '#4fffb0', desc: 'Social graph', env: 'VITE_FLOW_CONTRACT_ADDRESS' },
            { label: 'Sepolia (Zama)', color: '#8b5cf6', desc: 'Encrypted posts + DMs', env: 'VITE_TRUST_SCORE_CONTRACT' },
            { label: 'Filecoin Cal.', color: '#38bdf8', desc: 'Content + agent logs', env: 'VITE_FILECOIN_REGISTRY_CONTRACT' },
            { label: 'ERC-8004', color: '#ff6b35', desc: 'Agent identity', env: 'VITE_AGENT_REGISTRY_CONTRACT' },
          ].map(({ label, color, desc, env }) => {
            const addr = import.meta.env[env]
            return (
              <div key={label} className="flex justify-between items-start">
                <div>
                  <span style={{ color }}>● </span>{label}
                  <div className="ml-3 text-[9px]" style={{ color: '#2a2a3e' }}>{desc}</div>
                </div>
                {addr
                  ? <span style={{ color: '#4fffb0' }}>✓</span>
                  : <span style={{ color: '#2a2a3e' }}>not set</span>}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
