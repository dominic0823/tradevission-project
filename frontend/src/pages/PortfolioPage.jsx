import { useState, useEffect } from 'react'
import { useAuthStore, usePriceStore } from '../store'
import { getPortfolio, getOrders } from '../utils/api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { TrendingUp, TrendingDown, Package, Clock, DollarSign, Activity, Wallet, BarChart2 } from 'lucide-react'

const COLORS = ['#00d4ff', '#a855f7', '#00e676', '#ffd700', '#ff3366', '#f59e0b', '#06b6d4', '#8b5cf6']

export default function PortfolioPage() {
  const user = useAuthStore((s) => s.user)
  const prices = usePriceStore((s) => s.prices)
  const [portfolio, setPortfolio] = useState(null)
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loadingOrders, setLoadingOrders] = useState(false)

  const fetchAll = () => {
    if (!user?.user_id) return
    getPortfolio(user.user_id)
      .then((r) => setPortfolio(r.data))
      .catch((e) => console.error('Portfolio fetch failed:', e))
    setLoadingOrders(true)
    getOrders(user.user_id)
      .then((r) => { setOrders(Array.isArray(r.data) ? r.data : []); setLoadingOrders(false) })
      .catch(() => { setOrders([]); setLoadingOrders(false) })
  }

  useEffect(() => { fetchAll() }, [user])
  useEffect(() => {
    if (!user?.user_id) return
    getPortfolio(user.user_id).then((r) => setPortfolio(r.data)).catch(() => { })
  }, [prices, user])

  if (!portfolio) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading portfolio…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const isPositive = portfolio.total_return_pct >= 0
  const totalPnL = portfolio.total_pnl ?? 0

  const pieData = [
    { name: 'Cash', value: Number(portfolio.cash) || 0 },
    ...(portfolio.holdings || []).map((h) => ({ name: h.symbol, value: Number(h.market_value) || 0 })),
  ].filter((d) => d.value > 0)

  const safeNum = (v) => {
    const n = Number(v)
    return isNaN(n) ? 0 : n
  }

  const statCards = [
    { label: 'Total Equity', value: `$${safeNum(portfolio.equity).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Wallet, color: 'var(--accent)' },
    { label: 'Cash Balance', value: `$${safeNum(portfolio.cash).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'var(--gold)' },
    { label: 'Invested Value', value: `$${safeNum(portfolio.total_market_value).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: BarChart2, color: 'var(--purple)' },
    {
      label: 'Total P&L',
      value: `${totalPnL >= 0 ? '+' : ''}$${Math.abs(safeNum(totalPnL)).toFixed(2)}`,
      sub: `${isPositive ? '+' : ''}${safeNum(portfolio.total_return_pct).toFixed(2)}% return`,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'var(--green)' : 'var(--red)',
    },
  ]

  return (
    <div style={{ maxWidth: 1200 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 2, marginBottom: 4 }}>
          MY <span style={{ color: 'var(--accent)' }}>PORTFOLIO</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track your virtual investments and performance</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map((s) => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={14} color={s.color} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['overview', 'positions', 'orders'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            textTransform: 'capitalize', transition: 'all 0.15s',
            background: activeTab === tab ? 'var(--accent)' : 'var(--bg-card)',
            color: activeTab === tab ? '#000' : 'var(--text-secondary)',
            border: activeTab === tab ? '1px solid var(--accent)' : '1px solid var(--border)',
          }}>{tab}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 20 }}>Portfolio Allocation</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`$${safeNum(v).toFixed(2)}`]}
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12 }}>
                  {pieData.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>${safeNum(d.value).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No holdings yet — start trading!
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 20 }}>P&L by Position</h3>
            {portfolio.holdings?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={portfolio.holdings} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="symbol" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                    formatter={(v) => [`$${safeNum(v).toFixed(2)}`, 'P&L']}
                  />
                  <Bar dataKey="pnl" radius={4}>
                    {portfolio.holdings.map((h, i) => <Cell key={i} fill={safeNum(h.pnl) >= 0 ? '#00e676' : '#ff3366'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No positions to display
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'positions' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {!portfolio.holdings?.length ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 15, fontWeight: 600 }}>No open positions</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Go to Trade and buy your first stock!</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    {['Symbol', 'Name', 'Qty', 'Avg Price', 'Current', 'Market Value', 'P&L', 'P&L %', 'SL / TP'].map((h) => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((h) => {
                    const pnl = safeNum(h.pnl)
                    const pnlPct = safeNum(h.pnl_pct)
                    return (
                      <tr key={h.symbol} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '13px 14px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 13 }}>{h.symbol}</td>
                        <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</td>
                        <td style={{ padding: '13px 14px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{h.quantity}</td>
                        <td style={{ padding: '13px 14px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>${safeNum(h.avg_price).toFixed(2)}</td>
                        <td style={{ padding: '13px 14px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>${safeNum(h.current_price).toFixed(2)}</td>
                        <td style={{ padding: '13px 14px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>${safeNum(h.market_value).toFixed(2)}</td>
                        <td style={{ padding: '13px 14px', fontFamily: 'var(--font-mono)', fontSize: 13, color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 700, background: pnlPct >= 0 ? 'var(--green-dim)' : 'var(--red-dim)', color: pnlPct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                          </span>
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {h.stop_loss && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)', whiteSpace: 'nowrap' }}>SL ${safeNum(h.stop_loss).toFixed(2)}</span>}
                            {h.take_profit && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green)', whiteSpace: 'nowrap' }}>TP ${safeNum(h.take_profit).toFixed(2)}</span>}
                            {!h.stop_loss && !h.take_profit && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>—</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {loadingOrders ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading orders…</div>
          ) : !orders?.length ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Clock size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 15, fontWeight: 600 }}>No orders yet</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Your trade history will appear here</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    {['Symbol', 'Side', 'Type', 'Qty', 'Price', 'Total', 'SL', 'TP', 'Status', 'Time'].map((h) => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, idx) => {
                    const orderType = o.order_type ?? o.type ?? 'MARKET'
                    const orderStatus = o.status ?? 'FILLED'
                    const orderTotal = safeNum(o.total)
                    const orderPrice = safeNum(o.price)
                    return (
                      <tr key={o.id ?? idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '11px 14px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 13 }}>{o.symbol}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 700, background: o.side === 'BUY' ? 'var(--green-dim)' : 'var(--red-dim)', color: o.side === 'BUY' ? 'var(--green)' : 'var(--red)' }}>
                            {o.side}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{orderType}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{o.quantity}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>${orderPrice.toFixed(2)}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>${orderTotal.toFixed(2)}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--red)' }}>{o.stop_loss ? `$${safeNum(o.stop_loss).toFixed(2)}` : '—'}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--green)' }}>{o.take_profit ? `$${safeNum(o.take_profit).toFixed(2)}` : '—'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 700, background: 'var(--green-dim)', color: 'var(--green)' }}>
                            {orderStatus}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {o.timestamp ? new Date(o.timestamp).toLocaleString() : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}