import { Wallet, LogOut, AlertCircle, ExternalLink, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useWalletContext } from '../hooks/useWallet'
import { clsx } from 'clsx'

export function WalletButton() {
  const { address, chainId, isConnected, isConnecting, error, connect, disconnect, switchToSepolia } = useWalletContext()
  const [showMenu, setShowMenu] = useState(false)

  const isWrongNetwork = isConnected && chainId !== 11155111

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isConnecting}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
        style={{ background: '#4fffb0', color: '#050508' }}
      >
        <Wallet size={15} />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  if (isWrongNetwork) {
    return (
      <button
        onClick={switchToSepolia}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        style={{ color: '#ff6b35', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)' }}
      >
        <AlertCircle size={15} />
        Switch to Sepolia
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-mono transition-all"
        style={{ background: 'rgba(79,255,176,0.08)', border: '1px solid rgba(79,255,176,0.2)', color: '#4fffb0' }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: '#4fffb0' }} />
        {shortAddr}
        <ChevronDown size={12} />
      </button>

      {showMenu && (
        <div
          className="absolute top-full right-0 mt-2 w-52 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ background: '#12121e', border: '1px solid #1e1e2e' }}
        >
          <div className="px-3 py-2.5 border-b" style={{ borderColor: '#1e1e2e' }}>
            <div className="font-mono text-xs" style={{ color: '#6b6b8a' }}>Connected to</div>
            <div className="font-mono text-sm font-medium" style={{ color: '#4fffb0' }}>Sepolia Testnet</div>
          </div>
          <a
            href={`https://sepolia.etherscan.io/address/${address}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
            style={{ color: '#9898b8' }}
            onClick={() => setShowMenu(false)}
          >
            <ExternalLink size={13} />
            View on Etherscan
          </a>
          <button
            onClick={() => { disconnect(); setShowMenu(false) }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
            style={{ color: '#ff6b35' }}
          >
            <LogOut size={13} />
            Disconnect
          </button>
        </div>
      )}

      {error && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 rounded-lg text-xs font-mono"
          style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', color: '#ff6b35', whiteSpace: 'nowrap' }}>
          {error}
        </div>
      )}
    </div>
  )
}
