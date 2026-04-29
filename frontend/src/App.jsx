import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import { useWebSocket } from './hooks/useWebSocket'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import TradingPage from './pages/TradingPage'
import PortfolioPage from './pages/PortfolioPage'
import LearnPage from './pages/LearnPage'
import MarketPage from './pages/MarketPage'
 
function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  return user ? children : <Navigate to="/auth" replace />
}
 
function AppInner() {
  useWebSocket()
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="trade" element={<TradingPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="learn" element={<LearnPage />} />
        <Route path="market" element={<MarketPage />} />
      </Route>
    </Routes>
  )
}
 
export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}