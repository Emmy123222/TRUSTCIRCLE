import { useState } from 'react'
import { Bot, AlertTriangle, TrendingUp, BookOpen, Star, Shield, Zap, ChevronRight, Eye, X, Loader, RefreshCw, ExternalLink } from 'lucide-react'
import { useAgent } from '../hooks/useAgent'
import { LiveAlert } from '../lib/store'
import { clsx } from 'clsx'

const ALERT_CFG = {
  suspicious: { icon: AlertTriangle, color: '#ff6b35', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.25)', label: 'THREAT DETECTED' },
  sentiment:  { icon: TrendingUp,  color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',   border: 'rgba(56,189,248,0.25)',   label: 'SENTIMENT SHIFT' },
  digest:     { icon: BookOpen,    color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)',   border: 'rgba(139,92,246,0.25)',   label: 'DAILY DIGEST'   },
  trust_update:{ icon: Star,       color: '#4fffb0', bg: 'rgba(79,255,176,0.08)',   border: 'rgba(79,255,176,0.25)',   label: 'TRUST UPDATE'   },
}
const SEVERITY_COLOR = { high: '#ff6b35', medium: '#f59e0b', low: '#4fffb0' }

function AlertCard({ alert, onRead, onDismiss, delay }: {
  alert: LiveAlert; onRead: () => void; onDismiss: () => void; delay: number
}) {
  const cfg = ALERT_CFG[alert.type]
  const Icon = cfg.icon
  const ts = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={clsx('rounded-xl p-5 opacity-0 animate-fade-in-up transition-all', !alert.read && 'ring-1 ring-trust/20')}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards', background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
          <Icon size={16} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-[10px] tracking-widest font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEVERITY_COLOR[alert.severity] }} />
            <span className="font-mono text-[10px]" style={{ color: '#404058' }}>{alert.severity.toUpperCase()}</span>
            {!alert.read && <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(79,255,176,0.15)', color: '#4fffb0' }}>NEW</span>}
            <span className="ml-auto font-mono text-[10px]" style={{ color: '#404058' }}>{ts}</span>
          </div>
          <h3 className="font-semibold text-white text-sm mb-1">{alert.title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: '#9898b8' }}>{alert.body}</p>
          <div className="flex items-center gap-3 mt-2">
            {alert.txHash && (
              <a href={`https://sepolia.etherscan.io/tx/${alert.txHash}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 font-mono text-[10px] hover:opacity-80" style={{ color: '#38bdf8' }}>
                <ExternalLink size={9} /> Sepolia tx
              </a>
            )}
            {alert.filecoinCID && (
              <a href={`https://w3s.link/ipfs/${alert.filecoinCID}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 font-mono text-[10px] hover:opacity-80" style={{ color: '#8b5cf6' }}>
                <ExternalLink size={9} /> Filecoin log
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          {!alert.read && (
            <button onClick={onRead} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: '#6b6b8a' }}>
              <Eye size={13} />
            </button>
          )}
          <button onClick={onDismiss} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: '#6b6b8a' }}>
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AlertsPage() {
  const { agentStats, alerts, isLoading, error, loadAgent, markAlertRead } = useAgent()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = alerts.filter(a => !dismissed.has(a.id))
  const unread = visible.filter(a => !a.read).length

  const statCards = agentStats ? [
    { label: 'Reputation', value: agentStats.reputationScore > 0 ? `+${agentStats.reputationScore}` : String(agentStats.reputationScore), color: agentStats.reputationScore >= 0 ? '#4fffb0' : '#ff6b35', icon: Star },
    { label: 'Tasks Done', value: String(agentStats.tasksCompleted), color: '#4fffb0', icon: Zap },
    { label: 'Tasks Failed', value: String(agentStats.tasksFailed), color: agentStats.tasksFailed > 0 ? '#ff6b35' : '#4fffb0', icon: AlertTriangle },
    { label: 'Status', value: agentStats.status, color: agentStats.status === 'Active' ? '#4fffb0' : '#ff6b35', icon: Bot },
  ] : []

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-border" style={{ background: 'rgba(5,5,8,0.85)' }}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-syne font-bold text-xl text-white flex items-center gap-2">
              <Bot size={20} style={{ color: '#4fffb0' }} />AI Agent
            </h1>
            <p className="font-mono text-xs mt-0.5" style={{ color: '#6b6b8a' }}>
              Claude · ERC-8004 · Filecoin logs
            </p>
          </div>
          <button onClick={loadAgent} disabled={isLoading}
            className="p-2 rounded-lg hover:bg-muted transition-colors" style={{ color: '#6b6b8a' }}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {isLoading && !agentStats && (
          <div className="flex justify-center py-16"><Loader size={20} className="animate-spin" style={{ color: '#4fffb0' }} /></div>
        )}

        {error && (
          <div className="p-4 rounded-xl font-mono text-sm" style={{ color: '#ff6b35', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>{error}</div>
        )}

        {/* Agent identity card */}
        {agentStats && (
          <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: 'rgba(79,255,176,0.04)', border: '1px solid rgba(79,255,176,0.15)' }}>
            <div className="absolute left-0 right-0 h-px opacity-30 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, #4fffb0, transparent)', animation: 'scan 4s linear infinite' }} />
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(79,255,176,0.1)', border: '1px solid rgba(79,255,176,0.3)' }}>
                <Bot size={22} style={{ color: '#4fffb0' }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-syne font-bold text-white">TrustAgent v1.0</span>
                  {agentStats.isRegistered && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ color: '#4fffb0', background: 'rgba(79,255,176,0.1)', border: '1px solid rgba(79,255,176,0.2)' }}>ERC-8004 ✓</span>
                  )}
                </div>
                <p className="text-sm mb-3" style={{ color: '#9898b8' }}>Monitors circles for suspicious actors, sentiment shifts, and high-signal posts. Logs stored on Filecoin.</p>
                <div className="grid grid-cols-2 gap-2">
                  {agentStats.agentId && (
                    <div className="font-mono text-xs" style={{ color: '#6b6b8a' }}>
                      <span style={{ color: '#404058' }}>ID: </span>
                      <span style={{ color: '#4fffb0' }}>{agentStats.agentId.slice(0, 10)}…</span>
                    </div>
                  )}
                  {agentStats.logsCID && (
                    <a href={`https://w3s.link/ipfs/${agentStats.logsCID}`} target="_blank" rel="noreferrer"
                      className="font-mono text-xs flex items-center gap-1 hover:opacity-80" style={{ color: '#8b5cf6' }}>
                      <ExternalLink size={9} />Filecoin log
                    </a>
                  )}
                  {agentStats.manifestCID && (
                    <a href={`https://w3s.link/ipfs/${agentStats.manifestCID}`} target="_blank" rel="noreferrer"
                      className="font-mono text-xs flex items-center gap-1 hover:opacity-80" style={{ color: '#38bdf8' }}>
                      <ExternalLink size={9} />Manifest
                    </a>
                  )}
                  {agentStats.lastActive > 0 && (
                    <div className="font-mono text-xs" style={{ color: '#6b6b8a' }}>
                      <span style={{ color: '#404058' }}>Last active: </span>
                      <span>{new Date(agentStats.lastActive * 1000).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!agentStats?.isRegistered && !isLoading && (
          <div className="rounded-xl p-5 text-center" style={{ border: '1px dashed #1e1e2e' }}>
            <Bot size={28} className="mx-auto mb-3" style={{ color: '#2a2a3e' }} />
            <p className="font-syne font-semibold text-white mb-1">No agent registered</p>
            <p className="text-sm" style={{ color: '#6b6b8a' }}>Run <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: '#1e1e2e', color: '#4fffb0' }}>npm run agent:start</code> to register your ERC-8004 agent.</p>
          </div>
        )}

        {/* Stats */}
        {statCards.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {statCards.map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="card-panel rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="font-syne font-bold text-2xl" style={{ color }}>{value}</div>
                <div className="font-mono text-xs mt-0.5" style={{ color: '#6b6b8a' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Alerts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-syne font-semibold text-white">Alerts</h2>
            <span className="font-mono text-xs" style={{ color: '#6b6b8a' }}>{unread} unread</span>
          </div>
          {visible.length === 0 && !isLoading && (
            <div className="text-center py-10">
              <p className="text-sm" style={{ color: '#6b6b8a' }}>No alerts yet. Start the agent to begin monitoring.</p>
            </div>
          )}
          <div className="space-y-3">
            {visible.map((alert, i) => (
              <AlertCard key={alert.id} alert={alert} delay={i * 60}
                onRead={() => markAlertRead(alert.id)}
                onDismiss={() => setDismissed(prev => new Set([...prev, alert.id]))} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
