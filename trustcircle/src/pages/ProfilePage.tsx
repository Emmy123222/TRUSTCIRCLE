import { useEffect, useState } from 'react'
import { Copy, ExternalLink, Edit3, Shield, Zap, Clock, Activity, Users, Lock, Loader, RefreshCw, Plus } from 'lucide-react'
import { useWalletContext } from '../hooks/useWallet'
import { useProfile } from '../hooks/useProfile'
import { useFeed } from '../hooks/useFeed'
import { useTrustScore } from '../hooks/useTrustScore'
import { useFlow } from '../hooks/useFlow'
import { useAppStore } from '../lib/store'
import { TrustRing, TrustBadge } from '../components/TrustBadge'
import { PostCard } from '../components/PostCard'
import { CreateProfileModal } from '../components/CreateProfileModal'
import { CONTRACT_ADDRESSES } from '../lib/contracts'

const BADGE_META: Record<number, { name: string; icon: string; color: string; description: string }> = {
  0: { name: 'Genesis Holder', icon: '⚡', color: '#4fffb0', description: 'Wallet active since early days' },
  1: { name: 'DeFi Native',    icon: '🔮', color: '#8b5cf6', description: '500+ DeFi interactions' },
  2: { name: 'DAO Voter',      icon: '🗳️', color: '#38bdf8', description: 'Active governance participant' },
  3: { name: 'Diamond Hands',  icon: '💎', color: '#4fffb0', description: 'Long-term holder' },
  4: { name: 'ZK Pioneer',     icon: '🔐', color: '#ff6b35', description: 'Early ZK ecosystem contributor' },
}

const TIER_SCORE: Record<string, number> = { rising: 200, trusted: 600, verified: 800, genesis: 950 }
const TABS = ['Posts', 'Activity']

