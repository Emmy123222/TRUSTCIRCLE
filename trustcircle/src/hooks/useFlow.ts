import { useState, useCallback, useEffect } from 'react'
import * as fcl from '@onflow/fcl'
import { useAppStore, LiveCircle } from '../lib/store'

const FLOW_CONTRACT = import.meta.env.VITE_FLOW_CONTRACT_ADDRESS || '0x7a79d79c5acf824b'
const FLOW_NETWORK = (import.meta.env.VITE_FLOW_NETWORK || 'testnet') as 'testnet' | 'mainnet'

const FLOW_CONFIG = {
  testnet: {
    accessNode: 'https://rest-testnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
    explorer: 'https://testnet.flowdiver.io',
  },
  mainnet: {
    accessNode: 'https://rest-mainnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/authn',
    explorer: 'https://www.flowdiver.io',
  },
}

export function configureFlow() {
  const cfg = FLOW_CONFIG[FLOW_NETWORK]
  fcl.config()
    .put('accessNode.api', cfg.accessNode)
    .put('discovery.wallet', cfg.discoveryWallet)
    .put('0xTRUSTCIRCLE', FLOW_CONTRACT)
    .put('flow.network', FLOW_NETWORK)
}

// ─── Cadence scripts ──────────────────────────────────────────────
// Fixes applied:
//   - `pub fun` → `access(all) fun`  (pub is deprecated in Cadence 1.0)
//   - `AuthAccount` → `auth(Storage) &Account`
//   - Transactions pass `signer.address` as `caller` parameter
//     because our contract functions take explicit caller: Address
const C = {
  createProfile: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    transaction(handle: String) {
      prepare(signer: auth(Storage) &Account) {}
      execute {
        TrustCircleSocial.createProfile(caller: 0xTRUSTCIRCLE, handle: handle)
      }
    }
  `,

  createProfileWithCaller: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    transaction(handle: String) {
      let callerAddr: Address
      prepare(signer: auth(Storage) &Account) {
        self.callerAddr = signer.address
      }
      execute {
        TrustCircleSocial.createProfile(caller: self.callerAddr, handle: handle)
      }
    }
  `,

  joinCircle: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    transaction(id: UInt64, att: String) {
      let callerAddr: Address
      prepare(signer: auth(Storage) &Account) {
        self.callerAddr = signer.address
      }
      execute {
        TrustCircleSocial.joinCircle(caller: self.callerAddr, circleId: id, trustAttestation: att)
      }
    }
  `,

  leaveCircle: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    transaction(id: UInt64) {
      let callerAddr: Address
      prepare(signer: auth(Storage) &Account) {
        self.callerAddr = signer.address
      }
      execute {
        TrustCircleSocial.leaveCircle(caller: self.callerAddr, circleId: id)
      }
    }
  `,

  followUser: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    transaction(target: Address) {
      let callerAddr: Address
      prepare(signer: auth(Storage) &Account) {
        self.callerAddr = signer.address
      }
      execute {
        TrustCircleSocial.followUser(follower: self.callerAddr, target: target)
      }
    }
  `,

  unfollowUser: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    transaction(target: Address) {
      let callerAddr: Address
      prepare(signer: auth(Storage) &Account) {
        self.callerAddr = signer.address
      }
      execute {
        TrustCircleSocial.unfollowUser(follower: self.callerAddr, target: target)
      }
    }
  `,

  registerPost: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    transaction(circleId: UInt64, contentCID: String, enc: Bool, minT: UInt32, ref: String) {
      let callerAddr: Address
      prepare(signer: auth(Storage) &Account) {
        self.callerAddr = signer.address
      }
      execute {
        TrustCircleSocial.registerPost(
          caller: self.callerAddr,
          circleId: circleId,
          contentCID: contentCID,
          isEncrypted: enc,
          minTrustRequired: minT,
          encryptedKeyRef: ref
        )
      }
    }
  `,

  createCircle: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    transaction(name: String, description: String, minTrust: UInt32, category: UInt8, color: String, icon: String) {
      let callerAddr: Address
      prepare(signer: auth(Storage) &Account) {
        self.callerAddr = signer.address
      }
      execute {
        TrustCircleSocial.createCircle(
          caller: self.callerAddr,
          name: name,
          description: description,
          minTrustScore: minTrust,
          category: category,
          color: color,
          icon: icon
        )
      }
    }
  `,

  // Scripts (read-only) — access(all) fun replaces pub fun
  totalCircles: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    access(all) fun main(): UInt64 {
      return TrustCircleSocial.totalCircles
    }
  `,

  getCircle: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    access(all) fun main(id: UInt64): TrustCircleSocial.Circle? {
      return TrustCircleSocial.getCircle(id: id)
    }
  `,

  getProfile: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    access(all) fun main(addr: Address): TrustCircleSocial.UserProfile? {
      return TrustCircleSocial.getProfile(userAddress: addr)
    }
  `,

  isMember: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    access(all) fun main(id: UInt64, addr: Address): Bool {
      return TrustCircleSocial.isMember(circleId: id, userAddress: addr)
    }
  `,

  getCirclePosts: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    access(all) fun main(id: UInt64): [UInt64] {
      return TrustCircleSocial.getCirclePosts(circleId: id)
    }
  `,

  getUserPosts: `
    import TrustCircleSocial from 0xTRUSTCIRCLE
    access(all) fun main(addr: Address): [UInt64] {
      return TrustCircleSocial.getUserPosts(userAddress: addr)
    }
  `,
}

export function useFlow() {
  const [flowAddr, setFlowAddr] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setCircles, updateCircleMembership, setLoadingCircles } = useAppStore()

  useEffect(() => {
    configureFlow()
    return fcl.currentUser.subscribe((u: any) => setFlowAddr(u.loggedIn ? u.addr : null))
  }, [])

  const connectFlow = useCallback(async () => {
    setIsConnecting(true)
    try { await fcl.authenticate() } catch (e: any) { setError(e.message) } finally { setIsConnecting(false) }
  }, [])

  const disconnectFlow = useCallback(async () => { await fcl.unauthenticate() }, [])

  const tx = useCallback(async (cadence: string, args: [any, string][]): Promise<string> => {
    const txId = await fcl.mutate({
      cadence,
      args: (arg: any, types: any) => args.map(([v, type]) => arg(v, types[type])),
      proposer: fcl.currentUser,
      payer: fcl.currentUser,
      authorizations: [fcl.currentUser],
      limit: 999,
    })
    await fcl.tx(txId).onceSealed()
    return txId
  }, [])

  const query = useCallback(async (cadence: string, args: [any, string][] = []) => {
    try {
      return await fcl.query({
        cadence,
        args: (arg: any, types: any) => args.map(([v, type]) => arg(v, types[type])),
      })
    } catch (e: any) {
      console.warn('Flow query failed:', e.message)
      return null
    }
  }, [])

  // ─── Transactions ────────────────────────────────────────────────
  const createProfile = useCallback((handle: string) =>
    tx(C.createProfileWithCaller, [[handle, 'String']]), [tx])

  const joinCircle = useCallback(async (circleId: number, attestation: string) => {
    const txId = await tx(C.joinCircle, [[circleId.toString(), 'UInt64'], [attestation, 'String']])
    updateCircleMembership(circleId.toString(), true)
    return txId
  }, [tx, updateCircleMembership])

  const leaveCircle = useCallback(async (circleId: number) => {
    const txId = await tx(C.leaveCircle, [[circleId.toString(), 'UInt64']])
    updateCircleMembership(circleId.toString(), false)
    return txId
  }, [tx, updateCircleMembership])

  const followUser = useCallback((addr: string) => {
    if (!addr || addr.length !== 18) throw new Error("Invalid Flow address")
    return tx(C.followUser, [[addr, 'Address']])
  }, [tx])

  const unfollowUser = useCallback((addr: string) => {
    if (!addr || addr.length !== 18) throw new Error("Invalid Flow address")
    return tx(C.unfollowUser, [[addr, 'Address']])
  }, [tx])

  const registerPost = useCallback((p: {
    circleId: number
    contentCID: string
    isEncrypted: boolean
    minTrustRequired: number
    encryptedKeyRef: string
  }) => {
    // Check if this is a demo CID
    if (p.contentCID.startsWith('bafybeig') && (
      localStorage.getItem(`demo_post_${p.contentCID}`) || 
      localStorage.getItem(`demo_encrypted_${p.contentCID}`)
    )) {
      console.log('📱 Demo mode: Skipping Flow registration...');
      
      // Generate a fake Flow transaction ID
      const demoFlowTxId = 'demo_flow_' + Math.random().toString(16).substring(2, 18);
      
      // Store demo Flow registration
      const demoFlowPost = {
        txId: demoFlowTxId,
        circleId: p.circleId,
        contentCID: p.contentCID,
        isEncrypted: p.isEncrypted,
        minTrustRequired: p.minTrustRequired,
        encryptedKeyRef: p.encryptedKeyRef,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`demo_flow_post_${demoFlowTxId}`, JSON.stringify(demoFlowPost));
      
      console.log('✅ Demo Flow registration completed with TX ID:', demoFlowTxId);
      
      // Return a promise that resolves to the demo transaction ID
      return Promise.resolve(demoFlowTxId);
    }
    
    // Normal Flow transaction
    return tx(C.registerPost, [
      [p.circleId.toString(), 'UInt64'],
      [p.contentCID, 'String'],
      [p.isEncrypted, 'Bool'],
      [p.minTrustRequired.toString(), 'UInt32'],
      [p.encryptedKeyRef, 'String'],
    ]);
  }, [tx])

  const createCircle = useCallback((p: {
    name: string
    description: string
    minTrustScore: number
    category: number
    color: string
    icon: string
  }) => tx(C.createCircle, [
    [p.name, 'String'],
    [p.description, 'String'],
    [p.minTrustScore.toString(), 'UInt32'],
    [p.category.toString(), 'UInt8'],
    [p.color, 'String'],
    [p.icon, 'String'],
  ]), [tx])

  // ─── Scripts ─────────────────────────────────────────────────────
  const getProfile = useCallback((addr: string) => {
    if (!addr || addr.length !== 18) return Promise.resolve(null)
    return query(C.getProfile, [[addr, 'Address']])
  }, [query])

  const checkMembership = useCallback((circleId: number, addr: string): Promise<boolean> => {
    if (!addr || addr.length !== 18) return Promise.resolve(false)
    return query(C.isMember, [[circleId.toString(), 'UInt64'], [addr, 'Address']])
  }, [query])

  const getCirclePosts = useCallback((circleId: number): Promise<number[]> =>
    query(C.getCirclePosts, [[circleId.toString(), 'UInt64']]), [query])

  const getUserPosts = useCallback((addr: string): Promise<number[]> => {
    if (!addr || addr.length !== 18) return Promise.resolve([])
    return query(C.getUserPosts, [[addr, 'Address']])
  }, [query])

  // ─── Load all circles from Flow ───────────────────────────────────
  const loadCircles = useCallback(async () => {
    if (!FLOW_CONTRACT) return
    setLoadingCircles(true)
    setError(null)
    try {
      const total: number = await query(C.totalCircles) ?? 0
      if (total === 0) { setCircles([]); return }

      const loaded: LiveCircle[] = []
      for (let i = 1; i <= total; i++) {
        const raw = await query(C.getCircle, [[i.toString(), 'UInt64']])
        if (!raw) continue
        const isJoined = flowAddr
          ? await checkMembership(i, flowAddr).catch(() => false)
          : false
        loaded.push({
          id: i.toString(),
          name: raw.name,
          description: raw.description,
          minTrustScore: Number(raw.minTrustScore),
          memberCount: Number(raw.memberCount),
          color: raw.color || '#4fffb0',
          icon: raw.icon || '●',
          isJoined,
          category: String(raw.category ?? '0'),
          postCount: Number(raw.postCount),
        })
      }
      setCircles(loaded)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingCircles(false)
    }
  }, [flowAddr, query, checkMembership, setCircles, setLoadingCircles])

  useEffect(() => { loadCircles() }, [flowAddr])

  return {
    flowAddr,
    isConnecting,
    isConnected: !!flowAddr,
    error,
    explorer: FLOW_CONFIG[FLOW_NETWORK].explorer,
    connectFlow,
    disconnectFlow,
    createProfile,
    createCircle,
    joinCircle,
    leaveCircle,
    followUser,
    unfollowUser,
    registerPost,
    getProfile,
    checkMembership,
    getCirclePosts,
    getUserPosts,
    loadCircles,
  }
}