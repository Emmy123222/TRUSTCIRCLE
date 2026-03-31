/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REQUIRE_WALLET: string
  readonly VITE_TRUST_SCORE_CONTRACT: string
  readonly VITE_ENCRYPTED_POSTS_CONTRACT: string
  readonly VITE_ENCRYPTED_DM_CONTRACT: string
  readonly VITE_AGENT_REGISTRY_CONTRACT: string
  readonly VITE_FILECOIN_REGISTRY_CONTRACT: string
  readonly VITE_FLOW_SOCIAL_CONTRACT: string
  readonly VITE_FLOW_CONTRACT_ADDRESS: string
  readonly VITE_DEFAULT_CHAIN_ID: string
  readonly VITE_SEPOLIA_RPC_URL: string
  readonly VITE_FILECOIN_RPC_URL: string
  readonly VITE_FLOW_RPC_URL: string
  readonly VITE_FLOW_NETWORK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Ethereum provider type declaration
interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>
    on: (event: string, callback: (...args: any[]) => void) => void
    removeListener: (event: string, callback: (...args: any[]) => void) => void
    isMetaMask?: boolean
    [key: string]: any
  }
}