export function ProfilePage() {
  const { address } = useWalletContext()
  const { profile, fetchUserProfile, fetchChainActivity } = useProfile()
  const { isLoading: isDecrypting } = useTrustScore()
  const { getProfile: getFlowProfile } = useFlow()
  const { connectedProfile } = useAppStore()
  const { posts, isLoadingPosts, loadPosts, toggleLike } = useFeed()

  const [activeTab, setActiveTab] = useState('Posts')
  const [copied, setCopied] = useState(false)
  const [flowProfile, setFlowProfile] = useState<any>(null)
  const [chainActivity, setChainActivity] = useState<{ txCount: number } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const displayProfile = connectedProfile

  useEffect(() => {
    if (!address) return
    // Fetch Flow social data
    getFlowProfile(address).then(setFlowProfile).catch(() => null)
    // Fetch live tx count from Ethereum
    fetchChainActivity(address).then(d => { if (d) setChainActivity({ txCount: d.txCount }) })
    // Load the user's posts
    loadPosts()
  }, [address])

  const handleRefresh = async () => {
    if (!address) return
    setIsRefreshing(true)
    await Promise.all([
      fetchUserProfile(address),
      getFlowProfile(address).then(setFlowProfile).catch(() => null),
      fetchChainActivity(address).then(d => { if (d) setChainActivity({ txCount: d.txCount }) }),
    ])
    setIsRefreshing(false)
  }

  const handleCopyAddress = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Estimate trust score from tier (actual score is encrypted on-chain)
  const estimatedScore = displayProfile ? TIER_SCORE[displayProfile.tier] || 100 : 0

  if (!address) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center py-24">
        <Shield size={32} className="mx-auto mb-4" style={{ color: '#2a2a3e' }} />
        <p className="font-syne font-semibold text-white mb-2">Connect your wallet</p>
        <p className="text-sm" style={{ color: '#6b6b8a' }}>Connect to view your on-chain profile.</p>
      </div>
    )
  }

  if (!displayProfile) {
    return (
      <>
        <div className="max-w-2xl mx-auto p-6">
          <div className="text-center py-24">
            <Shield size={32} className="mx-auto mb-4" style={{ color: '#2a2a3e' }} />
            <p className="font-syne font-semibold text-white mb-2">No profile found</p>
            <p className="text-sm mb-4" style={{ color: '#6b6b8a' }}>Create your encrypted trust profile to get started.</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
              style={{ background: '#4fffb0', color: '#050508' }}>
              <Plus size={16} />
              Create Profile
            </button>
          </div>
        </div>
        
        <CreateProfileModal 
          isOpen={showCreateModal} 
          onClose={() => {
            setShowCreateModal(false)
            // Refresh after modal closes to check for new profile
            setTimeout(handleRefresh, 1000)
          }} 
        />
      </>
    )
  }

  const myPosts = posts.filter(p => p.author.toLowerCase() === address?.toLowerCase())

  return (
    <div className="max-w-2xl mx-auto">
      {/* Banner */}
      <div className="relative h-32 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(79,255,176,0.08), rgba(139,92,246,0.08))' }}>
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10" style={{ border: '1px solid #4fffb0' }} />
        <button onClick={handleRefresh} disabled={isRefreshing}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
          style={{ background: 'rgba(12,12,20,0.8)', border: '1px solid #1e1e2e', color: '#9898b8' }}>
          <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      <div className="px-6">
        {/* Avatar + trust ring */}
        <div className="flex items-end justify-between -mt-8 mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-syne font-bold text-2xl ring-2 ring-trust/40"
              style={{ background: 'linear-gradient(135deg, #1a6645, #0a3d2a)', boxShadow: '0 0 30px rgba(79,255,176,0.2)' }}>
              {displayProfile.handle?.slice(0, 2).toUpperCase() || address.slice(2, 4).toUpperCase()}
            </div>
            {displayProfile.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: '#4fffb0', boxShadow: '0 0 10px rgba(79,255,176,0.5)' }}>
                <Shield size={12} style={{ color: '#050508' }} />
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <TrustRing score={estimatedScore} size={72} />
            <button disabled={isDecrypting}
              className="font-mono text-[10px] flex items-center gap-1 hover:opacity-80 transition-opacity opacity-50 cursor-not-allowed"
              style={{ color: '#404058' }}
              title="Decryption not available in demo mode">
              {isDecrypting ? <Loader size={9} className="animate-spin" /> : <Lock size={9} />}
              Decrypt exact score
            </button>
          </div>
        </div>

        {/* Name */}
        <div className="mb-3">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-syne font-bold text-2xl text-white">
              {displayProfile.handle || address.slice(0, 10)}
            </h1>
            <TrustBadge tier={displayProfile.tier as any} score={estimatedScore} size="md" />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm" style={{ color: '#6b6b8a' }}>
              {displayProfile.handle ? `@${displayProfile.handle}` : ''}
            </span>
            <button onClick={handleCopyAddress}
              className="flex items-center gap-1 font-mono text-xs transition-colors"
              style={{ color: copied ? '#4fffb0' : '#404058' }}>
              <Copy size={10} />
              {copied ? 'Copied!' : `${address.slice(0, 6)}…${address.slice(-4)}`}
            </button>
            <a href={`https://sepolia.etherscan.io/address/${address}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 font-mono text-xs hover:opacity-80" style={{ color: '#38bdf8' }}>
              <ExternalLink size={10} />Etherscan
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-5 mb-5 pb-5 border-b border-border flex-wrap">
          <div className="text-center">
            <div className="font-syne font-bold text-lg text-white">{flowProfile?.followerCount ?? '—'}</div>
            <div className="font-mono text-xs" style={{ color: '#6b6b8a' }}>followers</div>
          </div>
          <div className="text-center">
            <div className="font-syne font-bold text-lg text-white">{flowProfile?.followingCount ?? '—'}</div>
            <div className="font-mono text-xs" style={{ color: '#6b6b8a' }}>following</div>
          </div>
          <div className="text-center">
            <div className="font-syne font-bold text-lg text-white">
              {(chainActivity?.txCount ?? displayProfile.txCount ?? 0).toLocaleString()}
            </div>
            <div className="font-mono text-xs" style={{ color: '#6b6b8a' }}>transactions</div>
          </div>
          <div className="text-center">
            <div className="font-syne font-bold text-lg text-white">
              {displayProfile.onChainSince ? new Date(displayProfile.onChainSince * 1000).getFullYear() : '—'}
            </div>
            <div className="font-mono text-xs" style={{ color: '#6b6b8a' }}>on-chain since</div>
          </div>
        </div>

        {/* Badges */}
        {displayProfile.badges.length > 0 && (
          <div className="mb-6">
            <h2 className="font-syne font-semibold text-white text-sm mb-3">Badges</h2>
            <div className="flex flex-wrap gap-2">
              {displayProfile.badges.map((badgeId, i) => {
                const meta = BADGE_META[badgeId]
                if (!meta) return null
                return (
                  <div key={badgeId} title={meta.description}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards', background: `${meta.color}10`, border: `1px solid ${meta.color}30`, color: meta.color }}>
                    <span>{meta.icon}</span>
                    <span className="font-mono text-xs">{meta.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Trust info */}
        <div className="rounded-xl p-5 mb-6" style={{ background: 'rgba(12,12,20,0.8)', border: '1px solid #1e1e2e' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-syne font-semibold text-white text-sm">Trust Score</h2>
            <span className="font-mono text-xs" style={{ color: '#6b6b8a' }}>
              Tier: <span style={{ color: '#4fffb0' }}>{displayProfile.tier.toUpperCase()}</span>
            </span>
          </div>
          <div className="h-2 rounded-full mb-2" style={{ background: '#1e1e2e' }}>
            <div className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${(estimatedScore / 1000) * 100}%`, background: 'linear-gradient(90deg, #1a6645, #4fffb0)', boxShadow: '0 0 12px rgba(79,255,176,0.4)' }} />
          </div>
          <div className="flex items-center gap-2 mt-3 font-mono text-xs" style={{ color: '#6b6b8a' }}>
            <Lock size={10} style={{ color: '#8b5cf6' }} />
            Score encrypted as euint32 on Sepolia via Zama fhEVM — click "Decrypt exact score" to reveal via Gateway
          </div>
          {CONTRACT_ADDRESSES.sepolia.TrustScore && (
            <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.sepolia.TrustScore}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 font-mono text-xs mt-2 hover:opacity-80" style={{ color: '#38bdf8' }}>
              <ExternalLink size={9} />TrustScore contract
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-1 mb-4 border-b border-border">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-4 py-2.5 text-sm font-medium transition-all"
                style={activeTab === tab ? { color: '#4fffb0', borderBottom: '2px solid #4fffb0' } : { color: '#6b6b8a', borderBottom: '2px solid transparent' }}>
                {tab}
              </button>
            ))}
          </div>

          {isLoadingPosts ? (
            <div className="flex justify-center py-8"><Loader size={16} className="animate-spin" style={{ color: '#4fffb0' }} /></div>
          ) : myPosts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm" style={{ color: '#6b6b8a' }}>No posts yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myPosts.map((post, i) => (
                <PostCard key={post.id} post={post} delay={i * 80}
                  onLike={() => toggleLike(post.id, post.isLiked)} onRequestAccess={() => {}} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
