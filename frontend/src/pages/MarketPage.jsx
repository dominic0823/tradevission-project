import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStocks } from '../utils/api'
import { usePriceStore } from '../store'
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react'

export default function MarketPage() {
  const [stocks, setStocks] = useState([])
  const [sort, setSort] = useState('symbol')
  const [dir, setDir] = useState('asc')
  const [filter, setFilter] = useState('all')
  const prices = usePriceStore((s) => s.prices)
  const navigate = useNavigate()

  useEffect(() => {
    getStocks().then((r) => setStocks(r.data)).catch(() => {})
  }, [])

  const handleSort = (col) => {
    if (sort === col) setDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSort(col); setDir('asc') }
  }

  const enriched = stocks.map((s) => {
    const live = prices[s.symbol]
    return {
      ...s,
      price: live?.price ?? s.price,
      change: live?.change ?? s.change,
      change_pct: live?.change_pct ?? s.change_pct,
    }
  })

  const filtered = enriched.filter((s) => {
    if (filter === 'gainers') return s.change_pct > 0
    if (filter === 'losers') return s.change_pct < 0
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sort], bv = b[sort]
    if (typeof av === 'string') av = av.toLowerCase(), bv = bv.toLowerCase()
    if (dir === 'asc') return av > bv ? 1 : -1
    return av < bv ? 1 : -1
  })

  const SortArrow = ({ col }) => (
    <span style={{ marginLeft: 4, color: sort === col ? 'var(--accent)' : 'var(--text-muted)' }}>
      {sort === col ? (dir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 2, marginBottom: 4 }}>
          MARKET <span style={{ color: 'var(--accent)' }}>OVERVIEW</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Real-time prices updated every 2 seconds</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Stocks', value: stocks.length, icon: BarChart2, color: 'var(--accent)' },
          { label: 'Gainers', value: enriched.filter((s) => s.change_pct > 0).length, icon: TrendingUp, color: 'var(--green)' },
          { label: 'Losers', value: enriched.filter((s) => s.change_pct < 0).length, icon: TrendingDown, color: 'var(--red)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="input" placeholder="Search symbol..." style={{ maxWidth: 200, padding: '8px 12px' }} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {['all', 'gainers', 'losers'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                background: filter === f ? 'var(--accent-dim)' : 'transparent',
                color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
                border: filter === f ? '1px solid var(--accent)' : '1px solid var(--border)',
              }}>{f}</button>
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              {[
                { key: 'symbol', label: 'Symbol' },
                { key: 'name', label: 'Company' },
                { key: 'price', label: 'Price' },
                { key: 'change', label: 'Change' },
                { key: 'change_pct', label: '% Change' },
                { key: 'market_cap', label: 'Market Cap' },
                { key: 'sector', label: 'Sector' },
                { key: null, label: 'Action' },
              ].map((col) => (
                <th key={col.label} onClick={() => col.key && handleSort(col.key)} style={{
                  padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: 1, cursor: col.key ? 'pointer' : 'default',
                  userSelect: 'none',
                }}>
                  {col.label} {col.key && <SortArrow col={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const pos = s.change_pct >= 0
              return (
                <tr key={s.symbol} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 14 }}>{s.symbol}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13 }}>{s.name}</td>
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>${s.price.toFixed(2)}</td>
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, color: pos ? 'var(--green)' : 'var(--red)' }}>
                    {pos ? '+' : ''}{s.change.toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`tag ${pos ? 'tag-green' : 'tag-red'}`}>{pos ? '+' : ''}{s.change_pct.toFixed(2)}%</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>${s.market_cap}B</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{s.sector}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => navigate('/trade')}>Trade</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}