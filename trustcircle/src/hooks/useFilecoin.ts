import { useState, useCallback, useRef } from 'react'
import { create } from '@storacha/client'
import { StoreMemory } from '@storacha/client/stores/memory'

const GATEWAY = 'https://w3s.link/ipfs'
const SPACE_DID = import.meta.env.VITE_STORACHA_SPACE_DID || ''

let _client: Awaited<ReturnType<typeof create>> | null = null

async function getClient() {
  if (_client) return _client
  _client = await create({ store: new StoreMemory() })
  if (SPACE_DID) await _client.setCurrentSpace(SPACE_DID as `did:${string}:${string}`)
  return _client
}

export function useFilecoin() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  /**
   * Upload a JSON payload to Filecoin via Storacha.
   * Returns the real CID.
   */
  const uploadJSON = useCallback(async (data: object, filename: string): Promise<string | null> => {
    setIsUploading(true)
    setUploadProgress(10)
    setError(null)
    try {
      const client = await getClient()
      setUploadProgress(30)
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      const file = new File([blob], filename, { type: 'application/json' })
      setUploadProgress(60)
      const cid = await client.uploadFile(file)
      setUploadProgress(100)
      return cid.toString()
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [])

  /**
   * Upload plaintext post content to Filecoin.
   */
  const uploadPost = useCallback(async (content: string, metadata: {
    circleId: string
    author: string
    timestamp: string
    tags?: string[]
  }): Promise<string | null> => {
    // Check if Storacha is configured
    if (!SPACE_DID) {
      console.log('📱 Storacha not configured, using demo mode for post upload...');
      // Generate a fake CID for demo mode
      const demoData = { content, ...metadata };
      const demoHash = btoa(JSON.stringify(demoData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 46);
      const demoCID = `bafybeig${demoHash.toLowerCase()}`;
      
      // Store in localStorage for demo retrieval
      localStorage.setItem(`demo_post_${demoCID}`, JSON.stringify(demoData));
      
      console.log('✅ Demo post stored locally with CID:', demoCID);
      return demoCID;
    }
    
    return uploadJSON({ content, ...metadata }, `post_${Date.now()}.json`)
  }, [uploadJSON])

  /**
   * Encrypt content client-side with AES-256-GCM, upload to Filecoin.
   * Returns { cid, aesKey, iv } — the AES key is then stored on Sepolia via Zama.
   */
  const uploadEncryptedPost = useCallback(async (plaintext: string, metadata: {
    circleId: string
    author: string
    timestamp: string
  }): Promise<{ cid: string; aesKey: Uint8Array; iv: Uint8Array } | null> => {
    // Check if Storacha is configured
    if (!SPACE_DID) {
      console.log('📱 Storacha not configured, using demo mode for encrypted post...');
      
      // Generate demo AES key and IV
      const aesKey = crypto.getRandomValues(new Uint8Array(32));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Create demo encrypted data (just base64 encode for demo)
      const demoData = { content: plaintext, ...metadata };
      const demoEncrypted = btoa(JSON.stringify(demoData));
      const demoHash = demoEncrypted.replace(/[^a-zA-Z0-9]/g, '').substring(0, 46);
      const demoCID = `bafybeig${demoHash.toLowerCase()}`;
      
      // Store in localStorage for demo retrieval
      localStorage.setItem(`demo_encrypted_${demoCID}`, JSON.stringify({
        encrypted: demoEncrypted,
        metadata
      }));
      
      console.log('✅ Demo encrypted post stored locally with CID:', demoCID);
      return { cid: demoCID, aesKey, iv };
    }

    setIsUploading(true)
    setUploadProgress(10)
    setError(null)
    try {
      // 1. Generate AES-256-GCM key + IV
      const aesKey = crypto.getRandomValues(new Uint8Array(32))
      const iv = crypto.getRandomValues(new Uint8Array(12))
      setUploadProgress(20)

      // 2. Encrypt
      const cryptoKey = await crypto.subtle.importKey('raw', aesKey, { name: 'AES-GCM' }, false, ['encrypt'])
      const payload = JSON.stringify({ content: plaintext, ...metadata })
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, new TextEncoder().encode(payload))
      setUploadProgress(40)

      // 3. Pack iv + ciphertext
      const packed = new Uint8Array(12 + ciphertext.byteLength)
      packed.set(iv)
      packed.set(new Uint8Array(ciphertext), 12)

      // 4. Upload to Filecoin
      const client = await getClient()
      setUploadProgress(65)
      const blob = new Blob([packed], { type: 'application/octet-stream' })
      const file = new File([blob], `enc_post_${Date.now()}.bin`)
      const cid = await client.uploadFile(file)
      setUploadProgress(100)

      return { cid: cid.toString(), aesKey, iv }
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [])

  /**
   * Retrieve plaintext content from Filecoin by CID.
   */
  const retrieve = useCallback(async (cid: string): Promise<any | null> => {
    // Check if this is a demo CID (stored locally)
    const demoData = localStorage.getItem(`demo_post_${cid}`);
    if (demoData) {
      console.log('📱 Retrieving demo post from localStorage:', cid);
      try {
        return JSON.parse(demoData);
      } catch (e) {
        console.error('Failed to parse demo data:', e);
        return null;
      }
    }

    // Try to fetch from Filecoin gateway
    try {
      const res = await fetch(`${GATEWAY}/${cid}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      try { return JSON.parse(text) } catch { return text }
    } catch (e: any) {
      setError(e.message)
      return null
    }
  }, [])

  /**
   * Retrieve and decrypt an encrypted post from Filecoin.
   * @param cid      Filecoin CID
   * @param aesKey   Raw AES-256 key bytes (obtained from Zama fhEVM decryption)
   */
  const retrieveEncrypted = useCallback(async (cid: string, aesKey: Uint8Array): Promise<any | null> => {
    try {
      const res = await fetch(`${GATEWAY}/${cid}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const packed = new Uint8Array(await res.arrayBuffer())
      const iv = packed.slice(0, 12)
      const ciphertext = packed.slice(12)
      const cryptoKey = await crypto.subtle.importKey('raw', new Uint8Array(aesKey), { name: 'AES-GCM' }, false, ['decrypt'])
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext)
      return JSON.parse(new TextDecoder().decode(plain))
    } catch (e: any) {
      setError(e.message)
      return null
    }
  }, [])

  const gatewayUrl = (cid: string) => `${GATEWAY}/${cid}`

  return { isUploading, uploadProgress, error, uploadJSON, uploadPost, uploadEncryptedPost, retrieve, retrieveEncrypted, gatewayUrl }
}
