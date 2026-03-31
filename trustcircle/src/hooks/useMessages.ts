import { useCallback, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { createInstance } from 'fhevmjs'
import { ENCRYPTED_DM_ABI, CONTRACT_ADDRESSES, ZAMA_SEPOLIA } from '../lib/contracts'
import { useWalletContext } from './useWallet'
import { useAppStore, LiveDMThread } from '../lib/store'
import { useFilecoin } from './useFilecoin'

const GATEWAY = 'https://w3s.link/ipfs'

export interface LiveMessage {
  id: number
  from: string
  to: string
  contentCID: string
  content: string | null   // null if encrypted and no key yet
  isEncrypted: boolean
  timestamp: number
  deleted: boolean
}

export function useMessages() {
  const { provider, signer, address } = useWalletContext()
  const { threads, setThreads } = useAppStore()
  const { retrieveEncrypted } = useFilecoin()
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const contract = useCallback((write = false) => {
    const addr = CONTRACT_ADDRESSES.sepolia.EncryptedDM
    if (!addr) throw new Error('EncryptedDM address not set in .env')
    return new ethers.Contract(addr, ENCRYPTED_DM_ABI, write ? signer! : provider!)
  }, [provider, signer])

  /** Load all DM threads for the connected user */
  const loadThreads = useCallback(async () => {
    if (!provider || !address) return
    setIsLoading(true)
    try {
      const c = contract()
      const threadIds: string[] = await c.getUserThreads(address)

      const live: LiveDMThread[] = await Promise.all(
        threadIds.map(async (threadId) => {
          const msgIds: bigint[] = await c.getThreadMessages(threadId)
          const lastId = msgIds[msgIds.length - 1]
          let lastMsg = null
          if (lastId !== undefined) {
            lastMsg = await c.messages(lastId).catch(() => null)
          }
          const participantAddr = lastMsg
            ? (lastMsg.from.toLowerCase() === address.toLowerCase() ? lastMsg.to : lastMsg.from)
            : '0x0000000000000000000000000000000000000000'
          return {
            threadId,
            participantAddress: participantAddr,
            participantHandle: participantAddr.slice(0, 8) + '…',
            lastMessageTimestamp: lastMsg ? Number(lastMsg.timestamp) : 0,
            unreadCount: 0,
            isEncrypted: true,
            messageCount: msgIds.length,
          }
        })
      )

      setThreads(live.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [provider, address, contract, setThreads])

  /** Load messages for a thread */
  const loadThread = useCallback(async (threadId: string) => {
    if (!provider || !address) return
    setActiveThreadId(threadId)
    setIsLoading(true)
    try {
      const c = contract()
      const msgIds: bigint[] = await c.getThreadMessages(threadId)

      const loaded = await Promise.all(
        msgIds.map(async (id) => {
          const raw = await c.messages(id)
          return {
            id: Number(raw.id),
            from: raw.from,
            to: raw.to,
            contentCID: raw.contentCID,
            content: null,   // fetch from Filecoin below for non-encrypted
            isEncrypted: true, // all DMs are encrypted
            timestamp: Number(raw.timestamp),
            deleted: raw.deleted,
          } satisfies LiveMessage
        })
      )

      // For public (non-encrypted) messages, fetch content from Filecoin
      const withContent = await Promise.all(
        loaded.map(async (msg) => {
          if (msg.deleted || !msg.contentCID) return msg
          try {
            const res = await fetch(`${GATEWAY}/${msg.contentCID}`)
            if (res.ok) {
              const data = await res.json()
              return { ...msg, content: data.content || null }
            }
          } catch {}
          return msg
        })
      )

      setMessages(withContent)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [provider, address, contract])

  /**
   * Send an encrypted DM.
   *
   * Flow:
   *   1. Generate AES-256 key client-side
   *   2. Encrypt message content + upload to Filecoin
   *   3. Encrypt AES key twice with fhevmjs:
   *      - once for sender (as encSenderKey euint256)
   *      - once for recipient (as encRecipKey euint256)
   *   4. Call EncryptedDM.sendMessage(to, CID, encSenderKey, encRecipKey, proof)
   */
  const sendMessage = useCallback(async (toAddress: string, content: string): Promise<string> => {
    if (!signer || !provider || !address) throw new Error('Wallet not connected')
    setIsSending(true)
    setError(null)
    try {
      // 1. Generate AES key
      const aesKey = crypto.getRandomValues(new Uint8Array(32))
      const iv = crypto.getRandomValues(new Uint8Array(12))

      // 2. Encrypt content
      const cryptoKey = await crypto.subtle.importKey('raw', aesKey, { name: 'AES-GCM' }, false, ['encrypt'])
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, new TextEncoder().encode(JSON.stringify({ content, from: address, timestamp: new Date().toISOString() })))
      const packed = new Uint8Array(12 + ciphertext.byteLength)
      packed.set(iv); packed.set(new Uint8Array(ciphertext), 12)

      // 3. Upload to Filecoin
      const { create } = await import('@storacha/client')
      const { StoreMemory } = await import('@storacha/client/stores/memory')
      const storClient = await create({ store: new StoreMemory() })
      const spaceDid = import.meta.env.VITE_STORACHA_SPACE_DID
      if (spaceDid) await storClient.setCurrentSpace(spaceDid)
      const blob = new Blob([packed], { type: 'application/octet-stream' })
      const file = new File([blob], `dm_${Date.now()}.bin`)
      const cid = (await storClient.uploadFile(file)).toString()

      // 4. Encrypt AES key for both sender + recipient via fhevmjs
      const network = await provider.getNetwork()
      // Correct fhEVM configuration: Use only valid parameters
      const fhevm = await createInstance({
        chainId: Number(network.chainId),
        networkUrl: ZAMA_SEPOLIA.networkUrl,
        aclContractAddress: ZAMA_SEPOLIA.aclContractAddress,
        kmsContractAddress: ZAMA_SEPOLIA.kmsContractAddress,
      })
      const contractAddr = CONTRACT_ADDRESSES.sepolia.EncryptedDM
      const signerAddr = await signer.getAddress()
      const keyBigInt = BigInt('0x' + Buffer.from(aesKey).toString('hex'))

      const senderInput = fhevm.createEncryptedInput(contractAddr, signerAddr)
      senderInput.add256(keyBigInt)
      const { handles: sHandles, inputProof: sProof } = await senderInput.encrypt()

      const recipInput = fhevm.createEncryptedInput(contractAddr, toAddress)
      recipInput.add256(keyBigInt)
      const { handles: rHandles, inputProof: rProof } = await recipInput.encrypt()

      // 5. Send on-chain — we pass a combined proof; contract stores both keys
      const c = contract(true)
      const tx = await c.sendMessage(toAddress, cid, sHandles[0], rHandles[0], sProof)
      const receipt = await tx.wait()

      // Reload thread
      const threadId = await c.getThreadId(signerAddr, toAddress)
      await loadThread(threadId)

      return receipt.hash
    } catch (e: any) {
      setError(e.message)
      throw e
    } finally {
      setIsSending(false)
    }
  }, [signer, provider, address, contract, loadThread])

  useEffect(() => { loadThreads() }, [address, provider])

  return { threads, messages, activeThreadId, isLoading, isSending, error, loadThreads, loadThread, sendMessage }
}
