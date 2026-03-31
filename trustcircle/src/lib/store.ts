/**
 * store.ts — Global live state for TrustCircle
 *
 * All data comes from:
 *   - Sepolia (Zama fhEVM) → trust scores, posts, DMs
 *   - Flow Testnet → circles, social graph, post metadata
 *   - Filecoin (Storacha) → post content, agent logs
 *   - AgentRegistry on Sepolia → agent stats + alerts
 *
 * No hardcoded data. Everything fetched from chain or contract events.
 */

import { create } from 'zustand'
import { ethers } from 'ethers'
import {
  TRUST_SCORE_ABI,
  ENCRYPTED_POSTS_ABI,
  AGENT_REGISTRY_ABI,
  CONTRACT_ADDRESSES,
  TRUST_TIER,
} from './contracts'

// ─── Types ────────────────────────────────────────────────────────
export interface LiveUser {
  address: string
  handle: string
  tier: string
  tierRaw: number
  isVerified: boolean
  onChainSince: number
  txCount: number
  badges: number[]
  trustScore: number | null   // null until decrypted via Gateway
  reputationCID: string | null // Filecoin CID of proof-of-history
}

export interface LivePost {
  id: number
  author: string
  authorHandle: string
  circleId: string
  contentCID: string
  content: string | null       // null if encrypted and no access
  isEncrypted: boolean
  hasAccess: boolean
  minTrustRequired: number
  timestamp: number
  likes: number
  replies: number
  isLiked: boolean
  tags: string[]
}

export interface LiveCircle {
  id: string
  name: string
  description: string
  minTrustScore: number
  memberCount: number
  color: string
  icon: string
  isJoined: boolean
  category: string
  postCount: number
}

export interface LiveAlert {
  id: string
  type: 'suspicious' | 'sentiment' | 'digest' | 'trust_update'
  title: string
  body: string
  timestamp: string
  severity: 'low' | 'medium' | 'high'
  read: boolean
  txHash?: string
  filecoinCID?: string
}

export interface LiveDMThread {
  threadId: string
  participantAddress: string
  participantHandle: string
  lastMessageTimestamp: number
  unreadCount: number
  isEncrypted: boolean
  messageCount: number
}

export interface AgentStats {
  agentId: string | null
  reputationScore: number
  tasksCompleted: number
  tasksFailed: number
  logsCID: string
  manifestCID: string
  lastActive: number
  status: string
  isRegistered: boolean
}

// ─── Store ────────────────────────────────────────────────────────
interface AppStore {
  // Auth
  connectedAddress: string | null
  connectedProfile: LiveUser | null
  setConnectedAddress: (addr: string | null) => void
  setConnectedProfile: (p: LiveUser | null) => void

  // Feed
  posts: LivePost[]
  isLoadingPosts: boolean
  setPosts: (posts: LivePost[]) => void
  addPost: (post: LivePost) => void
  updatePostLike: (postId: number, liked: boolean) => void
  setLoadingPosts: (v: boolean) => void

  // Circles
  circles: LiveCircle[]
  isLoadingCircles: boolean
  setCircles: (c: LiveCircle[]) => void
  updateCircleMembership: (id: string, joined: boolean) => void
  setLoadingCircles: (v: boolean) => void

  // DMs
  threads: LiveDMThread[]
  setThreads: (t: LiveDMThread[]) => void

  // Agent
  agentStats: AgentStats | null
  alerts: LiveAlert[]
  setAgentStats: (s: AgentStats) => void
  setAlerts: (a: LiveAlert[]) => void
  markAlertRead: (id: string) => void
  addAlert: (a: LiveAlert) => void

  // Global error
  globalError: string | null
  setGlobalError: (e: string | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  connectedAddress: null,
  connectedProfile: null,
  setConnectedAddress: (addr) => set({ connectedAddress: addr }),
  setConnectedProfile: (p) => set({ connectedProfile: p }),

  posts: [],
  isLoadingPosts: false,
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),
  updatePostLike: (postId, liked) =>
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? { ...p, isLiked: liked, likes: liked ? p.likes + 1 : p.likes - 1 }
          : p
      ),
    })),
  setLoadingPosts: (v) => set({ isLoadingPosts: v }),

  circles: [],
  isLoadingCircles: false,
  setCircles: (circles) => set({ circles }),
  updateCircleMembership: (id, joined) =>
    set((s) => ({
      circles: s.circles.map((c) =>
        c.id === id
          ? { ...c, isJoined: joined, memberCount: joined ? c.memberCount + 1 : Math.max(0, c.memberCount - 1) }
          : c
      ),
    })),
  setLoadingCircles: (v) => set({ isLoadingCircles: v }),

  threads: [],
  setThreads: (threads) => set({ threads }),

  agentStats: null,
  alerts: [],
  setAgentStats: (agentStats) => set({ agentStats }),
  setAlerts: (alerts) => set({ alerts }),
  markAlertRead: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
    })),
  addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts] })),

  globalError: null,
  setGlobalError: (globalError) => set({ globalError }),
}))
