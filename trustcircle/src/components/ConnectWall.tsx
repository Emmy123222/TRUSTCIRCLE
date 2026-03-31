import { Shield, Zap, Lock, Bot, Users, ChevronRight } from 'lucide-react'
import { useWalletContext } from '../hooks/useWallet'

const features = [
  { icon: Shield, label: 'Verified humans only', desc: 'On-chain trust scores gate every circle', color: '#4fffb0' },
  { icon: Lock, label: 'fhEVM encrypted DMs', desc: 'Zama homomorphic encryption on Sepolia', color: '#8b5cf6' },
  { icon: Bot, label: 'AI agent monitoring', desc: 'ERC-8004 agent detects bots in real time', color: '#38bdf8' },
  { icon: Users, label: 'Portable social graph', desc: 'Your data lives on Filecoin — forever yours', color: '#ff6b35' },
]

export function ConnectWall() {
  const { connect, isConnecting, error } = useWalletContext()

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(79,255,176,0.1)', border: '1px solid rgba(79,255,176,0.3)', boxShadow: '0 0 30px rgba(79,255,176,0.15)' }}
          >
            <Shield size={22} style={{ color: '#4fffb0' }} />
          </div>
          <div className="text-left">
            <div className="font-syne font-bold text-2xl">
              TRUST<span style={{ color: '#4fffb0' }}>CIRCLE</span>
            </div>
            <div className="font-mono text-xs" style={{ color: '#6b6b8a' }}>bot-free crypto social</div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-syne font-bold text-3xl text-white mb-3 leading-tight">
          Your on-chain identity<br />
          <span style={{ color: '#4fffb0' }} className="animate-glow">is your reputation.</span>
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: '#9898b8' }}>
          Connect your wallet to enter a verified, bot-free social network where your transaction history speaks louder than follower counts.
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
          {features.map(({ icon: Icon, label, desc, color }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: `${color}08`, border: `1px solid ${color}20` }}
            >
              <Icon size={16} className="mb-2" style={{ color }} />
              <div className="text-xs font-semibold text-white mb-0.5">{label}</div>
              <div className="font-mono text-[10px] leading-relaxed" style={{ color: '#6b6b8a' }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Connect button */}
        <button
          onClick={connect}
          disabled={isConnecting}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mb-3"
          style={{ background: '#4fffb0', color: '#050508', boxShadow: '0 0 30px rgba(79,255,176,0.25)' }}
        >
          <Zap size={18} />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          {!isConnecting && <ChevronRight size={16} />}
        </button>

        {error && (
          <div className="text-xs font-mono py-2 px-3 rounded-lg mb-3"
            style={{ color: '#ff6b35', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
            {error}
          </div>
        )}

        <p className="font-mono text-xs" style={{ color: '#404058' }}>
          Requires MetaMask · Sepolia testnet · No gas required for social actions
        </p>

        {/* Chain stack */}
        <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t" style={{ borderColor: '#1e1e2e' }}>
          {['Flow', 'Zama', 'Filecoin', 'ERC-8004'].map((tech, i) => (
            <span key={tech} className="font-mono text-[10px]" style={{ color: '#404058' }}>
              {i > 0 && <span className="mr-3">·</span>}{tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
