import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { login, register } from '../utils/api'
import { Zap, TrendingUp, BarChart2, Shield, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react'

const TICKER_ITEMS = [
  { sym: 'AAPL', price: '178.50', chg: '+1.2%', up: true },
  { sym: 'TSLA', price: '248.90', chg: '-0.8%', up: false },
  { sym: 'NVDA', price: '875.40', chg: '+3.1%', up: true },
  { sym: 'MSFT', price: '415.20', chg: '+0.5%', up: true },
  { sym: 'GOOGL', price: '141.80', chg: '-0.3%', up: false },
  { sym: 'META', price: '521.30', chg: '+2.2%', up: true },
]

function WelcomeOverlay({ username, onDone }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 400)
    const t2 = setTimeout(() => setStep(2), 1200)
    const t3 = setTimeout(() => setStep(3), 2200)
    const t4 = setTimeout(() => onDone(), 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 0,
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: Math.random() * 3 + 1, height: Math.random() * 3 + 1,
            borderRadius: '50%', background: 'var(--accent)',
            opacity: Math.random() * 0.4 + 0.1,
            animation: `pulse-glow ${Math.random() * 3 + 2}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      <div style={{
        transform: step >= 1 ? 'scale(1)' : 'scale(0.5)',
        opacity: step >= 1 ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        marginBottom: 28,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 22,
          background: 'linear-gradient(135deg, var(--accent), #0080ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 60px var(--accent-glow), 0 0 120px rgba(0,212,255,0.2)',
        }}>
          <Zap size={40} color="#000" fill="#000" />
        </div>
      </div>

      <div style={{
        opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease', textAlign: 'center', marginBottom: 12,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 4, color: 'var(--text-muted)', marginBottom: 8 }}>
          WELCOME TO TRADEVISSION
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, letterSpacing: 2, lineHeight: 1.1 }}>
          HEY, <span style={{ color: 'var(--accent)' }} className="glow-text">{username?.toUpperCase()}!</span>
        </div>
      </div>

      <div style={{
        opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.5s ease', textAlign: 'center',
      }}>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Your $100,000 virtual portfolio is ready 🚀
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {['Dashboard', 'Trade', 'Learn', 'Portfolio'].map((item, i) => (
            <span key={item} style={{
              padding: '6px 14px', borderRadius: 20,
              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
              color: 'var(--accent)', fontSize: 12, fontWeight: 700,
              opacity: 0, animation: `fadeInUp 0.4s ease ${i * 0.1 + 0.1}s forwards`,
            }}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [welcome, setWelcome] = useState(null)
  const { setUser, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.user_id) navigate('/')
  }, [user, navigate])

  const handleSubmit = async () => {
    setError('')
    if (mode === 'register' && !form.username.trim()) { setError('Username is required'); return }
    if (!form.email.trim()) { setError('Email is required'); return }
    if (!form.password.trim()) { setError('Password is required'); return }
    setLoading(true)
    try {
      if (mode === 'register') {
        const r = await register(form)
        const userData = { user_id: r.data.user_id, username: r.data.username }
        setUser(userData)
        setWelcome(r.data.username)
      } else {
        const r = await login({ email: form.email, password: form.password })
        setUser(r.data)
        navigate('/')
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: TrendingUp, text: '$100,000 Virtual Capital', sub: 'Start trading with zero risk' },
    { icon: BarChart2, text: '9 Live Indicators', sub: 'RSI, MACD, Fibonacci + more' },
    { icon: Shield, text: 'SL / TP Automation', sub: 'Auto-close trades on target' },
    { icon: Zap, text: 'Real-Time Price Feeds', sub: 'WebSocket live updates' },
  ]

  if (welcome) {
    return <WelcomeOverlay username={welcome} onDone={() => navigate('/')} />
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <div style={{ height: 44, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', animation: 'ticker 30s linear infinite', whiteSpace: 'nowrap' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} style={{ padding: '0 28px', fontSize: 12, borderRight: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{t.sym}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>${t.price}</span>
              <span style={{ color: t.up ? 'var(--green)' : 'var(--red)', fontSize: 11 }}>{t.chg}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{
          background: 'linear-gradient(160deg, #050810 0%, #080d1c 60%, #060b18 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'clamp(32px, 5vw, 72px)',
          borderRight: '1px solid var(--border)', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -120, right: -120, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '40%', right: '10%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,230,118,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 44 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), #0080ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px var(--accent-glow)' }}>
              <Zap size={26} color="#000" fill="#000" />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: 4, color: 'var(--accent)' }}>TRADEVISSION</div>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,4vw,60px)', lineHeight: 1.05, letterSpacing: 2, marginBottom: 16 }}>
            MASTER THE<br /><span style={{ color: 'var(--accent)' }} className="glow-text">MARKETS</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.75, marginBottom: 40, maxWidth: 380 }}>
            Learn professional trading with real indicators, virtual money, and zero risk. Built for learners who want to trade like pros.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {features.map(({ icon: Icon, text, sub }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--accent-dim)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{text}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 44, padding: '16px 20px', background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <CheckCircle size={16} color="var(--green)" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your account & trades are <strong style={{ color: 'var(--green)' }}>saved automatically</strong> — no data loss on restart</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 4vw, 60px)' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 2, marginBottom: 6 }}>
                {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                  {mode === 'login' ? 'Sign up free →' : 'Sign in →'}
                </button>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {mode === 'register' && (
                <div>
                  <label style={labelStyle}>Username</label>
                  <input className="input" placeholder="e.g. trader_pro" value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    style={{ fontSize: 14 }} />
                </div>
              )}

              <div>
                <label style={labelStyle}>Email Address</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{ fontSize: 14 }} />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    style={{ fontSize: 14, paddingRight: 42 }} />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ padding: '11px 14px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 9, fontSize: 13, color: 'var(--red)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>⚠</span> {error}
                </div>
              )}

              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Loading...
                  </span>
                ) : (
                  <>
                    {mode === 'login' ? 'Enter TradeVission' : 'Start Trading Free'}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              {mode === 'register' && (
                <div style={{ textAlign: 'center', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>💰</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>$100,000 Virtual Cash</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Credited instantly on signup · No real money involved</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const labelStyle = { fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }