import { useState } from 'react'
import { Search, Lock, Users, TrendingUp, Plus, Check, Loader, RefreshCw, X, Sparkles } from 'lucide-react'
import { useFlow } from '../hooks/useFlow'
import { useAppStore, LiveCircle } from '../lib/store'

const CATEGORIES = ['all', '0', '1', '2', '3', '4', '5']
const CAT_LABELS: Record<string, string> = { all: 'All', '0': 'DeFi', '1': 'Research', '2': 'DAO', '3': 'Infra', '4': 'NFT', '5': 'Trading' }
const CAT_COLORS: Record<string, string> = { '0': '#4fffb0', '1': '#8b5cf6', '2': '#38bdf8', '3': '#ff6b35', '4': '#f59e0b', '5': '#ec4899' }

function CircleCard({ circle, onJoin, onLeave, isActing }: {
  circle: LiveCircle
  onJoin: () => void
  onLeave: () => void
  isActing: boolean
}) {
  const color = CAT_COLORS[circle.category] || circle.color

  return (
    <div className="card-panel rounded-xl p-5 opacity-0 animate-fade-in-up hover:scale-[1.003] transition-transform" style={{ animationFillMode: 'forwards' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            {circle.icon}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{circle.name}</div>
            <div className="font-mono text-[10px] mt-0.5" style={{ color }}>{CAT_LABELS[circle.category] || 'General'}</div>
          </div>
        </div>
        <button onClick={circle.isJoined ? onLeave : onJoin} disabled={isActing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          style={circle.isJoined
            ? { color: '#4fffb0', background: 'rgba(79,255,176,0.1)', border: '1px solid rgba(79,255,176,0.3)' }
            : { color, background: `${color}10`, border: `1px solid ${color}30` }}>
          {isActing ? <Loader size={11} className="animate-spin" /> : circle.isJoined ? <><Check size={11} />Joined</> : <><Plus size={11} />Join</>}
        </button>
      </div>

      <p className="text-sm leading-relaxed mb-4" style={{ color: '#9898b8' }}>{circle.description}</p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-mono text-xs" style={{ color: '#6b6b8a' }}>
          <Users size={12} />{circle.memberCount.toLocaleString()} members
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs" style={{ color: '#6b6b8a' }}>
          <Lock size={12} />trust ≥ {circle.minTrustScore}
        </div>
        <div className="ml-auto flex items-center gap-1 font-mono text-xs" style={{ color: '#4fffb0' }}>
          <TrendingUp size={11} />{circle.postCount} posts
        </div>
      </div>

      <div className="mt-4">
        <div className="h-1 rounded-full" style={{ background: '#1e1e2e' }}>
          <div className="h-1 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, (circle.minTrustScore / 1000) * 100)}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
        </div>
      </div>
    </div>
  )
}

export function CirclesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [actingId, setActingId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    minTrustScore: 200,
    category: 0,
    color: '#4fffb0',
    icon: '🌟'
  })

  const { circles, isLoadingCircles } = useAppStore()
  const { loadCircles, joinCircle, leaveCircle, createCircle } = useFlow()

  const filtered = circles.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'all' || c.category === category
    return matchSearch && matchCat
  })

  const handleJoin = async (circle: LiveCircle) => {
    setActingId(circle.id)
    try {
      // Attestation: empty string for now — full Zama attestation flow wired in useCircles
      await joinCircle(Number(circle.id), 'attestation_pending')
    } finally { setActingId(null) }
  }

  const handleLeave = async (circle: LiveCircle) => {
    setActingId(circle.id)
    try { await leaveCircle(Number(circle.id)) } finally { setActingId(null) }
  }

  const handleCreateCircle = async () => {
    if (!createForm.name.trim() || !createForm.description.trim()) return
    setIsCreating(true)
    try {
      await createCircle({
        name: createForm.name,
        description: createForm.description,
        minTrustScore: createForm.minTrustScore,
        category: createForm.category,
        color: createForm.color,
        icon: createForm.icon
      })
      setShowCreateModal(false)
      setCreateForm({
        name: '',
        description: '',
        minTrustScore: 200,
        category: 0,
        color: '#4fffb0',
        icon: '🌟'
      })
      // Refresh circles after creation
      setTimeout(loadCircles, 2000)
    } catch (error) {
      console.error('Failed to create circle:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-border" style={{ background: 'rgba(5,5,8,0.85)' }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-syne font-bold text-xl text-white">Circles</h1>
            <div className="flex items-center gap-3">
              <button 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: '#4fffb0', color: '#050508' }}
                onClick={() => setShowCreateModal(true)}>
                <Plus size={14} />
                Create Circle
              </button>
              <span className="font-mono text-xs" style={{ color: '#6b6b8a' }}>{circles.length} circles</span>
              <button onClick={loadCircles} disabled={isLoadingCircles} className="p-1.5 rounded-lg hover:bg-muted transition-colors" style={{ color: '#6b6b8a' }}>
                <RefreshCw size={13} className={isLoadingCircles ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6b6b8a' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search circles…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm font-mono outline-none text-white"
              style={{ background: '#0c0c14', border: '1px solid #1e1e2e' }} />
          </div>

          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-3 py-1 rounded-md text-xs font-mono capitalize transition-all"
                style={category === cat ? { color: '#4fffb0', background: 'rgba(79,255,176,0.1)', border: '1px solid rgba(79,255,176,0.25)' } : { color: '#6b6b8a', border: '1px solid transparent' }}>
                {CAT_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {isLoadingCircles && (
          <div className="flex items-center justify-center py-16">
            <Loader size={20} className="animate-spin" style={{ color: '#4fffb0' }} />
          </div>
        )}
        {!isLoadingCircles && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="font-syne font-semibold text-white mb-2">No circles found</p>
            <p className="text-sm mb-4" style={{ color: '#6b6b8a' }}>
              {circles.length === 0 ? 'No circles have been created yet. Create the first ones!' : 'Try a different search.'}
            </p>
            {circles.length === 0 && (
              <div className="flex flex-col gap-3 items-center">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                  style={{ background: '#4fffb0', color: '#050508' }}>
                  <Plus size={16} />
                  Create Your First Circle
                </button>
                <button
                  onClick={async () => {
                    // Create demo circles
                    const demoCircles = [
                      { name: 'General Discussion', description: 'Open community for all topics', minTrustScore: 100, category: 0, color: '#4fffb0', icon: '💬' },
                      { name: 'DeFi Builders', description: 'For DeFi developers and enthusiasts', minTrustScore: 300, category: 0, color: '#8b5cf6', icon: '🏗️' },
                      { name: 'Crypto Research', description: 'Deep dives and analysis', minTrustScore: 200, category: 1, color: '#38bdf8', icon: '🔬' },
                      { name: 'DAO Contributors', description: 'Governance and DAO discussions', minTrustScore: 400, category: 2, color: '#ff6b35', icon: '🗳️' }
                    ]
                    
                    for (const circle of demoCircles) {
                      try {
                        await createCircle(circle)
                        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait between creations
                      } catch (error) {
                        console.error('Failed to create demo circle:', circle.name, error)
                      }
                    }
                    setTimeout(loadCircles, 3000)
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                  style={{ background: '#1e1e2e', color: '#6b6b8a', border: '1px solid #2a2a3e' }}>
                  <Sparkles size={16} />
                  Create Demo Circles
                </button>
              </div>
            )}
          </div>
        )}
        {filtered.map(circle => (
          <CircleCard key={circle.id} circle={circle}
            onJoin={() => handleJoin(circle)} onLeave={() => handleLeave(circle)}
            isActing={actingId === circle.id} />
        ))}
      </div>

      {/* Create Circle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid #1e1e2e' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne font-bold text-xl text-white">Create Circle</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-gray-800">
                <X size={20} style={{ color: '#6b6b8a' }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Circle Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="DeFi Builders"
                  className="w-full px-3 py-2 rounded-lg bg-transparent border text-white placeholder-gray-400"
                  style={{ borderColor: '#1e1e2e' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A community for DeFi builders and enthusiasts"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-transparent border text-white placeholder-gray-400 resize-none"
                  style={{ borderColor: '#1e1e2e' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Category</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, category: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg bg-transparent border text-white"
                    style={{ borderColor: '#1e1e2e', background: '#0c0c14' }}>
                    <option value={0}>DeFi</option>
                    <option value={1}>Research</option>
                    <option value={2}>DAO</option>
                    <option value={3}>Infrastructure</option>
                    <option value={4}>NFT</option>
                    <option value={5}>Trading</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Min Trust Score</label>
                  <input
                    type="number"
                    value={createForm.minTrustScore}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, minTrustScore: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="1000"
                    className="w-full px-3 py-2 rounded-lg bg-transparent border text-white"
                    style={{ borderColor: '#1e1e2e' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Icon</label>
                  <input
                    type="text"
                    value={createForm.icon}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="🌟"
                    className="w-full px-3 py-2 rounded-lg bg-transparent border text-white placeholder-gray-400"
                    style={{ borderColor: '#1e1e2e' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Color</label>
                  <input
                    type="color"
                    value={createForm.color}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 rounded-lg border"
                    style={{ borderColor: '#1e1e2e' }}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                  style={{ background: '#1e1e2e', color: '#6b6b8a' }}>
                  Cancel
                </button>
                <button
                  onClick={handleCreateCircle}
                  disabled={isCreating || !createForm.name.trim() || !createForm.description.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#4fffb0', color: '#050508' }}>
                  {isCreating ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Circle
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <p className="text-xs" style={{ color: '#8b5cf6' }}>
                🌊 Circle will be created on Flow blockchain. Members can join if they meet the trust score requirement.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
