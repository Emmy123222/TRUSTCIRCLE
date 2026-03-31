import { useEffect, useCallback, useState } from 'react'
import { ethers } from 'ethers'
import { ENCRYPTED_POSTS_ABI, CONTRACT_ADDRESSES } from '../lib/contracts'
import { useAppStore, LivePost } from '../lib/store'
import { useWalletContext } from './useWallet'

const FILECOIN_GATEWAY = 'https://w3s.link/ipfs'

/**
 * useFeed — loads real posts from on-chain events + Filecoin content
 *
 * Flow:
 *   1. Listen to PostCreated events on EncryptedPosts.sol (Sepolia)
 *   2. For each event, read post struct from contract
 *   3. Fetch content from Filecoin via CID (for public posts)
 *   4. For encrypted posts: show locked state until requestPostAccess
 *   5. Also fetch handle via TrustScore.profiles()
 */
export function useFeed(circleId?: string) {
  const { provider, address } = useWalletContext()
  const { posts, setPosts, addPost, updatePostLike, isLoadingPosts, setLoadingPosts } = useAppStore()
  const [fetchError, setFetchError] = useState<string | null>(null)

  const getContract = useCallback(() => {
    const addr = CONTRACT_ADDRESSES.sepolia.EncryptedPosts
    if (!addr || !provider) return null
    return new ethers.Contract(addr, ENCRYPTED_POSTS_ABI, provider)
  }, [provider])

  /**
   * Fetch content from Filecoin for a single CID
   */
  const fetchContent = useCallback(async (cid: string): Promise<string | null> => {
    if (!cid) return null
    try {
      const res = await fetch(`${FILECOIN_GATEWAY}/${cid}`)
      if (!res.ok) return null
      const text = await res.text()
      try {
        const parsed = JSON.parse(text)
        return parsed.content || text
      } catch {
        return text
      }
    } catch {
      return null
    }
  }, [])

  /**
   * Hydrate a single post: read from contract + fetch from Filecoin
   */
  const hydratePost = useCallback(async (
    postId: bigint,
    contract: ethers.Contract
  ): Promise<LivePost | null> => {
    try {
      const raw = await contract.posts(postId)
      if (!raw.exists || raw.deleted) return null

      // Check if connected user liked this post
      const isLiked = address
        ? await contract.hasLiked(postId, address).catch(() => false)
        : false

      // Fetch content from Filecoin (public posts only)
      const content = raw.isEncrypted ? null : await fetchContent(raw.contentCID)

      // Parse tags from content if present
      const tags: string[] = []
      if (content) {
        const tagMatches = content.match(/#[a-zA-Z0-9_]+/g)
        if (tagMatches) tags.push(...tagMatches.slice(0, 5))
      }

      return {
        id: Number(raw.id),
        author: raw.author,
        authorHandle: '',   // enriched separately via TrustScore.profiles()
        circleId: raw.circleId,
        contentCID: raw.contentCID,
        content,
        isEncrypted: raw.isEncrypted,
        hasAccess: !raw.isEncrypted,
        minTrustRequired: Number(raw.minTrustRequired),
        timestamp: Number(raw.timestamp),
        likes: Number(raw.likes),
        replies: Number(raw.replies),
        isLiked,
        tags,
      }
    } catch {
      return null
    }
  }, [address, fetchContent])

  /**
   * Load all posts, optionally filtered by circleId
   */
  const loadPosts = useCallback(async () => {
    const contract = getContract()
    if (!contract) return
    setLoadingPosts(true)
    setFetchError(null)

    try {
      let postIds: bigint[] = []

      if (circleId) {
        // Fetch posts for a specific circle
        const circleIdBytes = ethers.keccak256(ethers.toUtf8Bytes(circleId))
        postIds = await contract.getCirclePosts(circleIdBytes)
      } else {
        // Fetch recent PostCreated events (last 1000 blocks)
        const latestBlock = await provider!.getBlockNumber()
        const fromBlock = Math.max(0, latestBlock - 1000)
        const filter = contract.filters.PostCreated()
        const events = await contract.queryFilter(filter, fromBlock, latestBlock)
        postIds = events.map((e: any) => e.args?.postId).filter(Boolean)
      }

      // Reverse so newest first, limit to 50
      const recent = [...postIds].reverse().slice(0, 50)

      const hydrated = await Promise.all(
        recent.map((id) => hydratePost(id, contract))
      )

      setPosts(hydrated.filter((p): p is LivePost => p !== null))
    } catch (err: any) {
      setFetchError(err.message)
    } finally {
      setLoadingPosts(false)
    }
  }, [getContract, circleId, provider, hydratePost, setPosts, setLoadingPosts])

  /**
   * Like / unlike a post on-chain
   */
  const toggleLike = useCallback(async (postId: number, currentlyLiked: boolean) => {
    const contractAddr = CONTRACT_ADDRESSES.sepolia.EncryptedPosts
    if (!contractAddr || !provider) return

    // Optimistic update
    updatePostLike(postId, !currentlyLiked)

    try {
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(contractAddr, ENCRYPTED_POSTS_ABI, signer)
      const tx = currentlyLiked
        ? await contract.unlikePost(postId)
        : await contract.likePost(postId)
      await tx.wait()
    } catch (err: any) {
      // Revert optimistic update
      updatePostLike(postId, currentlyLiked)
      setFetchError(`Like failed: ${err.message}`)
    }
  }, [provider, updatePostLike])

  /**
   * Request access to an encrypted post via Zama fhEVM
   * The contract checks trust score homomorphically and conditionally
   * re-encrypts the symmetric key for the requester
   */
  const requestAccess = useCallback(async (postId: number) => {
    const contractAddr = CONTRACT_ADDRESSES.sepolia.EncryptedPosts
    if (!contractAddr || !provider) return false
    try {
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(contractAddr, ENCRYPTED_POSTS_ABI, signer)
      const tx = await contract.requestPostAccess(postId)
      await tx.wait()
      // Re-fetch post to get updated access state
      await loadPosts()
      return true
    } catch (err: any) {
      setFetchError(`Access request failed: ${err.message}`)
      return false
    }
  }, [provider, loadPosts])

  // Listen for new PostCreated events in real time
  useEffect(() => {
    const contract = getContract()
    if (!contract) return

    const onPostCreated = async (postId: bigint) => {
      const post = await hydratePost(postId, contract)
      if (post) addPost(post)
    }

    contract.on('PostCreated', onPostCreated)
    return () => { contract.off('PostCreated', onPostCreated) }
  }, [getContract, hydratePost, addPost])

  // Initial load
  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  return {
    posts,
    isLoadingPosts,
    fetchError,
    loadPosts,
    toggleLike,
    requestAccess,
  }
}
