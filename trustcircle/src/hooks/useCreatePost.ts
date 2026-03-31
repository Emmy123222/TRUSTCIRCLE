import { useState, useCallback } from 'react'
import { useWalletContext } from './useWallet'
import { usePosts } from './usePosts'
import { useFilecoin } from './useFilecoin'
import { useFlow } from './useFlow'
import { LiveCircle } from '../lib/store'
import { useAppStore } from '../lib/store'

export type PostStep = 'idle' | 'encrypting' | 'uploading_filecoin' | 'storing_zama' | 'registering_flow' | 'done' | 'error'

const LABELS: Record<PostStep, string> = {
  idle: 'Ready', encrypting: 'Encrypting with AES-256-GCM…',
  uploading_filecoin: 'Uploading to Filecoin…', storing_zama: 'Storing key on Sepolia via Zama fhEVM…',
  registering_flow: 'Registering on Flow…', done: 'Posted!', error: 'Failed',
}

export interface CreatePostState {
  step: PostStep; stepLabel: string
  filecoinCID: string | null; sepoliaTxHash: string | null; flowTxId: string | null
  error: string | null; isSubmitting: boolean
}

export function useCreatePost() {
  const { isConnected, address } = useWalletContext()
  const { createPublicPost, createEncryptedPost } = usePosts()
  const { uploadPost, uploadEncryptedPost } = useFilecoin()
  const { registerPost } = useFlow()
  const { connectedAddress } = useAppStore()

  const [state, setState] = useState<CreatePostState>({
    step: 'idle', stepLabel: LABELS.idle,
    filecoinCID: null, sepoliaTxHash: null, flowTxId: null,
    error: null, isSubmitting: false,
  })

  const step = (s: PostStep) => setState(prev => ({ ...prev, step: s, stepLabel: LABELS[s] }))
  const reset = () => setState({ step: 'idle', stepLabel: LABELS.idle, filecoinCID: null, sepoliaTxHash: null, flowTxId: null, error: null, isSubmitting: false })

  const submitPublicPost = useCallback(async (content: string, circle: LiveCircle): Promise<boolean> => {
    if (!isConnected || !address) { setState(p => ({ ...p, step: 'error', stepLabel: LABELS.error, error: 'Connect wallet first', isSubmitting: false })); return false }
    setState(p => ({ ...p, isSubmitting: true, step: 'uploading_filecoin', stepLabel: LABELS.uploading_filecoin }))
    try {
      // 1. Upload content to Filecoin
      const cid = await uploadPost(content, { circleId: circle.id, author: address, timestamp: new Date().toISOString() })
      if (!cid) throw new Error('Filecoin upload failed')
      setState(p => ({ ...p, filecoinCID: cid, step: 'storing_zama', stepLabel: LABELS.storing_zama }))

      // 2. Store on Sepolia via Zama (no key needed for public posts)
      const { postId, txHash } = await createPublicPost(circle.id, cid, circle.minTrustScore)
      setState(p => ({ ...p, sepoliaTxHash: txHash, step: 'registering_flow', stepLabel: LABELS.registering_flow }))

      // 3. Register on Flow
      const flowTxId = await registerPost({ circleId: Number(circle.id), contentCID: cid, isEncrypted: false, minTrustRequired: circle.minTrustScore, encryptedKeyRef: '' })
      setState(p => ({ ...p, flowTxId, step: 'done', stepLabel: LABELS.done, isSubmitting: false }))
      return true
    } catch (e: any) {
      setState(p => ({ ...p, step: 'error', stepLabel: LABELS.error, error: e.message, isSubmitting: false }))
      return false
    }
  }, [isConnected, address, uploadPost, createPublicPost, registerPost])

  const submitEncryptedPost = useCallback(async (content: string, circle: LiveCircle): Promise<boolean> => {
    if (!isConnected || !address) { setState(p => ({ ...p, step: 'error', stepLabel: LABELS.error, error: 'Connect wallet first', isSubmitting: false })); return false }
    setState(p => ({ ...p, isSubmitting: true, step: 'encrypting', stepLabel: LABELS.encrypting }))
    try {
      // 1. Encrypt client-side + upload to Filecoin
      step('uploading_filecoin')
      const result = await uploadEncryptedPost(content, { circleId: circle.id, author: address, timestamp: new Date().toISOString() })
      if (!result) throw new Error('Encrypted Filecoin upload failed')
      setState(p => ({ ...p, filecoinCID: result.cid, step: 'storing_zama', stepLabel: LABELS.storing_zama }))

      // 2. Encrypt AES key with fhevmjs, store on Sepolia
      const { postId, txHash } = await createEncryptedPost(circle.id, result.cid, circle.minTrustScore, result.aesKey)
      setState(p => ({ ...p, sepoliaTxHash: txHash, step: 'registering_flow', stepLabel: LABELS.registering_flow }))

      // 3. Register on Flow with Sepolia tx hash as the key reference
      const flowTxId = await registerPost({ circleId: Number(circle.id), contentCID: result.cid, isEncrypted: true, minTrustRequired: circle.minTrustScore, encryptedKeyRef: txHash })
      setState(p => ({ ...p, flowTxId, step: 'done', stepLabel: LABELS.done, isSubmitting: false }))
      return true
    } catch (e: any) {
      setState(p => ({ ...p, step: 'error', stepLabel: LABELS.error, error: e.message, isSubmitting: false }))
      return false
    }
  }, [isConnected, address, uploadEncryptedPost, createEncryptedPost, registerPost])

  return { ...state, submitPublicPost, submitEncryptedPost, reset }
}
