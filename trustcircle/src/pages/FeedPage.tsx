import { useState } from 'react'
import { Send, Lock, Globe, ChevronDown, TrendingUp, Users, Clock, Sparkles, Loader, RefreshCw } from 'lucide-react'
import { PostCard } from '../components/PostCard'
import { PostProgress } from '../components/PostProgress'
import { useCreatePost } from '../hooks/useCreatePost'
import { useFeed } from '../hooks/useFeed'
import { useFlow } from '../hooks/useFlow'
import { useProfile } from '../hooks/useProfile'
import { useAppStore } from '../lib/store'

const FILTERS = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'latest', label: 'Latest', icon: Clock },
  { id: 'circles', label: 'My Circles', icon: Users },
  { id: 'ai', label: 'AI Picks', icon: Sparkles },
]

export function FeedPage() {
  const [activeFilter, setActiveFilter] = useState('latest')
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [showCirclePicker, setShowCirclePicker] = useState(false)
  const [selectedCircleIdx, setSelectedCircleIdx] = useState(0)

  const { profile } = useProfile()
  const { circles } = useAppStore()
  const { posts, isLoadingPosts, fetchError, loadPosts, toggleLike, requestAccess } = useFeed()
  const { step, stepLabel, filecoinCID, sepoliaTxHash, flowTxId, error: postError, isSubmitting, submitPublicPost, submitEncryptedPost, reset } = useCreatePost()

  const joinedCircles = circles.filter(c => c.isJoined)
  const selectedCircle = joinedCircles[selectedCircleIdx] || null

  const handlePost = async () => {
    if (!content.trim() || isSubmitting || !selectedCircle) return
    const ok = isPrivate
      ? await submitEncryptedPost(content, selectedCircle)
      : await submitPublicPost(content, selectedCircle)
    if (ok) { setContent(''); setTimeout(reset, 5000) }
  }

  const sorted = [...posts].sort((a, b) =>
    activeFilter === 'latest' ? b.timestamp - a.timestamp : b.likes - a.timestamp
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-border" style={{ background: 'rgba(5,5,8,0.85)' }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-syne font-bold text-xl text-white">Feed</h1>
            <div className="flex items-center gap-2">
              <div className="font-mono text-xs px-2 py-1 rounded-full" style={{ color: '#4fffb0', background: 'rgba(79,255,176,0.1)', border: '1px solid rgba(79,255,176,0.2)' }}>● LIVE</div>
              <button onClick={loadPosts} disabled={isLoadingPosts} className="p-1.5 rounded-lg transition-colors hover:bg-muted" style={{ color: '#6b6b8a' }}>
                <RefreshCw size={13} className={isLoadingPosts ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <div className="flex gap-1">
            {FILTERS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveFilter(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={activeFilter === id ? { color: '#4fffb0', background: 'rgba(79,255,176,0.1)', border: '1px solid rgba(79,255,176,0.25)' } : { color: '#6b6b8a', border: '1px solid transparent' }}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Compose */}
        {joinedCircles.length > 0 ? (
          <div className="card-panel rounded-xl p-5">
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-syne font-bold text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1a6645, #0a3d2a)', border: '1px solid rgba(79,255,176,0.3)' }}>
                {profile?.handle?.slice(0, 2).toUpperCase() || '??'}
              </div>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="Share alpha with your trusted circles…"
                rows={3} disabled={isSubmitting}
                className="w-full bg-transparent text-silver text-sm leading-relaxed resize-none outline-none font-syne disabled:opacity-50"
                style={{ color: '#c8c8d8' }} />
            </div>

            <PostProgress step={step} filecoinCID={filecoinCID} sepoliaTxHash={sepoliaTxHash} flowTxId={flowTxId} error={postError} isEncrypted={isPrivate} />

            <div className="flex items-center gap-3 pt-3 border-t border-border mt-3">
              {selectedCircle && (
                <div className="relative">
                  <button onClick={() => setShowCirclePicker(!showCirclePicker)} disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all disabled:opacity-50"
                    style={{ color: selectedCircle.color, background: `${selectedCircle.color}10`, border: `1px solid ${selectedCircle.color}30` }}>
                    {selectedCircle.icon} {selectedCircle.name} <ChevronDown size={10} />
                  </button>
                  {showCirclePicker && (
                    <div className="absolute top-full left-0 mt-2 w-52 rounded-xl z-50 overflow-hidden shadow-2xl" style={{ background: '#12121e', border: '1px solid #1e1e2e' }}>
                      {joinedCircles.map((c, i) => (
                        <button key={c.id} onClick={() => { setSelectedCircleIdx(i); setShowCirclePicker(false) }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-mono text-left hover:bg-muted transition-colors"
                          style={{ color: c.color }}>{c.icon} {c.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setIsPrivate(!isPrivate)} disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all disabled:opacity-50"
                style={isPrivate ? { color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' } : { color: '#6b6b8a', border: '1px solid #1e1e2e' }}>
                {isPrivate ? <Lock size={11} /> : <Globe size={11} />}
                {isPrivate ? 'Encrypted' : 'Public'}
              </button>

              {isSubmitting && <span className="font-mono text-[10px] flex items-center gap-1" style={{ color: '#4fffb0' }}><Loader size={9} className="animate-spin" />{stepLabel}</span>}

              <button onClick={handlePost} disabled={!content.trim() || isSubmitting || !selectedCircle}
                className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                style={{ background: content.trim() && !isSubmitting ? '#4fffb0' : '#1e1e2e', color: content.trim() && !isSubmitting ? '#050508' : '#404058' }}>
                {isSubmitting ? <Loader size={13} className="animate-spin" /> : <Send size={13} />}
                {isSubmitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        ) : (
          <div className="card-panel rounded-xl p-5 text-center">
            <p className="text-sm" style={{ color: '#6b6b8a' }}>Join a circle to start posting.</p>
          </div>
        )}

        {/* Feed state */}
        {isLoadingPosts && (
          <div className="flex items-center justify-center py-12">
            <Loader size={20} className="animate-spin" style={{ color: '#4fffb0' }} />
          </div>
        )}
        {fetchError && (
          <div className="p-4 rounded-xl text-sm font-mono" style={{ color: '#ff6b35', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
            {fetchError}
          </div>
        )}
        {!isLoadingPosts && sorted.length === 0 && !fetchError && (
          <div className="text-center py-16">
            <p className="font-syne font-semibold text-white mb-2">No posts yet</p>
            <p className="text-sm" style={{ color: '#6b6b8a' }}>Be the first to post in your circles.</p>
          </div>
        )}
        {sorted.map((post, i) => (
          <PostCard key={post.id} post={post} delay={i * 60} onLike={() => toggleLike(post.id, post.isLiked)} onRequestAccess={() => requestAccess(post.id)} />
        ))}
      </div>
    </div>
  )
}
