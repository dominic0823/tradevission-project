import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore, usePriceStore } from '../store'
import { getStocks, getChart, getPortfolio, placeOrder, getOrders, cancelActiveOrder } from '../utils/api'
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, ShieldAlert, Target, X, RefreshCw } from 'lucide-react'

const OVERLAYS = [
  { key: 'sma20', label: 'SMA 20', color: '#f59e0b' },
  { key: 'sma50', label: 'SMA 50', color: '#ef4444' },
  { key: 'ema12', label: 'EMA 12', color: '#8b5cf6' },
  { key: 'ema26', label: 'EMA 26', color: '#a78bfa' },
  { key: 'vwap', label: 'VWAP', color: '#ff9500' },
  { key: 'bollinger', label: 'Bollinger', color: '#06b6d4' },
  { key: 'fibonacci', label: 'Fib', color: '#ffd700' },
]

const TIMEFRAMES = [
  { key: '1H', label: '1H', desc: '5-min bars, 1 day' },
  { key: '4H', label: '4H', desc: '30-min bars, 5 days' },
  { key: '1D', label: '1D', desc: '1-hour bars, 10 days' },
  { key: '1W', label: '1W', desc: '4-hour bars, 30 days' },
  { key: '1M', label: '1M', desc: '8-hour bars, 60 days' },
  { key: '3M', label: '3M', desc: '16-hour bars, 90 days' },
]

const CHART_TYPES = [
  { key: 'candle', label: 'Candle' },
  { key: 'bar', label: 'Bar' },
  { key: 'line', label: 'Line' },
  { key: 'area', label: 'Area' },
]

const SUBS = ['RSI', 'MACD', 'Volume', 'Stoch', 'ATR']

const FIB_C = {
  '0': 'rgba(255,255,255,0.2)', '0.236': 'rgba(255,215,0,0.45)',
  '0.382': 'rgba(255,165,0,0.55)', '0.5': 'rgba(255,100,100,0.55)',
  '0.618': '#ffd700', '0.786': 'rgba(100,200,255,0.55)', '1': 'rgba(255,255,255,0.2)',
}

const N = (v, fb = 0) => { const n = Number(v); return isNaN(n) ? fb : n }
const LB = { fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }

