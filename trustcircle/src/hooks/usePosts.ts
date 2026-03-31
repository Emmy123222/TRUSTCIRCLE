import { useCallback, useState } from 'react'
import { ethers } from 'ethers'
import { createInstance } from 'fhevmjs'
import { ENCRYPTED_POSTS_ABI, CONTRACT_ADDRESSES, ZAMA_SEPOLIA } from '../lib/contracts'
import { useWalletContext } from './useWallet'

export function usePosts() {
  const { provider, signer, address } = useWalletContext()
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const contract = useCallback((write = false) => {
    const addr = CONTRACT_ADDRESSES.sepolia.EncryptedPosts
    if (!addr) throw new Error('EncryptedPosts address not set in .env')
    return new ethers.Contract(addr, ENCRYPTED_POSTS_ABI, write ? signer! : provider!)
  }, [provider, signer])

  /** Create a public post — content CID from Filecoin */
  const createPublicPost = useCallback(async (
    circleId: string,
    filecoinCID: string,
    minTrust: number
  ): Promise<{ postId: number; txHash: string }> => {
    if (!signer) throw new Error('Wallet not connected')
    
    // Check if this is a demo CID (starts with bafybeig and stored locally)
    if (filecoinCID.startsWith('bafybeig') && localStorage.getItem(`demo_post_${filecoinCID}`)) {
      console.log('📱 Demo mode: Creating local post record...');
      
      // Generate a fake transaction hash for demo
      const demoTxHash = '0xdemo' + Math.random().toString(16).substring(2, 50).padEnd(48, '0');
      const demoPostId = Math.floor(Math.random() * 1000000);
      
      // Store demo post in localStorage
      const demoPost = {
        id: demoPostId,
        circleId,
        filecoinCID,
        minTrust,
        txHash: demoTxHash,
        timestamp: Date.now(),
        author: await signer.getAddress()
      };
      
      localStorage.setItem(`demo_blockchain_post_${demoPostId}`, JSON.stringify(demoPost));
      
      console.log('✅ Demo post created locally with ID:', demoPostId);
      return { postId: demoPostId, txHash: demoTxHash };
    }

    setIsPosting(true)
    setError(null)
    try {
      const c = contract(true)
      const circleBytes = ethers.keccak256(ethers.toUtf8Bytes(circleId))
      const tx = await c.createPublicPost(circleBytes, filecoinCID, minTrust)
      const receipt = await tx.wait()
      const event = receipt.logs
        .map((l: any) => { try { return c.interface.parseLog(l) } catch { return null } })
        .find((e: any) => e?.name === 'PostCreated')
      return { postId: event ? Number(event.args.postId) : 0, txHash: receipt.hash }
    } catch (e: any) {
      setError(e.message)
      throw e
    } finally {
      setIsPosting(false)
    }
  }, [signer, contract])

  /**
   * Create an encrypted post.
   * @param aesKey  Raw AES-256 key bytes from useFilecoin.uploadEncryptedPost
   * Encrypts the key with fhevmjs before sending to EncryptedPosts.sol
   */
  const createEncryptedPost = useCallback(async (
    circleId: string,
    filecoinCID: string,
    minTrust: number,
    aesKey: Uint8Array
  ): Promise<{ postId: number; txHash: string }> => {
    if (!signer || !provider) throw new Error('Wallet not connected')
    
    // Check if this is a demo CID
    if (filecoinCID.startsWith('bafybeig') && localStorage.getItem(`demo_encrypted_${filecoinCID}`)) {
      console.log('📱 Demo mode: Creating local encrypted post record...');
      
      // Generate a fake transaction hash for demo
      const demoTxHash = '0xdemo' + Math.random().toString(16).substring(2, 50).padEnd(48, '0');
      const demoPostId = Math.floor(Math.random() * 1000000);
      
      // Store demo encrypted post in localStorage
      const demoPost = {
        id: demoPostId,
        circleId,
        filecoinCID,
        minTrust,
        txHash: demoTxHash,
        timestamp: Date.now(),
        author: await signer.getAddress(),
        isEncrypted: true,
        aesKeyHash: Array.from(aesKey).slice(0, 8).join('') // Store partial key for demo
      };
      
      localStorage.setItem(`demo_blockchain_encrypted_post_${demoPostId}`, JSON.stringify(demoPost));
      
      console.log('✅ Demo encrypted post created locally with ID:', demoPostId);
      return { postId: demoPostId, txHash: demoTxHash };
    }

    setIsPosting(true)
    setError(null)
    try {
      const network = await provider.getNetwork()
      // Correct fhEVM configuration: Use only valid parameters
      const fhevm = await createInstance({
        chainId: Number(network.chainId),
        networkUrl: ZAMA_SEPOLIA.networkUrl,
        aclContractAddress: ZAMA_SEPOLIA.aclContractAddress,
        kmsContractAddress: ZAMA_SEPOLIA.kmsContractAddress,
      })
      const contractAddr = CONTRACT_ADDRESSES.sepolia.EncryptedPosts
      const signerAddr = await signer.getAddress()

      // Encrypt AES key as euint256 via fhevmjs
      const keyBigInt = BigInt('0x' + Buffer.from(aesKey).toString('hex'))
      const input = fhevm.createEncryptedInput(contractAddr, signerAddr)
      input.add256(keyBigInt)
      const { handles, inputProof } = await input.encrypt()

      const c = contract(true)
      const circleBytes = ethers.keccak256(ethers.toUtf8Bytes(circleId))
      const tx = await c.createEncryptedPost(circleBytes, filecoinCID, minTrust, handles[0], inputProof)
      const receipt = await tx.wait()
      const event = receipt.logs
        .map((l: any) => { try { return c.interface.parseLog(l) } catch { return null } })
        .find((e: any) => e?.name === 'PostCreated')
      return { postId: event ? Number(event.args.postId) : 0, txHash: receipt.hash }
    } catch (e: any) {
      setError(e.message)
      throw e
    } finally {
      setIsPosting(false)
    }
  }, [signer, provider, contract])

  /** Request access to an encrypted post — triggers Zama threshold check */
  const requestAccess = useCallback(async (postId: number): Promise<string> => {
    if (!signer) throw new Error('Wallet not connected')
    const tx = await contract(true).requestPostAccess(postId)
    return (await tx.wait()).hash
  }, [signer, contract])

  /** Like or unlike a post on-chain */
  const toggleLike = useCallback(async (postId: number, currentlyLiked: boolean): Promise<string> => {
    if (!signer) throw new Error('Wallet not connected')
    const c = contract(true)
    const tx = currentlyLiked ? await c.unlikePost(postId) : await c.likePost(postId)
    return (await tx.wait()).hash
  }, [signer, contract])

  return { isPosting, error, createPublicPost, createEncryptedPost, requestAccess, toggleLike }
}
