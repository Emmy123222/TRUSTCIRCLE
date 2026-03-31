import { Heart, MessageCircle, Repeat2, Lock, Share, ExternalLink } from 'lucide-react'
import { LivePost } from '../lib/store'
import { clsx } from 'clsx'

interface PostCardProps {
  post: LivePost
  delay?: number
  onLike: () => void
  onRequestAccess: () => void
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const TIER_COLOR: Record<string, string> = { rising: '#ff6b35', trusted: '#38bdf8', verified: '#8b5cf6', genesis: '#4fffb0' }

export function PostCard({ post, delay = 0, onLike, onRequestAccess }: PostCardProps) {
  const shortAddr = `${post.author.slice(0, 6)}…${post.author.slice(-4)}`
  const tierColor = '#4fffb0'

  return (
    <article
      className="card-panel rounded-xl p-5 opacity-0 animate-fade-in-up hover:scale-[1.003] transition-transform duration-200"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {post.isEncrypted && (
          <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full"
            style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <Lock size={9} /> ENCRYPTED
          </span>
        )}
        <span className="ml-auto font-mono text-xs" style={{ color: '#404058' }}>{timeAgo(post.timestamp)}</span>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-syne font-bold text-sm flex-shrink-0 ring-1"
          style={{ background: 'linear-gradient(135deg, #1a6645, #0a3d2a)' }}>
          {post.author.slice(2, 4).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">
              {post.authorHandle || shortAddr}
            </span>
            <a href={`https://sepolia.etherscan.io/address/${post.author}`} target="_blank" rel="noreferrer"
              className="font-mono text-xs hover:opacity-80 transition-opacity" style={{ color: '#404058' }}>
              {shortAddr}
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      {post.isEncrypted && !post.hasAccess ? (
        <div className="mb-4 p-4 rounded-lg cursor-pointer hover:border-violet/50 transition-colors"
          style={{ background: 'rgba(139,92,246,0.06)', border: '1px dashed rgba(139,92,246,0.3)' }}
          onClick={onRequestAccess}>
          <div className="flex items-center gap-2 mb-2">
            <Lock size={14} style={{ color: '#8b5cf6' }} />
            <span className="font-mono text-xs font-medium" style={{ color: '#8b5cf6' }}>fhEVM ENCRYPTED</span>
          </div>
          <p className="font-mono text-xs leading-relaxed mb-2" style={{ color: '#6b6b8a' }}>
            Content encrypted via Zama fhEVM · AES-256 key stored as euint256 on Sepolia
          </p>
          <div className="font-mono text-[10px]" style={{ color: '#404058' }}>
            Requires trust ≥ {post.minTrustRequired} — click to request access
          </div>
        </div>
      ) : post.content ? (
        <p className="text-silver text-sm leading-relaxed mb-4">{post.content}</p>
      ) : (
        <div className="mb-4 p-3 rounded-lg" style={{ background: '#0c0c14', border: '1px solid #1e1e2e' }}>
          <div className="flex items-center gap-2">
            <a href={`https://w3s.link/ipfs/${post.contentCID}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 font-mono text-xs hover:opacity-80" style={{ color: '#38bdf8' }}>
              <ExternalLink size={10} />View on Filecoin
            </a>
            <span className="font-mono text-[10px]" style={{ color: '#404058' }}>{post.contentCID.slice(0, 20)}…</span>
          </div>
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map(tag => (
            <span key={tag} className="font-mono text-[11px] cursor-pointer hover:text-trust transition-colors" style={{ color: '#38bdf8' }}>{tag}</span>
          ))}
        </div>
      )}

      {/* Trust gate */}
      <div className="flex items-center gap-1.5 mb-4">
        <div className="h-px flex-1" style={{ background: '#1e1e2e' }} />
        <span className="font-mono text-[10px]" style={{ color: '#404058' }}>trust ≥ {post.minTrustRequired}</span>
        <div className="h-px flex-1" style={{ background: '#1e1e2e' }} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button onClick={onLike}
          className={clsx('flex items-center gap-1.5 font-mono text-xs transition-all duration-200 hover:scale-110', post.isLiked ? 'text-trust' : 'text-dim hover:text-trust')}>
          <Heart size={14} fill={post.isLiked ? '#4fffb0' : 'none'} />
          {post.likes}
        </button>
        <button className="flex items-center gap-1.5 font-mono text-xs text-dim hover:text-sky transition-colors">
          <MessageCircle size={14} />
          {post.replies}
        </button>
        <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES_LINK}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 font-mono text-xs text-dim hover:text-trust transition-colors" title="View on-chain">
          <ExternalLink size={13} />
        </a>
      </div>
    </article>
  )
}

// Helper — link to contract for post context
const CONTRACT_ADDRESSES_LINK = import.meta.env.VITE_ENCRYPTED_POSTS_CONTRACT || ''
