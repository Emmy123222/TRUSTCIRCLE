import { useState } from 'react'
import { Send, Lock, Shield, Loader } from 'lucide-react'
import { useMessages } from '../hooks/useMessages'

export function MessagesPage() {
  const { threads, messages, activeThreadId, isLoading, isSending, error, loadThread, sendMessage } = useMessages()
  const [msgContent, setMsgContent] = useState('')
  const [toAddress, setToAddress] = useState('')

  const activeThread = threads.find(t => t.threadId === activeThreadId)

  const handleSend = async () => {
    const target = activeThread?.participantAddress || toAddress
    if (!msgContent.trim() || !target) return
    await sendMessage(target, msgContent)
    setMsgContent('')
  }

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="font-syne font-bold text-xl text-white">Messages</h1>
        <p className="font-mono text-xs mt-0.5" style={{ color: '#6b6b8a' }}>
          End-to-end encrypted via Zama fhEVM · Sepolia · Content on Filecoin
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Thread list */}
        <div className="w-72 border-r border-border overflow-y-auto flex-shrink-0">
          {isLoading && !activeThreadId && (
            <div className="flex justify-center py-8"><Loader size={16} className="animate-spin" style={{ color: '#4fffb0' }} /></div>
          )}
          {threads.length === 0 && !isLoading && (
            <div className="p-4 text-center">
              <p className="text-sm" style={{ color: '#6b6b8a' }}>No messages yet.</p>
              <p className="font-mono text-xs mt-1" style={{ color: '#404058' }}>Enter an address below to start a conversation.</p>
            </div>
          )}
          {threads.map(thread => (
            <button key={thread.threadId} onClick={() => loadThread(thread.threadId)}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border text-left transition-all"
              style={{ background: activeThreadId === thread.threadId ? '#1e1e2e' : 'transparent' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
                style={{ background: '#1e1e2e', color: '#4fffb0', border: '1px solid rgba(79,255,176,0.2)' }}>
                {thread.participantAddress.slice(2, 4).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-white truncate">{thread.participantHandle}</span>
                  <span className="font-mono text-[10px]" style={{ color: '#404058' }}>
                    {thread.lastMessageTimestamp ? new Date(thread.lastMessageTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Lock size={10} style={{ color: '#8b5cf6' }} />
                  <span className="font-mono text-xs" style={{ color: '#6b6b8a' }}>{thread.messageCount} encrypted messages</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeThread ? (
            <>
              <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold"
                  style={{ background: '#1e1e2e', color: '#4fffb0' }}>
                  {activeThread.participantAddress.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <div className="font-mono text-sm font-medium text-white">{activeThread.participantAddress}</div>
                </div>
                <div className="ml-auto flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full"
                  style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <Shield size={11} />E2E Encrypted
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs"
                    style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <Lock size={10} />Messages encrypted with Zama fhEVM — content on Filecoin
                  </div>
                </div>

                {isLoading && <div className="flex justify-center py-4"><Loader size={16} className="animate-spin" style={{ color: '#4fffb0' }} /></div>}
                {messages.map(msg => (
                  <div key={msg.id} className="flex" style={{ justifyContent: msg.from === activeThread.participantAddress ? 'flex-start' : 'flex-end' }}>
                    <div className="max-w-xs px-4 py-2.5 rounded-2xl text-sm"
                      style={msg.from !== activeThread.participantAddress
                        ? { background: 'rgba(79,255,176,0.15)', border: '1px solid rgba(79,255,176,0.25)', color: '#f0f0f8', borderTopRightRadius: 4 }
                        : { background: '#12121e', border: '1px solid #1e1e2e', color: '#c8c8d8', borderTopLeftRadius: 4 }}>
                      {msg.content ? (
                        <p>{msg.content}</p>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Lock size={10} style={{ color: '#8b5cf6' }} />
                          <span className="font-mono text-xs" style={{ color: '#8b5cf6' }}>Encrypted — decryption pending</span>
                        </div>
                      )}
                      <div className="font-mono text-[10px] mt-1 opacity-50 text-right">
                        {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-3">
              <Lock size={32} style={{ color: '#2a2a3e' }} />
              <p className="font-syne font-semibold text-white">Start a conversation</p>
              <p className="text-sm" style={{ color: '#6b6b8a' }}>Enter a wallet address to send an encrypted message</p>
              <input value={toAddress} onChange={e => setToAddress(e.target.value)} placeholder="0x... recipient address"
                className="w-72 px-3 py-2 rounded-lg text-sm font-mono outline-none text-white"
                style={{ background: '#0c0c14', border: '1px solid #1e1e2e' }} />
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            {error && <p className="font-mono text-xs mb-2" style={{ color: '#ff6b35' }}>{error}</p>}
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#0c0c14', border: '1px solid #1e1e2e' }}>
              <Lock size={15} style={{ color: '#8b5cf6' }} />
              <input value={msgContent} onChange={e => setMsgContent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Encrypted message via Zama fhEVM…"
                className="flex-1 bg-transparent text-sm text-white outline-none font-syne" />
              <button onClick={handleSend} disabled={isSending || !msgContent.trim()}
                className="p-2 rounded-lg transition-all"
                style={msgContent.trim() && !isSending ? { background: '#4fffb0', color: '#050508' } : { background: '#1e1e2e', color: '#404058' }}>
                {isSending ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <p className="font-mono text-[10px] mt-1.5 text-center" style={{ color: '#404058' }}>
              AES-256-GCM encrypted · key stored as euint256 on Sepolia · content on Filecoin
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
