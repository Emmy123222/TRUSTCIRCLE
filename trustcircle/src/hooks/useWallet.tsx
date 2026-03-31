import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { ethers } from 'ethers'

interface WalletState {
  address: string | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  error: string | null
}

interface WalletActions {
  connect: () => Promise<void>
  disconnect: () => void
  switchToSepolia: () => Promise<void>
}

export type WalletContext = WalletState & WalletActions

const SEPOLIA_CHAIN_ID = 11155111

const defaultState: WalletState = {
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  provider: null,
  signer: null,
  error: null,
}

export function useWallet(): WalletContext {
  const [state, setState] = useState<WalletState>(defaultState)

  const getProvider = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum)
    }
    return null
  }, [])

  // Auto-reconnect on mount if previously connected
  useEffect(() => {
    const saved = localStorage.getItem('trustcircle_wallet')
    if (saved) { connect() }
  }, [])

  // Listen for account/chain changes
  useEffect(() => {
    const eth = (window as any).ethereum
    if (!eth) return

    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setState(s => ({ ...s, address: accounts[0] }))
      }
    }

    const onChainChanged = (chainId: string) => {
      setState(s => ({ ...s, chainId: parseInt(chainId, 16) }))
    }

    eth.on('accountsChanged', onAccountsChanged)
    eth.on('chainChanged', onChainChanged)
    return () => {
      eth.removeListener('accountsChanged', onAccountsChanged)
      eth.removeListener('chainChanged', onChainChanged)
    }
  }, [])

  const connect = useCallback(async () => {
    setState(s => ({ ...s, isConnecting: true, error: null }))
    try {
      const provider = getProvider()
      if (!provider) throw new Error('No wallet detected. Install MetaMask.')

      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()
      const chainId = Number(network.chainId)

      setState({
        address,
        chainId,
        isConnected: true,
        isConnecting: false,
        provider,
        signer,
        error: null,
      })

      localStorage.setItem('trustcircle_wallet', address)
    } catch (err: any) {
      setState(s => ({
        ...s,
        isConnecting: false,
        error: err.message || 'Connection failed',
      }))
    }
  }, [getProvider])

  const disconnect = useCallback(() => {
    setState(defaultState)
    localStorage.removeItem('trustcircle_wallet')
  }, [])

  const switchToSepolia = useCallback(async () => {
    const eth = (window as any).ethereum
    if (!eth) return
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      })
    } catch (switchErr: any) {
      // Chain not added — add it
      if (switchErr.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        })
      }
    }
  }, [])

  return { ...state, connect, disconnect, switchToSepolia }
}

// ─── Context for app-wide access ─────────────────────────────────
import React from 'react'

const WalletCtx = createContext<WalletContext | null>(null)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet()
  return <WalletCtx.Provider value={wallet}>{children}</WalletCtx.Provider>
}

export function useWalletContext() {
  const ctx = useContext(WalletCtx)
  if (!ctx) throw new Error('useWalletContext must be used inside WalletProvider')
  return ctx
}