export default function TradingPage() {
  const user = useAuthStore((s) => s.user)
  const prices = usePriceStore((s) => s.prices)

  const [stocks, setStocks] = useState([])
  const [symbol, setSymbol] = useState('AAPL')
  const [period, setPeriod] = useState('1D')
  const [chartType, setChartType] = useState('candle')
  const [chartData, setChartData] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [tradeHistory, setTradeHistory] = useState([])
  const [activeInd, setActiveInd] = useState(['sma20'])
  const [subChart, setSubChart] = useState('RSI')
  const [side, setSide] = useState('BUY')
  const [qty, setQty] = useState(1)
  const [orderType, setOrderType] = useState('MARKET')
  const [limitPrice, setLimitPrice] = useState('')
  const [sl, setSl] = useState('')
  const [tp, setTp] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [ordering, setOrdering] = useState(false)

  const mainRef = useRef(null)
  const mainInst = useRef(null)
  const mainSeries = useRef(null)   
  const subRef = useRef(null)
  const subInst = useRef(null)
  const barMinutes = useRef(5)       
  const currentBuf = useRef(null)   

  const toast$ = useCallback((type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 5000)
  }, [])

  const loadPort = useCallback(() => {
    if (!user?.user_id) return
    getPortfolio(user.user_id).then((r) => setPortfolio(r.data)).catch(() => { })
  }, [user])

  const loadOrders = useCallback(() => {
    if (!user?.user_id) return
    getOrders(user.user_id).then((r) => setTradeHistory(Array.isArray(r.data) ? r.data : [])).catch(() => { })
  }, [user])

  useEffect(() => {
    getStocks().then((r) => setStocks(r.data)).catch(() => { })
    loadPort(); loadOrders()
  }, [loadPort, loadOrders])

  useEffect(() => { loadPort() }, [prices, loadPort])

  useEffect(() => {
    setLoading(true); setChartData(null)
    getChart(symbol, period)
      .then((r) => {
        setChartData(r.data)
        barMinutes.current = r.data.bar_minutes ?? 5
        currentBuf.current = null
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [symbol, period])

  useEffect(() => {
    const livePrice = prices[symbol]?.price
    if (!livePrice || !mainSeries.current) return

    const bm = barMinutes.current
    const now = Date.now()
    const barStart = Math.floor(now / (bm * 60 * 1000)) * (bm * 60 * 1000)
    const ts = Math.floor(barStart / 1000)
    const buf = currentBuf.current

    if (buf && buf.ts === ts) {
      buf.high = Math.max(buf.high, livePrice)
      buf.low = Math.min(buf.low, livePrice)
      buf.close = livePrice
    } else {
      const open = buf ? buf.close : livePrice
      currentBuf.current = { ts, open, high: livePrice, low: livePrice, close: livePrice }
    }

    const bar = currentBuf.current
    try {
      if (chartType === 'candle' || chartType === 'bar') {
        mainSeries.current.update({ time: bar.ts, open: bar.open, high: bar.high, low: bar.low, close: bar.close })
      } else {
        mainSeries.current.update({ time: bar.ts, value: bar.close })
      }
    } catch { }
  }, [prices, symbol, chartType])
  useEffect(() => {
    if (!mainRef.current || !chartData?.candles?.length) return
    if (mainInst.current) { mainInst.current.remove(); mainInst.current = null; mainSeries.current = null }
    if (subInst.current) { subInst.current.remove(); subInst.current = null }

    const toTs = (t) => Math.floor(new Date(t).getTime() / 1000)
    const dedup = (arr) =>
      arr.map((p) => ({ ...p, time: toTs(p.time) }))
        .filter((p, i, a) => i === 0 || p.time > a[i - 1].time)
    const chart = createChart(mainRef.current, {
      width: mainRef.current.clientWidth,
      height: 420,
      layout: {
        background: { color: '#070d1a' },
        textColor: '#7a8fad',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(26,37,55,0.9)' },
        horzLines: { color: 'rgba(26,37,55,0.9)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(0,212,255,0.55)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#050810' },
        horzLine: { color: 'rgba(0,212,255,0.55)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#050810' },
      },
      rightPriceScale: {
        borderColor: 'rgba(26,37,55,0.9)',
        textColor: '#7a8fad',
        scaleMargins: { top: 0.1, bottom: 0.08 },
        entireTextOnly: true,
      },
      timeScale: {
        borderColor: 'rgba(26,37,55,0.9)',
        timeVisible: true,
        secondsVisible: false,
        textColor: '#7a8fad',
        rightOffset: 8,
        minBarSpacing: 6,     
        fixRightEdge: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    })

    const candles = dedup(chartData.candles)
    let ms
    const candleOpts = {
      upColor: '#00e676',
      downColor: '#ff3366',
      borderUpColor: '#00e676',
      borderDownColor: '#ff3366',
      wickUpColor: '#00d060',
      wickDownColor: '#cc1f50',
      wickVisible: true,
      borderVisible: true,
    }

    if (chartType === 'candle') {
      ms = chart.addCandlestickSeries(candleOpts)
      ms.setData(candles)
    } else if (chartType === 'bar') {
      ms = chart.addBarSeries({ upColor: '#00e676', downColor: '#ff3366' })
      ms.setData(candles)
    } else if (chartType === 'line') {
      ms = chart.addLineSeries({ color: '#00d4ff', lineWidth: 2.5, priceLineVisible: true, lastValueVisible: true, crosshairMarkerVisible: true, crosshairMarkerRadius: 5 })
      ms.setData(candles.map((c) => ({ time: c.time, value: c.close })))
    } else {
      ms = chart.addAreaSeries({ lineColor: '#00d4ff', topColor: 'rgba(0,212,255,0.22)', bottomColor: 'rgba(0,212,255,0.01)', lineWidth: 2.5, priceLineVisible: true, lastValueVisible: true })
      ms.setData(candles.map((c) => ({ time: c.time, value: c.close })))
    }
    mainSeries.current = ms
    const symOrders = tradeHistory.filter((o) => o.symbol === symbol && o.status === 'FILLED')
    if (symOrders.length && ms) {
      try {
        const markers = symOrders.map((o) => {
          const ts = toTs(o.timestamp)
          const nearest = candles.reduce((best, c) => Math.abs(c.time - ts) < Math.abs(best.time - ts) ? c : best, candles[0])
          return {
            time: nearest.time,
            position: o.side === 'BUY' ? 'belowBar' : 'aboveBar',
            color: o.side === 'BUY' ? '#00e676' : '#ff3366',
            shape: o.side === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: `${o.side} ${o.quantity}@$${N(o.price).toFixed(0)}`,
            size: 2,
          }
        })
        const seen = new Set()
        const deduped = markers
          .sort((a, b) => a.time - b.time)
          .filter((m) => { const k = `${m.time}_${m.position}`; if (seen.has(k)) return false; seen.add(k); return true })
        ms.setMarkers(deduped)
      } catch { }
    }
    const ind = chartData.indicators
    const addLine = (data, color, w = 1.5, style = LineStyle.Solid) => {
      if (!data?.length) return
      const s = chart.addLineSeries({ color, lineWidth: w, priceLineVisible: false, lastValueVisible: false, lineStyle: style, crosshairMarkerVisible: false })
      try { s.setData(dedup(data.map((p) => ({ time: p.time, value: p.value })))) } catch { }
    }

    if (activeInd.includes('sma20')) addLine(ind.sma20, '#f59e0b', 2)
    if (activeInd.includes('sma50')) addLine(ind.sma50, '#ef4444', 2)
    if (activeInd.includes('ema12')) addLine(ind.ema12, '#8b5cf6', 2)
    if (activeInd.includes('ema26')) addLine(ind.ema26, '#a78bfa', 1.5, LineStyle.Dashed)
    if (activeInd.includes('vwap')) addLine(ind.vwap, '#ff9500', 2)
    if (activeInd.includes('bollinger') && ind.bollinger) {
      addLine(ind.bollinger.upper, 'rgba(6,182,212,0.75)', 1.5, LineStyle.Dashed)
      addLine(ind.bollinger.middle, 'rgba(6,182,212,0.4)', 1)
      addLine(ind.bollinger.lower, 'rgba(6,182,212,0.75)', 1.5, LineStyle.Dashed)
    }
    if (activeInd.includes('fibonacci') && ind.fibonacci?.levels && candles.length) {
      const ft = candles[0].time, lt = candles[candles.length - 1].time
      Object.entries(ind.fibonacci.levels).forEach(([k, v]) => {
        try {
          const s = chart.addLineSeries({ color: FIB_C[k] || 'rgba(255,215,0,0.4)', lineWidth: k === '0.618' ? 2 : 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: true, title: `Fib ${(parseFloat(k) * 100).toFixed(1)}%`, crosshairMarkerVisible: false })
          s.setData([{ time: ft, value: N(v) }, { time: lt, value: N(v) }])
        } catch { }
      })
    }
    const holding = portfolio?.holdings?.find((h) => h.symbol === symbol)
    if (holding && candles.length) {
      const ft = candles[0].time, lt = candles[candles.length - 1].time
      if (holding.avg_price) {
        try {
          const s = chart.addLineSeries({ color: 'rgba(0,212,255,0.6)', lineWidth: 1.5, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: true, title: '📍 Avg Entry', crosshairMarkerVisible: false })
          s.setData([{ time: ft, value: N(holding.avg_price) }, { time: lt, value: N(holding.avg_price) }])
        } catch { }
      }
      if (holding.stop_loss) {
        try {
          const s = chart.addLineSeries({ color: '#ff3366', lineWidth: 2, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: true, title: '⛔ SL', crosshairMarkerVisible: false })
          s.setData([{ time: ft, value: N(holding.stop_loss) }, { time: lt, value: N(holding.stop_loss) }])
        } catch { }
      }
      if (holding.take_profit) {
        try {
          const s = chart.addLineSeries({ color: '#00e676', lineWidth: 2, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: true, title: '🎯 TP', crosshairMarkerVisible: false })
          s.setData([{ time: ft, value: N(holding.take_profit) }, { time: lt, value: N(holding.take_profit) }])
        } catch { }
      }
    }

    chart.timeScale().fitContent()
    mainInst.current = chart
    if (subRef.current && candles.length) {
      const sc = createChart(subRef.current, {
        width: subRef.current.clientWidth,
        height: 140,
        layout: { background: { color: '#070d1a' }, textColor: '#7a8fad', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" },
        grid: { vertLines: { color: 'rgba(26,37,55,0.8)' }, horzLines: { color: 'rgba(26,37,55,0.8)' } },
        crosshair: { mode: CrosshairMode.Normal, vertLine: { color: 'rgba(0,212,255,0.4)', style: LineStyle.Dashed }, horzLine: { color: 'rgba(0,212,255,0.4)', style: LineStyle.Dashed } },
        rightPriceScale: { borderColor: 'rgba(26,37,55,0.9)', textColor: '#7a8fad', scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: 'rgba(26,37,55,0.9)', timeVisible: true, secondsVisible: false, textColor: '#7a8fad', minBarSpacing: 6 },
        handleScroll: { mouseWheel: true, pressedMouseMove: true },
        handleScale: { mouseWheel: true, pinch: true },
      })

      const addSub = (data, color, w = 1.5) => {
        if (!data?.length) return
        const s = sc.addLineSeries({ color, lineWidth: w, priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: false })
        try { s.setData(dedup(data.map((p) => ({ time: p.time, value: p.value })))) } catch { }
      }
      const addHL = (lv, color, title = '') => {
        if (!candles.length) return
        try {
          const s = sc.addLineSeries({ color, lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: !!title, title, crosshairMarkerVisible: false })
          s.setData([{ time: candles[0].time, value: lv }, { time: candles[candles.length - 1].time, value: lv }])
        } catch { }
      }

      if (subChart === 'RSI' && ind.rsi?.length) {
        addSub(ind.rsi, '#00d4ff', 2)
        addHL(70, 'rgba(255,51,102,0.5)', 'OB 70')
        addHL(50, 'rgba(136,153,180,0.2)', '')
        addHL(30, 'rgba(0,230,118,0.5)', 'OS 30')
      }
      if (subChart === 'MACD' && ind.macd) {
        if (ind.macd.histogram?.length) {
          const hs = sc.addHistogramSeries({ priceLineVisible: false, lastValueVisible: false })
          try { hs.setData(dedup(ind.macd.histogram.map((p) => ({ time: p.time, value: p.value, color: p.value >= 0 ? 'rgba(0,230,118,0.7)' : 'rgba(255,51,102,0.7)' })))) } catch { }
        }
        addSub(ind.macd.macd, '#00d4ff', 1.5)
        addSub(ind.macd.signal, '#ff9500', 1.5)
      }
      if (subChart === 'Volume' && ind.volume?.length) {
        const vs = sc.addHistogramSeries({ priceLineVisible: false, lastValueVisible: false })
        try { vs.setData(dedup(ind.volume.map((p) => ({ time: p.time, value: p.value, color: p.color })))) } catch { }
      }
      if (subChart === 'Stoch' && ind.stochastic) {
        addHL(80, 'rgba(255,51,102,0.4)', '')
        addHL(20, 'rgba(0,230,118,0.4)', '')
        addSub(ind.stochastic.k, '#ec4899', 2)
        addSub(ind.stochastic.d, '#f59e0b', 1.5)
      }
      if (subChart === 'ATR' && ind.atr?.length) {
        addSub(ind.atr, '#a3e635', 2)
      }

      sc.timeScale().fitContent()
      subInst.current = sc
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && subInst.current) try { subInst.current.timeScale().setVisibleLogicalRange(range) } catch { }
      })
      sc.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && mainInst.current) try { mainInst.current.timeScale().setVisibleLogicalRange(range) } catch { }
      })
    }

    const ro = new ResizeObserver(() => {
      if (mainRef.current && mainInst.current) mainInst.current.resize(mainRef.current.clientWidth, 420)
      if (subRef.current && subInst.current) subInst.current.resize(subRef.current.clientWidth, 140)
    })
    if (mainRef.current) ro.observe(mainRef.current)
    return () => ro.disconnect()

  }, [chartData, activeInd, subChart, chartType, portfolio, symbol, tradeHistory])
  const live = prices[symbol]
  const curStock = stocks.find((s) => s.symbol === symbol)
  const livePrice = N(live?.price ?? curStock?.price ?? 0)
  const liveChg = N(live?.change_pct ?? curStock?.change_pct ?? 0)
  const isUp = liveChg >= 0
  const totalCost = livePrice * N(qty)
  const maxBuy = portfolio ? Math.floor(N(portfolio.cash) / Math.max(livePrice, 0.01)) : 0
  const haveQty = N(portfolio?.holdings?.find((h) => h.symbol === symbol)?.quantity ?? 0)
  const holding = portfolio?.holdings?.find((h) => h.symbol === symbol)
  const rrRatio = sl && tp && livePrice > 0
    ? (Math.abs(parseFloat(tp) - livePrice) / Math.max(Math.abs(livePrice - parseFloat(sl)), 0.01)).toFixed(2)
    : null

  const doOrder = async () => {
    if (!user?.user_id) { toast$('error', 'Not logged in'); return }
    if (N(qty) < 1) { toast$('error', 'Qty must be ≥ 1'); return }
    if (livePrice <= 0) { toast$('error', 'Waiting for price…'); return }
    setOrdering(true); setConfirm(false)
    try {
      const res = await placeOrder({ symbol, side, quantity: parseInt(qty, 10), order_type: orderType, price: orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : null, stop_loss: sl ? parseFloat(sl) : null, take_profit: tp ? parseFloat(tp) : null, user_id: user.user_id })
      loadPort(); loadOrders()
      toast$('success', `✓ ${side} ${qty}×${symbol} @ $${N(res.data?.price ?? livePrice).toFixed(2)} — Filled!`)
      setQty(1); setSl(''); setTp(''); setLimitPrice('')
    } catch (e) { toast$('error', e?.response?.data?.detail || 'Order failed') }
    finally { setOrdering(false) }
  }

  const autoSLTP = () => {
    const atr = chartData?.indicators?.atr
    if (!atr?.length || livePrice <= 0) { toast$('error', 'Load chart first'); return }
    const a = N(atr[atr.length - 1].value)
    setSl((livePrice - a * 1.5).toFixed(2)); setTp((livePrice + a * 2.5).toFixed(2))
    toast$('info', `Auto SL/TP via ATR = $${a.toFixed(2)}`)
  }

  const doCancel = async (oid) => {
    try { await cancelActiveOrder(user.user_id, oid); loadPort(); toast$('success', 'SL/TP cancelled') }
    catch { toast$('error', 'Cancel failed') }
  }

  const subHint = {
    RSI: 'RSI(14) — >70 Overbought  ·  <30 Oversold',
    MACD: 'MACD(12,26,9) — Blue=MACD · Orange=Signal · Bars=Histogram',
    Volume: 'Volume — Green=Bullish · Red=Bearish candle',
    Stoch: 'Stoch(14,3) — Pink=%K · Orange=%D · Levels 20/80',
    ATR: 'ATR(14) — Rising = more volatility',
  }

  return (
    <div style={{ display: 'flex', gap: 12, width: '100%', alignItems: 'flex-start', boxSizing: 'border-box' }}>

      {toast && (
        <div style={{
          position: 'fixed', top: 14, right: 14, zIndex: 9999, maxWidth: 420, padding: '13px 18px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeInUp 0.3s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
          background: toast.type === 'success' ? 'rgba(0,230,118,0.1)' : toast.type === 'info' ? 'rgba(0,212,255,0.1)' : 'rgba(255,51,102,0.1)',
          border: `1px solid ${toast.type === 'success' ? '#00e676' : toast.type === 'info' ? '#00d4ff' : '#ff3366'}`
        }}>
          {toast.type === 'success' ? <CheckCircle size={16} color="#00e676" /> : <AlertCircle size={16} color={toast.type === 'info' ? '#00d4ff' : '#ff3366'} />}
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{toast.msg}</span>
        </div>
      )}

      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirm(false)}>
          <div className="card" style={{ padding: 28, maxWidth: 380, width: '92%', border: '1px solid rgba(255,255,255,0.07)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: side === 'BUY' ? 'rgba(0,230,118,0.15)' : 'rgba(255,51,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {side === 'BUY' ? <TrendingUp size={22} color="#00e676" /> : <TrendingDown size={22} color="#ff3366" />}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Confirm {side}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{symbol} · {orderType}</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
              {[['Symbol', symbol], ['Action', `${side} ${qty} shares`], ['Price', `$${livePrice.toFixed(2)}`], ['Total', `$${totalCost.toFixed(2)}`],
              ...(sl ? [['Stop Loss', `$${sl}`]] : []), ...(tp ? [['Take Profit', `$${tp}`]] : []), ...(rrRatio ? [['R:R', `1:${rrRatio}`]] : [])
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirm(false)}>Cancel</button>
              <button className={`btn ${side === 'BUY' ? 'btn-buy' : 'btn-sell'}`} style={{ flex: 2, fontWeight: 800, fontSize: 14 }} onClick={doOrder} disabled={ordering}>
                {ordering ? '⏳ Processing…' : `✓ Confirm ${side}`}
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="card" style={{ padding: 14, background: '#0a0e1a', border: '1px solid rgba(26,37,55,0.9)' }}>

       
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <select style={{ background: '#0d1220', border: '1px solid rgba(26,37,55,0.9)', color: 'var(--text-primary)', padding: '7px 10px', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none', maxWidth: 230 }}
              value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {stocks.map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>)}
            </select>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)' }}>
                ${livePrice.toFixed(2)}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: isUp ? '#00e676' : '#ff3366' }}>
                {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{liveChg.toFixed(2)}%
              </div>
            </div>

            {curStock && (
              <div style={{ display: 'flex', gap: 16 }}>
                {[['H', curStock.high_24h, '#00e676'], ['L', curStock.low_24h, '#ff3366']].map(([l, val, c]) => (
                  <div key={l}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>24h {l}</div>
                    <div style={{ fontSize: 12, color: c, fontFamily: 'var(--font-mono)' }}>${N(val).toFixed(2)}</div>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sector</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{curStock.sector}</div>
                </div>
              </div>
            )}

            {holding && (
              <div style={{ padding: '5px 12px', background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: 1 }}>Open Position</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {holding.quantity} @ ${N(holding.avg_price).toFixed(2)}
                  <span style={{ marginLeft: 8, color: N(holding.pnl) >= 0 ? '#00e676' : '#ff3366' }}>
                    {N(holding.pnl) >= 0 ? '+' : ''}${N(holding.pnl).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
             
              <div style={{ display: 'flex', gap: 3, background: '#0d1220', borderRadius: 8, padding: 3 }}>
                {TIMEFRAMES.map((tf) => (
                  <button key={tf.key} title={tf.desc} onClick={() => setPeriod(tf.key)} style={{
                    padding: '5px 11px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                    background: period === tf.key ? '#00d4ff' : 'transparent',
                    color: period === tf.key ? '#000' : '#7a8fad',
                    boxShadow: period === tf.key ? '0 0 10px rgba(0,212,255,0.35)' : 'none',
                  }}>{tf.label}</button>
                ))}
              </div>
              <div style={{ width: 1, height: 20, background: 'rgba(26,37,55,0.9)', margin: '0 3px' }} />
             
              <div style={{ display: 'flex', gap: 3, background: '#0d1220', borderRadius: 8, padding: 3 }}>
                {CHART_TYPES.map((ct) => (
                  <button key={ct.key} onClick={() => setChartType(ct.key)} style={{
                    padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, transition: 'all 0.15s', border: 'none',
                    background: chartType === ct.key ? 'rgba(168,85,247,0.25)' : 'transparent',
                    color: chartType === ct.key ? '#a855f7' : '#7a8fad',
                  }}>{ct.label}</button>
                ))}
              </div>
            </div>
          </div>

         
          <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {OVERLAYS.map((ind) => {
              const on = activeInd.includes(ind.key)
              return (
                <button key={ind.key}
                  onClick={() => setActiveInd((p) => on ? p.filter((k) => k !== ind.key) : [...p, ind.key])}
                  style={{
                    padding: '4px 11px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
                    border: `1px solid ${on ? ind.color : 'rgba(26,37,55,0.9)'}`,
                    background: on ? `${ind.color}18` : 'transparent',
                    color: on ? ind.color : '#7a8fad'
                  }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? ind.color : '#1a2537', display: 'inline-block', flexShrink: 0 }} />
                  {ind.label}
                </button>
              )
            })}
            <button onClick={() => setActiveInd([])}
              style={{ padding: '4px 11px', borderRadius: 20, border: '1px solid rgba(26,37,55,0.9)', background: 'transparent', color: '#7a8fad', fontSize: 10, cursor: 'pointer' }}>
              ✕ Clear
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#00e676' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e676', display: 'inline-block', animation: 'pulse-glow 2s ease-in-out infinite' }} />
              LIVE
            </div>
          </div>

          
          {loading
            ? <div style={{ height: 420, background: '#070d1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <RefreshCw size={26} color="#00d4ff" style={{ animation: 'spin 0.9s linear infinite' }} />
              <span style={{ color: '#7a8fad', fontSize: 13 }}>Loading {period} chart…</span>
            </div>
            : <div ref={mainRef} style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }} />
          }
        </div>

        
        <div style={{ background: '#0a0e1a', border: '1px solid rgba(26,37,55,0.9)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(26,37,55,0.9)', overflowX: 'auto' }}>
            {SUBS.map((s) => (
              <button key={s} onClick={() => setSubChart(s)} style={{
                padding: '9px 16px', border: 'none', cursor: 'pointer', background: 'transparent', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                color: subChart === s ? '#00d4ff' : '#7a8fad',
                borderBottom: `2px solid ${subChart === s ? '#00d4ff' : 'transparent'}`
              }}>
                {s}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', paddingRight: 14, fontSize: 10, color: '#7a8fad', fontStyle: 'italic', whiteSpace: 'nowrap' }}>{subHint[subChart]}</span>
          </div>
          <div ref={subRef} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ width: 284, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, position: 'sticky', top: 0, maxHeight: 'calc(100vh - 76px)', overflowY: 'auto', overflowX: 'hidden' }}>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>Place Order</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Cash: <span style={{ color: '#00d4ff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>${N(portfolio?.cash).toLocaleString('en', { maximumFractionDigits: 0 })}</span>
            </span>
          </div>

          <div style={{ display: 'flex', marginBottom: 12, background: 'var(--bg-secondary)', borderRadius: 8, padding: 3, gap: 0 }}>
            {['BUY', 'SELL'].map((s) => (
              <button key={s} onClick={() => setSide(s)} style={{
                flex: 1, padding: '10px', border: 'none', cursor: 'pointer', borderRadius: 7, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 800, transition: 'all 0.2s',
                background: side === s ? (s === 'BUY' ? '#00e676' : '#ff3366') : 'transparent',
                color: side === s ? (s === 'BUY' ? '#000' : '#fff') : 'var(--text-muted)',
                boxShadow: side === s ? `0 0 14px ${s === 'BUY' ? 'rgba(0,230,118,0.4)' : 'rgba(255,51,102,0.4)'}` : 'none'
              }}>{s}</button>
            ))}
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={LB}>Order Type</label>
            <select className="input" style={{ fontFamily: 'var(--font-body)', fontSize: 12, padding: '8px 10px' }} value={orderType} onChange={(e) => setOrderType(e.target.value)}>
              <option value="MARKET">Market Order (instant)</option>
              <option value="LIMIT">Limit Order (custom price)</option>
            </select>
          </div>
          {orderType === 'LIMIT' && (
            <div style={{ marginBottom: 10 }}>
              <label style={LB}>Limit Price ($)</label>
              <input className="input" type="number" step="0.01" placeholder={livePrice.toFixed(2)} value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} style={{ padding: '8px 10px', fontSize: 12 }} />
            </div>
          )}

          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ ...LB, marginBottom: 0 }}>Quantity</label>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{side === 'BUY' ? `Max: ${maxBuy}` : `Have: ${haveQty}`}</span>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <input className="input" type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} style={{ fontFamily: 'var(--font-mono)', padding: '8px 10px', fontSize: 12 }} />
              {side === 'BUY' && [25, 50, 100].map((pct) => (<button key={pct} onClick={() => setQty(Math.max(1, Math.floor(maxBuy * pct / 100)))} style={{ padding: '0 7px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 9, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{pct}%</button>))}
              {side === 'SELL' && haveQty > 0 && (<button onClick={() => setQty(haveQty)} style={{ padding: '0 9px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 9, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>All</button>)}
            </div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 12, border: '1px solid var(--border)' }}>
            {[['Price', `$${livePrice.toFixed(2)}`], ['Qty', qty.toString()]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Total</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: side === 'BUY' ? '#00e676' : '#ff3366' }}>${totalCost.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ ...LB, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 0 }}><ShieldAlert size={12} color="#ff3366" /> Stop Loss ($)</label>
              <button onClick={autoSLTP} style={{ fontSize: 10, color: '#00d4ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}>⚡ Auto ATR</button>
            </div>
            <input className="input" type="number" step="0.01" placeholder={livePrice > 0 ? (livePrice * 0.97).toFixed(2) : '0.00'} value={sl} onChange={(e) => setSl(e.target.value)} style={{ borderColor: sl ? 'rgba(255,51,102,0.6)' : undefined, padding: '8px 10px', fontSize: 12 }} />
            {sl && livePrice > 0 && parseFloat(sl) > 0 && <div style={{ fontSize: 10, color: '#ff3366', marginTop: 3 }}>Risk: ${Math.abs((livePrice - parseFloat(sl)) * N(qty)).toFixed(2)} · {Math.abs(((livePrice - parseFloat(sl)) / livePrice) * 100).toFixed(1)}%</div>}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ ...LB, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}><Target size={12} color="#00e676" /> Take Profit ($)</label>
            <input className="input" type="number" step="0.01" placeholder={livePrice > 0 ? (livePrice * 1.05).toFixed(2) : '0.00'} value={tp} onChange={(e) => setTp(e.target.value)} style={{ borderColor: tp ? 'rgba(0,230,118,0.6)' : undefined, padding: '8px 10px', fontSize: 12 }} />
            {tp && livePrice > 0 && parseFloat(tp) > 0 && <div style={{ fontSize: 10, color: '#00e676', marginTop: 3 }}>Reward: ${Math.abs((parseFloat(tp) - livePrice) * N(qty)).toFixed(2)} · {Math.abs(((parseFloat(tp) - livePrice) / livePrice) * 100).toFixed(1)}%</div>}
          </div>

          {rrRatio && (
            <div style={{ padding: '8px 12px', background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 8, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--gold)' }}>R:R</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--gold)', fontSize: 14 }}>1:{rrRatio}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>aim 1:2+</span>
            </div>
          )}

          <button className={`btn ${side === 'BUY' ? 'btn-buy' : 'btn-sell'}`} style={{ width: '100%', padding: '13px', fontSize: 15, fontWeight: 800, gap: 8 }}
            onClick={() => { if (!user?.user_id) { toast$('error', 'Log in first'); return } if (livePrice <= 0) { toast$('error', 'Waiting for price…'); return } if (N(qty) < 1) { toast$('error', 'Qty ≥ 1'); return } setConfirm(true) }}
            disabled={ordering || livePrice <= 0}>
            {ordering ? '⏳ Processing…' : <>{side === 'BUY' ? <TrendingUp size={16} /> : <TrendingDown size={16} />} {side} {qty} × {symbol}</>}
          </button>
        </div>

        {portfolio?.holdings?.length > 0 && (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 10 }}>Open Positions</div>
            {portfolio.holdings.map((h) => {
              const pnl = N(h.pnl)
              return (
                <div key={h.symbol} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: 13, color: '#00d4ff', cursor: 'pointer' }} onClick={() => setSymbol(h.symbol)}>{h.symbol}</span>
                    <span style={{ fontSize: 12, color: pnl >= 0 ? '#00e676' : '#ff3366', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 5 }}>
                    <span>{h.quantity} @ ${N(h.avg_price).toFixed(2)}</span>
                    <span style={{ color: N(h.pnl_pct) >= 0 ? '#00e676' : '#ff3366' }}>{N(h.pnl_pct) >= 0 ? '+' : ''}{N(h.pnl_pct).toFixed(1)}%</span>
                  </div>
                  {(h.stop_loss || h.take_profit) && (
                    <div style={{ display: 'flex', gap: 5, marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      {h.stop_loss && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: 'rgba(255,51,102,0.1)', color: '#ff3366', border: '1px solid rgba(255,51,102,0.35)' }}>SL ${N(h.stop_loss).toFixed(2)}</span>}
                      {h.take_profit && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: 'rgba(0,230,118,0.1)', color: '#00e676', border: '1px solid rgba(0,230,118,0.35)' }}>TP ${N(h.take_profit).toFixed(2)}</span>}
                      {h.active_order_id && <button onClick={() => doCancel(h.active_order_id)} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}><X size={8} /> Cancel</button>}
                    </div>
                  )}
                  <button className="btn btn-sell" style={{ width: '100%', fontSize: 11, padding: '7px', fontWeight: 700 }}
                    onClick={() => { setSymbol(h.symbol); setSide('SELL'); setQty(h.quantity) }}>
                    Close Position
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {chartData?.indicators?.fibonacci?.levels && activeInd.includes('fibonacci') && (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--gold)', marginBottom: 8 }}>Fibonacci Levels</div>
            {Object.entries(chartData.indicators.fibonacci.levels).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: k === '0.618' ? 'var(--gold)' : 'var(--text-muted)', fontWeight: k === '0.618' ? 700 : 400 }}>{k === '0.618' ? '★ ' : ''}{(parseFloat(k) * 100).toFixed(1)}%</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: k === '0.618' ? 'var(--gold)' : 'var(--text-secondary)', fontWeight: k === '0.618' ? 700 : 400 }}>${N(v).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 10 }}>Live Signals</div>
          <SignalPanel ind={chartData?.indicators} livePrice={livePrice} />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function SignalPanel({ ind, livePrice }) {
  if (!ind) return <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>Select a stock</p>
  const N = (v) => { const n = Number(v); return isNaN(n) ? 0 : n }
  const items = []
  const rsi = ind.rsi?.[ind.rsi.length - 1]?.value
  if (rsi != null) items.push({ name: 'RSI', val: N(rsi).toFixed(1), sig: rsi > 70 ? 'SELL' : rsi < 30 ? 'BUY' : 'NEUTRAL', detail: rsi > 70 ? 'Overbought >70' : rsi < 30 ? 'Oversold <30' : `Neutral (${N(rsi).toFixed(0)})` })
  const ml = ind.macd?.macd, sl2 = ind.macd?.signal
  if (ml?.length && sl2?.length) { const m = N(ml[ml.length - 1]?.value), s = N(sl2[sl2.length - 1]?.value); items.push({ name: 'MACD', val: m.toFixed(3), sig: m > s ? 'BUY' : 'SELL', detail: m > s ? 'MACD above signal' : 'MACD below signal' }) }
  const atr = ind.atr?.[ind.atr.length - 1]?.value
  if (atr != null && livePrice > 0) { const pct = (N(atr) / livePrice) * 100; items.push({ name: 'ATR', val: `$${N(atr).toFixed(2)}`, sig: pct > 3 ? 'HIGH VOL' : pct < 1 ? 'LOW VOL' : 'MODERATE', detail: `${pct.toFixed(1)}% of price` }) }
  const sk = ind.stochastic?.k
  if (sk?.length) { const k = N(sk[sk.length - 1]?.value); items.push({ name: 'Stoch %K', val: k.toFixed(1), sig: k > 80 ? 'SELL' : k < 20 ? 'BUY' : 'NEUTRAL', detail: k > 80 ? 'Overbought >80' : k < 20 ? 'Oversold <20' : 'Mid range' }) }
  const C = { BUY: '#00e676', SELL: '#ff3366', NEUTRAL: 'var(--text-muted)', 'HIGH VOL': '#ffd700', 'LOW VOL': '#a855f7', MODERATE: 'var(--text-muted)' }
  if (!items.length) return <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Awaiting data…</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {items.map((s) => (
        <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{s.detail}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>{s.val}</div>
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: `${C[s.sig]}18`, color: C[s.sig], border: `1px solid ${C[s.sig]}40`, whiteSpace: 'nowrap' }}>{s.sig}</span>
          </div>
        </div>
      ))}
    </div>
  )
}