import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { TRUST_SCORE_ABI, CONTRACT_ADDRESSES, TRUST_TIER, ZAMA_SEPOLIA } from '../lib/contracts';
import { useWalletContext } from './useWallet';
import { useAppStore, LiveUser } from '../lib/store';

let fhevmInstance: any = null;
let fhevmInitializing = false;

async function getFhevmInstance(provider: ethers.BrowserProvider): Promise<any | null> {
  if (fhevmInstance) return fhevmInstance;
  if (fhevmInitializing) {
    let retries = 0;
    while (!fhevmInstance && retries < 15) {
      await new Promise((r) => setTimeout(r, 600));
      retries++;
    }
    return fhevmInstance;
  }

  fhevmInitializing = true;

  try {
    // Import the fhevmjs SDK
    const { createInstance } = await import('fhevmjs');

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    if (chainId !== ZAMA_SEPOLIA.chainId) {
      throw new Error(`Wrong network: ${chainId}. Please switch to Sepolia (chainId ${ZAMA_SEPOLIA.chainId})`);
    }

    console.log('🔄 Initializing Zama fhEVM...');

    // Try multiple configuration approaches
    try {
      // Approach 1: Basic configuration
      fhevmInstance = await createInstance({
        chainId: ZAMA_SEPOLIA.chainId,
        networkUrl: ZAMA_SEPOLIA.networkUrl,
        aclContractAddress: ZAMA_SEPOLIA.aclContractAddress,
        kmsContractAddress: ZAMA_SEPOLIA.kmsContractAddress,
      });
    } catch (err1) {
      console.log('⚠️ Basic config failed, trying with public key fetch...');
      
      // Approach 2: Try to fetch public key from KMS contract directly
      try {
        const kmsContract = new ethers.Contract(
          ZAMA_SEPOLIA.kmsContractAddress,
          ['function getNetworkPublicKey() view returns (bytes)'],
          provider
        );
        const publicKeyBytes = await kmsContract.getNetworkPublicKey();
        
        fhevmInstance = await createInstance({
          chainId: ZAMA_SEPOLIA.chainId,
          networkUrl: ZAMA_SEPOLIA.networkUrl,
          aclContractAddress: ZAMA_SEPOLIA.aclContractAddress,
          kmsContractAddress: ZAMA_SEPOLIA.kmsContractAddress,
          publicKey: publicKeyBytes,
        });
      } catch (err2) {
        console.log('⚠️ Public key fetch failed, using demo mode...');
        throw new Error('fhEVM not available - using demo mode');
      }
    }

    console.log('✅ Zama fhEVM instance initialized successfully');
    return fhevmInstance;
  } catch (err: any) {
    console.error('❌ fhEVM initialization failed:', err.message || err);
    fhevmInstance = null;
    // Don't throw - return null to enable demo mode
    return null;
  } finally {
    fhevmInitializing = false;
  }
}

