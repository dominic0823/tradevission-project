import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, usePriceStore } from '../store'
import { getPortfolio, getStocks, getMarketOverview } from '../utils/api'
import { TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpRight, Wallet } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const prices = usePriceStore((s) => s.prices)
  const [portfolio, setPortfolio] = useState(null)
  const [stocks, setStocks] = useState([])
  const [overview, setOverview] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    getPortfolio(user.user_id).then((r) => setPortfolio(r.data)).catch(() => {})
    getStocks().then((r) => setStocks(r.data)).catch(() => {})
    getMarketOverview().then((r) => setOverview(r.data)).catch(() => {})
  }, [user])

  useEffect(() => {
    if (!user) return
    getPortfolio(user.user_id).then((r) => setPortfolio(r.data)).catch(() => {})
  }, [prices, user])

  const equity = portfolio?.equity ?? 100000
  const returnPct = portfolio?.total_return_pct ?? 0
  const isPositive = returnPct >= 0

  const mockEquityHistory = Array.from({ length: 30 }, (_, i) => ({
    day: i, value: 100000 + Math.sin(i * 0.4) * 3000 + i * 200 + Math.random() * 500,
  }))

  const statCards = [
    { label: 'Total Equity', value: `$${equity.toLocaleString('en', { minimumFractionDigits: 2 })}`, sub: 'Portfolio Value', icon: Wallet, color: 'var(--accent)' },
    { label: 'Total Return', value: `${isPositive ? '+' : ''}${returnPct.toFixed(2)}%`, sub: 'Since Inception', icon: isPositive ? TrendingUp : TrendingDown, color: isPositive ? 'var(--green)' : 'var(--red)' },
    { label: 'Cash Available', value: `$${(portfolio?.cash ?? 100000).toLocaleString('en', { minimumFractionDigits: 2 })}`, sub: 'Ready to Deploy', icon: DollarSign, color: 'var(--gold)' },
    { label: 'Open Positions', value: portfolio?.holdings?.length ?? 0, sub: 'Active Trades', icon: Activity, color: 'var(--purple)' },
  ]

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: 2, marginBottom: 4 }}>
          WELCOME BACK, <span style={{ color: 'var(--accent)' }} className="glow-text">{user?.username?.toUpperCase()}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Your virtual trading dashboard — master the markets risk-free
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map((s) => (
          <div key={s.label} className="card animate-in" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={15} color={s.color} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Portfolio Performance</h3>
            <span className="tag tag-green">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mockEquityHistory}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill="url(#areaGrad)" dot={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(v) => [`$${v.toFixed(0)}`, 'Equity']} labelFormatter={() => ''} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Market Movers
          </h3>
          {overview && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>▲ Top Gainers</div>
              {overview.gainers.map((s) => (
                <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{s.symbol}</span>
                  <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>+{s.change_pct.toFixed(2)}%</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 8px' }}>▼ Top Losers</div>
              {overview.losers.map((s) => (
                <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{s.symbol}</span>
                  <span style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{s.change_pct.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>All Stocks</h3>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => navigate('/trade')}>
            Trade <ArrowUpRight size={13} />
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Symbol', 'Name', 'Price', 'Change', '% Change', 'Sector', ''].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => {
                const live = prices[s.symbol]
                const price = live?.price ?? s.price
                const chg = live?.change ?? s.change
                const chgPct = live?.change_pct ?? s.change_pct
                const pos = chgPct >= 0
                return (
                  <tr key={s.symbol} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)' }}>{s.symbol}</td>
                    <td style={{ padding: '12px', fontSize: 13 }}>{s.name}</td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>${price.toFixed(2)}</td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 13, color: pos ? 'var(--green)' : 'var(--red)' }}>
                      {pos ? '+' : ''}{chg.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`tag ${pos ? 'tag-green' : 'tag-red'}`}>{pos ? '+' : ''}{chgPct.toFixed(2)}%</span>
                    </td>
                    <td style={{ padding: '12px', fontSize: 12, color: 'var(--text-muted)' }}>{s.sector}</td>
                    <td style={{ padding: '12px' }}>
                      <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => navigate('/trade')}>Trade</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}