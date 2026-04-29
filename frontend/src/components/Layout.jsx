import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore, usePriceStore } from '../store'
import { useState, useEffect } from 'react'
import { getStocks } from '../utils/api'
import { LayoutDashboard, TrendingUp, Briefcase, BookOpen, BarChart2, LogOut, Zap } from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/trade', icon: TrendingUp, label: 'Trade' },
  { path: '/market', icon: BarChart2, label: 'Markets' },
  { path: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { path: '/learn', icon: BookOpen, label: 'Learn' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const prices = usePriceStore((s) => s.prices)
  const [tickerStocks, setTickerStocks] = useState([])

  useEffect(() => {
    getStocks().then((r) => setTickerStocks(r.data)).catch(() => { })
  }, [])

  const handleLogout = () => { logout(); navigate('/auth') }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: 200, flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, var(--accent), #0080ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px var(--accent-glow)', flexShrink: 0 }}>
              <Zap size={16} color="#000" fill="#000" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: 2, color: 'var(--accent)' }}>TRADEVISSION</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>PAPER TRADING</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink key={path} to={path} end={path === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '10px 10px', borderRadius: 8, marginBottom: 3,
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              transition: 'all 0.15s',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '9px 10px', background: 'var(--bg-card)', borderRadius: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--purple), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</div>
                <div style={{ fontSize: 10, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                  Paper Trader
                </div>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 12 }} onClick={handleLogout}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <header style={{ height: 44, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, animation: 'ticker 40s linear infinite', whiteSpace: 'nowrap' }}>
            {[...tickerStocks, ...tickerStocks].map((s, i) => {
              const liveData = prices[s.symbol]
              const price = liveData?.price ?? s.price
              const chg = liveData?.change_pct ?? s.change_pct
              return (
                <span key={i} style={{ padding: '0 20px', fontSize: 11, borderRight: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{s.symbol}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>${Number(price ?? 0).toFixed(2)}</span>
                  <span style={{ color: (chg ?? 0) >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 10 }}>
                    {(chg ?? 0) >= 0 ? '+' : ''}{Number(chg ?? 0).toFixed(2)}%
                  </span>
                </span>
              )
            })}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', minWidth: 0, boxSizing: 'border-box' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}