import { useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { TRUST_SCORE_ABI, CONTRACT_ADDRESSES, TRUST_TIER } from '../lib/contracts'
import { useAppStore, LiveUser } from '../lib/store'
import { useWalletContext } from './useWallet'

/**
 * useProfile — fetches the connected user's live on-chain profile.
 *
 * Data sources:
 *   - TrustScore.sol (Sepolia) → handle, tier, badges, onChainSince
 *   - Flow TrustCircleSocial → follower/following counts
 *   - Filecoin → reputation proof CID
 *
 * Trust score is encrypted (euint32) — we surface the tier (public)
 * and let the user request decryption via Zama Gateway when they want
 * their exact score.
 */
export function useProfile() {
  const { address, provider } = useWalletContext()
  const { setConnectedProfile, setGlobalError } = useAppStore()
  const profile = useAppStore((s) => s.connectedProfile)

  const fetchProfile = useCallback(async (addr?: string) => {
    const target = addr || address
    if (!target || !provider) return null

    try {
      const contractAddr = CONTRACT_ADDRESSES.sepolia.TrustScore
      if (!contractAddr) return null

      const contract = new ethers.Contract(contractAddr, TRUST_SCORE_ABI, provider)
      const raw = await contract.profiles(target)

      if (!raw.exists) return null

      // Build live profile from on-chain data only
      const liveProfile: LiveUser = {
        address: target,
        handle: raw.handle,
        tier: TRUST_TIER[raw.tier as keyof typeof TRUST_TIER] || 'rising',
        tierRaw: Number(raw.tier),
        isVerified: raw.isVerified,
        onChainSince: Number(raw.onChainSince),
        txCount: Number(raw.txCount),
        badges: Array.from(raw.badges).map(Number),
        // trustScore is null until user explicitly requests Gateway decryption
        trustScore: null,
        reputationCID: null,
      }

      return liveProfile
    } catch (err: any) {
      setGlobalError(`Failed to load profile: ${err.message}`)
      return null
    }
  }, [address, provider, setGlobalError])

  // Auto-fetch when wallet connects
  useEffect(() => {
    if (!address || !provider) {
      setConnectedProfile(null)
      return
    }
    fetchProfile(address).then((p) => {
      if (p) setConnectedProfile(p)
    })
  }, [address, provider])

  /**
   * Fetch any user's profile by address
   */
  const fetchUserProfile = useCallback(async (addr: string): Promise<LiveUser | null> => {
    return fetchProfile(addr)
  }, [fetchProfile])

  /**
   * Resolve on-chain data from Ethereum for a wallet
   * Used to enrich profiles with real tx count + wallet age
   */
  const fetchChainActivity = useCallback(async (addr: string) => {
    if (!provider) return null
    try {
      const [txCount, block] = await Promise.all([
        provider.getTransactionCount(addr),
        provider.getBlock('latest'),
      ])
      return {
        txCount,
        latestBlock: block?.number || 0,
      }
    } catch {
      return null
    }
  }, [provider])

  return {
    profile,
    fetchUserProfile,
    fetchChainActivity,
    isLoaded: !!profile,
  }
}
