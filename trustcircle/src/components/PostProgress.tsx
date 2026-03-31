import { CheckCircle, Circle, Loader, XCircle, ExternalLink } from 'lucide-react'
import { PostStep } from '../hooks/useCreatePost'
import { clsx } from 'clsx'

interface Step {
  id: PostStep
  label: string
  sublabel: string
  color: string
}

const STEPS: Step[] = [
  {
    id: 'uploading_filecoin',
    label: 'Filecoin',
    sublabel: 'Content stored via Storacha',
    color: '#38bdf8',
  },
  {
    id: 'storing_zama',
    label: 'Zama fhEVM',
    sublabel: 'Key encrypted on Sepolia',
    color: '#8b5cf6',
  },
  {
    id: 'registering_flow',
    label: 'Flow',
    sublabel: 'Metadata on social graph',
    color: '#4fffb0',
  },
]

const STEP_ORDER: PostStep[] = [
  'encrypting',
  'uploading_filecoin',
  'storing_zama',
  'registering_flow',
  'done',
]

function getStepStatus(stepId: PostStep, currentStep: PostStep): 'pending' | 'active' | 'done' | 'error' {
  if (currentStep === 'error') return 'error'
  const stepIdx = STEP_ORDER.indexOf(stepId)
  const currIdx = STEP_ORDER.indexOf(currentStep)
  if (currIdx === -1) return 'pending'
  if (stepIdx < currIdx || currentStep === 'done') return 'done'
  if (stepIdx === currIdx) return 'active'
  return 'pending'
}

interface PostProgressProps {
  step: PostStep
  filecoinCID: string | null
  sepoliaTxHash: string | null
  flowTxId: string | null
  error: string | null
  isEncrypted: boolean
}

export function PostProgress({
  step,
  filecoinCID,
  sepoliaTxHash,
  flowTxId,
  error,
  isEncrypted,
}: PostProgressProps) {
  if (step === 'idle') return null

  const displaySteps = isEncrypted
    ? STEPS
    : STEPS.filter(s => s.id !== 'encrypting')

  return (
    <div
      className="rounded-xl p-4 mt-3 animate-fade-in"
      style={{ background: '#0c0c14', border: '1px solid #1e1e2e' }}
    >
      <div className="flex items-center gap-2 mb-3">
        {step === 'done' ? (
          <CheckCircle size={14} style={{ color: '#4fffb0' }} />
        ) : step === 'error' ? (
          <XCircle size={14} style={{ color: '#ff6b35' }} />
        ) : (
          <Loader size={14} className="animate-spin" style={{ color: '#4fffb0' }} />
        )}
        <span className="font-mono text-xs font-medium" style={{
          color: step === 'done' ? '#4fffb0' : step === 'error' ? '#ff6b35' : '#9898b8'
        }}>
          {step === 'done' ? 'POST PUBLISHED ACROSS 3 CHAINS' :
           step === 'error' ? `ERROR: ${error}` :
           'PUBLISHING...'}
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {displaySteps.map((s, idx) => {
          const status = getStepStatus(s.id, step)
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  {status === 'done' ? (
                    <CheckCircle size={11} style={{ color: s.color }} />
                  ) : status === 'active' ? (
                    <Loader size={11} className="animate-spin" style={{ color: s.color }} />
                  ) : (
                    <Circle size={11} style={{ color: '#2a2a3e' }} />
                  )}
                  <span className="font-mono text-[10px] font-medium"
                    style={{ color: status === 'pending' ? '#404058' : s.color }}>
                    {s.label}
                  </span>
                </div>
                <div
                  className="h-0.5 rounded-full transition-all duration-500"
                  style={{
                    background: status === 'done' ? s.color :
                                status === 'active' ? `${s.color}60` : '#1e1e2e',
                    boxShadow: status === 'done' ? `0 0 6px ${s.color}60` : 'none',
                  }}
                />
              </div>
              {idx < displaySteps.length - 1 && (
                <div className="w-3 h-px flex-shrink-0" style={{ background: '#1e1e2e' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Transaction links - shown when done */}
      {step === 'done' && (
        <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2" style={{ borderColor: '#1e1e2e' }}>
          {filecoinCID && (
            <a
              href={`https://${filecoinCID}.ipfs.w3s.link`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 font-mono text-[10px] hover:opacity-80 transition-opacity"
              style={{ color: '#38bdf8' }}
            >
              <ExternalLink size={9} /> Filecoin CID
            </a>
          )}
          {sepoliaTxHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${sepoliaTxHash}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 font-mono text-[10px] hover:opacity-80 transition-opacity"
              style={{ color: '#8b5cf6' }}
            >
              <ExternalLink size={9} /> Sepolia tx
            </a>
          )}
          {flowTxId && (
            <a
              href={`https://testnet.flowdiver.io/tx/${flowTxId}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 font-mono text-[10px] hover:opacity-80 transition-opacity"
              style={{ color: '#4fffb0' }}
            >
              <ExternalLink size={9} /> Flow tx
            </a>
          )}
        </div>
      )}
    </div>
  )
}
