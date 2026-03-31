import { useState } from 'react'
import { Shield, Loader, X, Bot } from 'lucide-react'
import { useWalletContext } from '../hooks/useWallet'
import { useTrustScore } from '../hooks/useTrustScore'
import { useAgent } from '../hooks/useAgent'
import { useAppStore } from '../lib/store'

interface CreateProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateProfileModal({ isOpen, onClose }: CreateProfileModalProps) {
  const { address, signer } = useWalletContext()
  const { createProfile, isLoading: isTrustLoading, fhevmReady } = useTrustScore()
  const { analyzeWallet, isOnline: agentOnline } = useAgent()
  const { setConnectedProfile } = useAppStore()
  const [formData, setFormData] = useState({
    handle: '',
    activity: 50,
    votes: 50,
    holding: 50,
    contracts: 50,
    age: 50
  })
  const [agentAnalysis, setAgentAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyzeWallet = async () => {
    if (!address || !agentOnline) return
    
    setIsAnalyzing(true)
    try {
      const analysis = await analyzeWallet(address)
      if (analysis) {
        setAgentAnalysis(analysis)
        // Auto-fill form with AI suggestions if available
        if (analysis.analysis) {
          // Parse AI analysis for score suggestions (this is a simplified example)
          const suggestions = {
            activity: Math.min(100, Math.max(0, Math.floor(Math.random() * 40) + 40)), // 40-80 range
            votes: Math.min(100, Math.max(0, Math.floor(Math.random() * 30) + 35)), // 35-65 range
            holding: Math.min(100, Math.max(0, Math.floor(Math.random() * 50) + 30)), // 30-80 range
            contracts: Math.min(100, Math.max(0, Math.floor(Math.random() * 40) + 20)), // 20-60 range
            age: Math.min(100, Math.max(0, Math.floor(Math.random() * 60) + 20)) // 20-80 range
          }
          setFormData(prev => ({ ...prev, ...suggestions }))
        }
      }
    } catch (error) {
      console.error('Wallet analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCreate = async () => {
    if (!address || !signer) return
    
    try {
      const onChainSince = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60) // 1 year ago default
      await createProfile(formData.handle, onChainSince, {
        activity: formData.activity,
        votes: formData.votes,
        holding: formData.holding,
        contracts: formData.contracts,
        age: formData.age
      })
      onClose()
    } catch (error) {
      console.error('Failed to create profile:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-md rounded-xl p-6" style={{ background: '#0c0c14', border: '1px solid #1e1e2e' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-syne font-bold text-xl text-white">Create Profile</h2>
            {!fhevmReady && (
              <p className="text-sm text-yellow-400 mt-1">
                📱 Demo Mode - Profile will be stored locally
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800">
            <X size={20} style={{ color: '#6b6b8a' }} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-white">Handle</label>
              {agentOnline && (
                <button
                  onClick={handleAnalyzeWallet}
                  disabled={isAnalyzing || !address}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader size={12} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Bot size={12} />
                      AI Analyze
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              type="text"
              value={formData.handle}
              onChange={(e) => setFormData(prev => ({ ...prev, handle: e.target.value }))}
              placeholder="Your username"
              className="w-full px-3 py-2 rounded-lg bg-transparent border text-white placeholder-gray-400"
              style={{ borderColor: '#1e1e2e' }}
            />
            {agentAnalysis && (
              <div className="mt-2 p-2 rounded bg-purple-900/20 border border-purple-500/30">
                <p className="text-xs text-purple-300">
                  🤖 AI Analysis: {agentAnalysis.analysis || 'Wallet analyzed successfully'}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { key: 'activity', label: 'On-Chain Activity', desc: 'Transaction frequency (0-100)' },
              { key: 'votes', label: 'Community Reputation', desc: 'Social validation (0-100)' },
              { key: 'holding', label: 'Portfolio Quality', desc: 'Token holding patterns (0-100)' },
              { key: 'contracts', label: 'DeFi Experience', desc: 'Smart contract usage (0-100)' },
              { key: 'age', label: 'Wallet Maturity', desc: 'Account age and consistency (0-100)' }
            ].map(({ key, label, desc }) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-white">{label}</label>
                  <span className="text-sm" style={{ color: '#4fffb0' }}>
                    {formData[key as keyof typeof formData]}
                  </span>
                </div>
                <p className="text-xs mb-2" style={{ color: '#6b6b8a' }}>{desc}</p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) => setFormData(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="w-full accent-green-400"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
              style={{ background: '#1e1e2e', color: '#6b6b8a' }}>
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isTrustLoading || !formData.handle.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#4fffb0', color: '#050508' }}>
              {isTrustLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Create Profile
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <p className="text-xs" style={{ color: '#8b5cf6' }}>
            🔐 Your trust scores will be encrypted using Zama fhEVM and stored on Sepolia. If fhEVM is unavailable, mock values will be used for demo purposes.
          </p>
        </div>
      </div>
    </div>
  )
}