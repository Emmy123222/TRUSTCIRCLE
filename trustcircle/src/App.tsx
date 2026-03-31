import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { FeedPage } from './pages/FeedPage'
import { CirclesPage } from './pages/CirclesPage'
import { MessagesPage } from './pages/MessagesPage'
import { AlertsPage } from './pages/AlertsPage'
import { ProfilePage } from './pages/ProfilePage'
import { WalletProvider, useWalletContext } from './hooks/useWallet'
import { ConnectWall } from './components/ConnectWall'

function AppRoutes() {
  const { isConnected } = useWalletContext()

  // Show connect wall if no wallet — or go straight to app in demo mode
  // For hackathon demo, skip wallet gate by default (set VITE_REQUIRE_WALLET=true to enable)
  const requireWallet = import.meta.env.VITE_REQUIRE_WALLET === 'true'
  if (requireWallet && !isConnected) {
    return <ConnectWall />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/circles" element={<CirclesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <WalletProvider>
      <AppRoutes />
    </WalletProvider>
  )
}
