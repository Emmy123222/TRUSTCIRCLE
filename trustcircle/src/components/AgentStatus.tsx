import { useState } from 'react'
import { useAgent } from '../hooks/useAgent'

export function AgentStatus() {
  const { status, loading, error, isOnline, fetchRecentActivity, getDigest } = useAgent()
  const [recentActivity, setRecentActivity] = useState<any>(null)
  const [digest, setDigest] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleShowActivity = async () => {
    const activity = await fetchRecentActivity(5)
    setRecentActivity(activity)
    setShowDetails(true)
  }

  const handleGetDigest = async () => {
    const digestData = await getDigest()
    setDigest(digestData)
  }

  if (loading && !status) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
          <div className="h-4 bg-gray-600 rounded w-32"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-red-400 text-sm">Agent Offline</span>
        </div>
        <p className="text-red-300 text-xs mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-white font-medium">AI Agent</span>
          {isOnline && <span className="text-green-400 text-xs">Online</span>}
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white text-xs"
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>

      {/* Stats */}
      {status && (
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{status.stats.postsAnalyzed}</div>
            <div className="text-xs text-gray-400">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{status.stats.alertsGenerated}</div>
            <div className="text-xs text-gray-400">Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{status.stats.walletsAnalyzed}</div>
            <div className="text-xs text-gray-400">Wallets</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2 mb-3">
        <button
          onClick={handleShowActivity}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded"
        >
          Recent Activity
        </button>
        <button
          onClick={handleGetDigest}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded"
        >
          Daily Digest
        </button>
      </div>

      {/* Details Panel */}
      {showDetails && status && (
        <div className="border-t border-gray-700 pt-3 space-y-2">
          <div className="text-xs">
            <span className="text-gray-400">Agent Address:</span>
            <div className="text-white font-mono text-xs break-all">
              {status.agent_address}
            </div>
          </div>
          {status.last_activity && (
            <div className="text-xs">
              <span className="text-gray-400">Last Activity:</span>
              <div className="text-white">
                {new Date(status.last_activity).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity Modal */}
      {recentActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Recent Activity</h3>
              <button
                onClick={() => setRecentActivity(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {recentActivity.recent_tasks.map((task: any, index: number) => (
                <div key={index} className="border border-gray-700 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{task.type}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {task.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{task.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(task.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Digest Modal */}
      {digest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Daily Digest</h3>
              <button
                onClick={() => setDigest(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="text-gray-300 text-sm whitespace-pre-wrap">
              {digest.digest || 'No digest available'}
            </div>
            <div className="text-xs text-gray-500 mt-4">
              Generated: {new Date(digest.generated_at).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}