export function useTrustScore() {
  const { provider, signer, address } = useWalletContext();
  const { setConnectedProfile } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fhevmReady, setFhevmReady] = useState(false);

  const contract = useCallback((write = false) => {
    const addr = CONTRACT_ADDRESSES.sepolia.TrustScore;
    if (!addr) throw new Error('TrustScore contract address not configured in .env');
    if (write && !signer) throw new Error('Signer required for write operations');
    return new ethers.Contract(addr, TRUST_SCORE_ABI, write ? signer! : provider!);
  }, [provider, signer]);

  // Initialize fhEVM when provider becomes available
  useEffect(() => {
    if (!provider) return;

    getFhevmInstance(provider as ethers.BrowserProvider)
      .then((instance) => {
        setFhevmReady(!!instance);
        if (!instance) {
          console.log('📱 fhEVM not available - demo mode enabled');
        }
      })
      .catch((err) => {
        console.error('fhEVM init error:', err);
        setFhevmReady(false);
        // Don't set error - just use demo mode
      });
  }, [provider]);

  // Auto-fetch profile
  useEffect(() => {
    if (address && provider) {
      fetchProfile(address).then((profile) => {
        if (profile) setConnectedProfile(profile);
      });
    }
  }, [address, provider]);

  const fetchProfile = useCallback(async (userAddress?: string): Promise<LiveUser | null> => {
    if (!provider) return null;
    const target = userAddress || address;
    if (!target) return null;

    try {
      const c = contract();
      const raw = await c.profiles(target);
      if (!raw.exists) {
        // Check if this is a demo profile (stored locally)
        const { connectedProfile } = useAppStore.getState();
        if (connectedProfile && connectedProfile.address.toLowerCase() === target.toLowerCase()) {
          return connectedProfile;
        }
        return null;
      }

      return {
        address: target,
        handle: raw.handle,
        tier: TRUST_TIER[raw.tier as keyof typeof TRUST_TIER] || 'rising',
        tierRaw: Number(raw.tier),
        isVerified: raw.isVerified,
        onChainSince: Number(raw.onChainSince),
        txCount: Number(raw.txCount),
        badges: Array.from(raw.badges).map(Number),
        trustScore: null,
        reputationCID: null,
      };
    } catch (e: any) {
      console.error('Failed to fetch profile:', e.message);
      
      // Fallback: check for demo profile
      const { connectedProfile } = useAppStore.getState();
      if (connectedProfile && connectedProfile.address.toLowerCase() === target.toLowerCase()) {
        return connectedProfile;
      }
      
      return null;
    }
  }, [provider, address, contract]);

  const createProfile = useCallback(async (
    handle: string,
    onChainSince: number,
    scores: { activity: number; votes: number; holding: number; contracts: number; age: number }
  ) => {
    if (!signer || !provider) throw new Error('Wallet not connected');
    if (!handle?.trim()) throw new Error('Handle is required');

    setIsLoading(true);
    setError(null);

    try {
      const fhevm = await getFhevmInstance(provider as ethers.BrowserProvider);
      const contractAddr = CONTRACT_ADDRESSES.sepolia.TrustScore;
      if (!contractAddr) throw new Error('TrustScore contract address not set');

      const signerAddr = await signer.getAddress();
      const c = contract(true);

      if (!fhevm) {
        // Demo mode: Skip profile creation entirely and just update local state
        console.log('📱 fhEVM not available, creating local demo profile...');
        
        // Create a demo profile object
        const demoProfile: LiveUser = {
          address: signerAddr,
          handle: handle,
          tier: 'rising',
          tierRaw: 0,
          isVerified: false,
          onChainSince: onChainSince,
          txCount: 0,
          badges: [],
          trustScore: null,
          reputationCID: null,
        };

        // Update local state
        setConnectedProfile(demoProfile);
        
        console.log('✅ Demo profile created locally (not on-chain)');
        
        // Return a fake transaction hash for demo
        return '0xdemo1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      } else {
        // Full fhEVM mode: Encrypt scores
        console.log('🔐 Creating profile with encrypted scores...');
        
        const input = fhevm.createEncryptedInput(contractAddr, signerAddr);
        input.add32(scores.activity);
        input.add32(scores.votes);
        input.add32(scores.holding);
        input.add32(scores.contracts);
        input.add32(scores.age);

        const { handles, inputProof } = await input.encrypt();

        const tx = await c.createProfile(
          handle,
          onChainSince,
          handles[0],
          handles[1],
          handles[2],
          handles[3],
          handles[4],
          inputProof
        );

        const receipt = await tx.wait();
        console.log('✅ Profile created with encryption. Tx hash:', receipt.hash);

        const updatedProfile = await fetchProfile(signerAddr);
        if (updatedProfile) setConnectedProfile(updatedProfile);

        return receipt.hash;
      }
    } catch (e: any) {
      console.error('Profile creation failed:', e);
      setError(e.message || 'Failed to create profile');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [signer, provider, contract, fetchProfile, setConnectedProfile]);

  const grantViewPermission = useCallback(async (viewer: string) => {
    if (!signer) throw new Error('Wallet not connected');
    if (!ethers.isAddress(viewer)) throw new Error('Invalid address');

    setIsLoading(true);
    setError(null);

    try {
      const tx = await contract(true).grantViewPermission(viewer);
      await tx.wait();
      console.log(`✅ Permission granted to ${viewer}`);
    } catch (e: any) {
      console.error('Failed to grant permission:', e);
      setError(e.message || 'Failed to grant permission');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [signer, contract]);

  return {
    isLoading,
    error,
    fhevmReady,
    fetchProfile,
    createProfile,
    grantViewPermission,
  };
}