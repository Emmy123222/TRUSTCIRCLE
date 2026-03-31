import { NavLink } from 'react-router-dom'
import { Home, MessageSquare, Bell, User, Bot, Shield, Zap, Hash, Loader } from 'lucide-react'
import { clsx } from 'clsx'
import { useWalletContext } from '../hooks/useWallet'
import { useAppStore } from '../lib/store'
import { TrustRing } from './TrustBadge'
import { WalletButton } from './WalletButton'

const NAV = [
  { to: '/', icon: Home, label: 'Feed' },
  { to: '/circles', icon: Hash, label: 'Circles' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/alerts', icon: Bell, label: 'AI Agent' },
  { to: '/profile', icon: User, label: 'Profile' },
]

const TIER_SCORE: Record<string, number> = { rising: 200, trusted: 600, verified: 800, genesis: 950 }

export function Sidebar() {
  const { address, isConnected } = useWalletContext()
  const { connectedProfile, alerts, agentStats } = useAppStore()
  const unread = alerts.filter(a => !a.read).length
  const estimatedScore = connectedProfile ? TIER_SCORE[connectedProfile.tier] || 100 : 0

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r border-border bg-surface z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(79,255,176,0.1)', border: '1px solid rgba(79,255,176,0.3)' }}>
            <Shield size={16} style={{ color: '#4fffb0' }} />
          </div>
          <div>
            <div className="font-syne font-bold text-white text-sm tracking-wider">TRUST<span style={{ color: '#4fffb0' }}>CIRCLE</span></div>
            <div className="font-mono text-xs" style={{ color: '#6b6b8a' }}>bot-free social</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive ? 'text-trust bg-trust/10 border border-trust/20' : 'text-ghost hover:text-white hover:bg-muted border border-transparent'
            )}>
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={17} style={isActive ? { color: '#4fffb0' } : {}} />
                  {label === 'AI Agent' && unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-bold font-mono"
                      style={{ background: '#ff6b35', color: '#fff' }}>{unread}</span>
                  )}
                </div>
                <span>{label}</span>
                {label === 'AI Agent' && agentStats?.isRegistered && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: agentStats.status === 'Active' ? '#4fffb0' : '#ff6b35' }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Network status */}
      <div className="px-4 py-3 mx-4 mb-3 rounded-lg" style={{ background: 'rgba(79,255,176,0.04)', border: '1px solid rgba(79,255,176,0.1)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Zap size={11} style={{ color: '#4fffb0' }} />
          <span className="font-mono text-xs" style={{ color: '#6b6b8a' }}>NETWORK STATUS</span>
        </div>
        <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
          <div><span style={{ color: '#4fffb0' }}>●</span> <span style={{ color: '#6b6b8a' }}>Sepolia</span></div>
          <div><span style={{ color: '#4fffb0' }}>●</span> <span style={{ color: '#6b6b8a' }}>Flow</span></div>
          <div><span style={{ color: '#4fffb0' }}>●</span> <span style={{ color: '#6b6b8a' }}>FIL</span></div>
        </div>
      </div>

      {/* Wallet button */}
      <div className="px-4 pb-3">
        <WalletButton />
      </div>

      {/* User strip */}
      <div className="p-4 border-t border-border">
        {isConnected && address ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-syne font-bold text-sm flex-shrink-0 ring-1"
              style={{ background: 'linear-gradient(135deg, #1a6645, #0a3d2a)' }}>
              {connectedProfile?.handle?.slice(0, 2).toUpperCase() || address.slice(2, 4).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {connectedProfile ? (
                <>
                  <div className="text-sm font-semibold text-white truncate">
                    {connectedProfile.handle ? `@${connectedProfile.handle}` : address.slice(0, 10)}
                  </div>
                  <div className="font-mono text-xs capitalize" style={{ color: '#6b6b8a' }}>{connectedProfile.tier}</div>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Loader size={11} className="animate-spin" style={{ color: '#4fffb0' }} />
                  <span className="font-mono text-xs" style={{ color: '#6b6b8a' }}>Loading…</span>
                </div>
              )}
            </div>
            {connectedProfile && <TrustRing score={estimatedScore} size={36} />}
          </div>
        ) : (
          <div className="text-center">
            <p className="font-mono text-xs" style={{ color: '#404058' }}>Connect wallet to continue</p>
          </div>
        )}
      </div>
    </aside>
  )
}
