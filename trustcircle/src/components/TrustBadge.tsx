import { clsx } from 'clsx'

interface TrustBadgeProps {
  tier: 'genesis' | 'verified' | 'trusted' | 'rising'
  score: number
  size?: 'sm' | 'md' | 'lg'
}

const tierConfig = {
  genesis: { label: 'GENESIS', color: '#4fffb0', bg: 'rgba(79,255,176,0.1)', border: 'rgba(79,255,176,0.3)' },
  verified: { label: 'VERIFIED', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)' },
  trusted: { label: 'TRUSTED', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.3)' },
  rising: { label: 'RISING', color: '#ff6b35', bg: 'rgba(255,107,53,0.1)', border: 'rgba(255,107,53,0.3)' },
}

export function TrustBadge({ tier, score, size = 'md' }: TrustBadgeProps) {
  const config = tierConfig[tier]
  return (
    <div className={clsx('flex items-center gap-1.5', size === 'sm' && 'text-xs', size === 'lg' && 'text-sm')}>
      <span
        className="font-mono font-medium px-2 py-0.5 rounded text-xs tracking-widest"
        style={{ color: config.color, background: config.bg, border: `1px solid ${config.border}` }}
      >
        {config.label}
      </span>
      <span className="font-mono text-xs" style={{ color: config.color }}>
        {score}
      </span>
    </div>
  )
}

interface TrustRingProps {
  score: number
  size?: number
}

export function TrustRing({ score, size = 64 }: TrustRingProps) {
  const pct = score / 1000
  const circumference = 2 * Math.PI * (size / 2 - 4)
  const strokeDash = circumference * pct

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          fill="none"
          stroke="#1e1e2e"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          fill="none"
          stroke="#4fffb0"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          style={{ filter: 'drop-shadow(0 0 6px rgba(79,255,176,0.6))' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-mono font-medium text-xs"
        style={{ color: '#4fffb0' }}
      >
        {score}
      </div>
    </div>
  )
}
