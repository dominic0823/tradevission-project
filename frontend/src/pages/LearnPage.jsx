import { useState, useEffect, useRef } from 'react'
import { getIndicatorsGuide } from '../utils/api'
import {
  BookOpen, TrendingUp, Activity, BarChart2, ChevronDown, ChevronUp,
  Zap, Trophy, Star, Target, Play, CheckCircle, XCircle, RotateCcw,
  Layers, AlertTriangle, Clock, Award, Filter, Search
} from 'lucide-react'

const CATEGORY_ICONS = {
  Trend: TrendingUp, Momentum: Activity, Volatility: BarChart2,
  'Support/Resistance': Target, Volume: Layers,
}
const CATEGORY_COLORS = {
  Trend: '#00d4ff', Momentum: '#00e676', Volatility: '#f43f5e',
  'Support/Resistance': '#ffd700', Volume: '#ff9500',
}
const DIFFICULTY_COLOR = { Beginner: '#00e676', Intermediate: '#f59e0b', Advanced: '#f43f5e' }

const YOUTUBE_VIDEOS = {
  sma: { id: 'cSWC2WwbhHE', title: 'Moving Averages Explained Completely', channel: 'Rayner Teo' },
  ema: { id: 'rtkBd9PXg9I', title: 'EMA vs SMA — Which is Better?', channel: 'Trading Rush' },
  rsi: { id: 'UOPJbSLBoO8', title: 'RSI Indicator Explained — Full Guide', channel: 'Booming Bulls' },
  macd: { id: 'B7jrlVeis6k', title: 'MACD Indicator — Complete Strategy', channel: 'Trading Rush' },
  bollinger: { id: 'yBjk9r9igcQ', title: 'Bollinger Bands — Full Tutorial', channel: 'Trading Rush' },
  fibonacci: { id: 'iL76k2A9ono', title: 'Fibonacci Retracement Explained', channel: 'TradingLab' },
  vwap: { id: 'SeqVUNanFeY', title: 'VWAP Trading Strategy', channel: 'Tom Crown' },
  stochastic: { id: 'vLbLZWi_Ypc', title: 'Stochastic Oscillator — Full Guide', channel: 'Data Trader' },
  atr: { id: 'UgAXWT7NLKg', title: 'ATR Indicator — Stop Loss & Sizing', channel: 'Fortune Talks' },
}

const SVG_CHARTS = {
  sma: (
    <svg viewBox="0 0 320 120" style={{ width: '100%', height: 120 }}>
      <defs>
        <linearGradient id="smaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points="10,90 30,75 50,82 70,60 90,55 110,65 130,45 150,50 170,38 190,42 210,30 230,35 250,22 270,28 290,18 310,15"
        fill="none" stroke="#8899b4" strokeWidth="1.5" />
      <polyline points="50,82 70,72 90,65 110,60 130,55 150,52 170,48 190,44 210,38 230,34 250,28 270,25 290,20 310,18"
        fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="0" />
      <polyline points="90,65 110,61 130,57 150,53 170,48 190,44 210,39 230,35 250,29 270,26 290,21 310,18"
        fill="none" stroke="#ef4444" strokeWidth="2" />
      <text x="260" y="15" fill="#f59e0b" fontSize="9" fontFamily="monospace">SMA20</text>
      <text x="260" y="28" fill="#ef4444" fontSize="9" fontFamily="monospace">SMA50</text>
      <line x1="130" y1="10" x2="130" y2="110" stroke="rgba(0,212,255,0.3)" strokeWidth="1" strokeDasharray="3,3" />
      <text x="108" y="108" fill="#00e676" fontSize="8">↑ Golden Cross</text>
    </svg>
  ),
  rsi: (
    <svg viewBox="0 0 320 120" style={{ width: '100%', height: 120 }}>
      <rect x="0" y="0" width="320" height="120" fill="transparent" />
      <line x1="10" y1="30" x2="310" y2="30" stroke="rgba(255,51,102,0.4)" strokeWidth="1" strokeDasharray="4,3" />
      <line x1="10" y1="60" x2="310" y2="60" stroke="rgba(136,153,180,0.3)" strokeWidth="1" strokeDasharray="4,3" />
      <line x1="10" y1="90" x2="310" y2="90" stroke="rgba(0,230,118,0.4)" strokeWidth="1" strokeDasharray="4,3" />
      <text x="312" y="33" fill="#ff3366" fontSize="8">70</text>
      <text x="312" y="63" fill="#8899b4" fontSize="8">50</text>
      <text x="312" y="93" fill="#00e676" fontSize="8">30</text>
      <polyline
        points="10,55 40,48 70,35 90,28 110,32 130,55 160,72 190,85 210,95 230,88 250,70 270,55 290,42 310,38"
        fill="none" stroke="#00d4ff" strokeWidth="2" />
      <circle cx="90" cy="28" r="4" fill="#ff3366" opacity="0.8" />
      <text x="78" y="22" fill="#ff3366" fontSize="8">Overbought</text>
      <circle cx="210" cy="95" r="4" fill="#00e676" opacity="0.8" />
      <text x="200" y="110" fill="#00e676" fontSize="8">Oversold</text>
    </svg>
  ),
  macd: (
    <svg viewBox="0 0 320 120" style={{ width: '100%', height: 120 }}>
      <line x1="10" y1="60" x2="310" y2="60" stroke="rgba(136,153,180,0.2)" strokeWidth="1" />
      {[10, 30, 50, 70, 90, 110, 130, 150, 170, 190, 210, 230, 250, 270, 290].map((x, i) => {
        const vals = [5, -3, 8, 12, 10, 6, 2, -4, -10, -14, -8, -2, 4, 10, 14]
        const v = vals[i] * 2
        return <rect key={x} x={x} y={v > 0 ? 60 - v : 60} width="14" height={Math.abs(v)}
          fill={v > 0 ? 'rgba(0,230,118,0.7)' : 'rgba(255,51,102,0.7)'} rx="1" />
      })}
      <polyline points="10,58 30,62 50,55 70,48 90,50 110,53 130,57 150,63 170,70 190,76 210,70 230,63 250,56 270,50 290,45"
        fill="none" stroke="#00d4ff" strokeWidth="1.5" />
      <polyline points="10,60 30,60 50,57 70,52 90,51 110,53 130,56 150,61 170,67 190,72 210,68 230,62 250,56 270,51 290,47"
        fill="none" stroke="#ff9500" strokeWidth="1.5" />
      <text x="240" y="18" fill="#00d4ff" fontSize="9">MACD</text>
      <text x="240" y="30" fill="#ff9500" fontSize="9">Signal</text>
    </svg>
  ),
  bollinger: (
    <svg viewBox="0 0 320 120" style={{ width: '100%', height: 120 }}>
      <path d="M10,25 Q80,15 160,28 Q240,40 310,20 L310,85 Q240,95 160,82 Q80,70 10,85 Z" fill="rgba(6,182,212,0.07)" />
      <polyline points="10,25 40,20 80,18 120,25 160,28 200,35 240,32 280,22 310,20"
        fill="none" stroke="rgba(6,182,212,0.7)" strokeWidth="1" strokeDasharray="4,2" />
      <polyline points="10,85 40,80 80,75 120,82 160,82 200,88 240,85 280,78 310,85"
        fill="none" stroke="rgba(6,182,212,0.7)" strokeWidth="1" strokeDasharray="4,2" />
      <polyline points="10,55 40,50 80,47 120,54 160,56 200,62 240,58 280,50 310,53"
        fill="none" stroke="#06b6d4" strokeWidth="1.5" />
      <polyline points="10,70 30,55 50,40 70,28 90,30 110,50 130,65 150,72 170,68 190,75 210,82 230,78 250,65 270,50 290,42 310,38"
        fill="none" stroke="#8899b4" strokeWidth="1.5" />
      <circle cx="70" cy="28" r="3" fill="#ff3366" />
      <circle cx="210" cy="82" r="3" fill="#00e676" />
      <text x="55" y="22" fill="#ff3366" fontSize="8">↑ Upper Touch</text>
      <text x="195" y="96" fill="#00e676" fontSize="8">↓ Lower Touch</text>
    </svg>
  ),
  fibonacci: (
    <svg viewBox="0 0 320 120" style={{ width: '100%', height: 120 }}>
      {[
        { y: 10, label: '0%', color: 'rgba(255,255,255,0.4)' },
        { y: 32, label: '23.6%', color: 'rgba(255,215,0,0.6)' },
        { y: 50, label: '38.2%', color: 'rgba(255,165,0,0.7)' },
        { y: 63, label: '50%', color: 'rgba(255,100,100,0.6)' },
        { y: 78, label: '61.8% ★', color: '#ffd700' },
        { y: 95, label: '78.6%', color: 'rgba(100,200,255,0.6)' },
        { y: 110, label: '100%', color: 'rgba(255,255,255,0.4)' },
      ].map(({ y, label, color }) => (
        <g key={label}>
          <line x1="10" y1={y} x2="280" y2={y} stroke={color} strokeWidth={label.includes('★') ? 1.5 : 1} strokeDasharray={label.includes('★') ? '0' : '3,3'} />
          <text x="282" y={y + 4} fill={color} fontSize="8" fontFamily="monospace">{label}</text>
        </g>
      ))}
      <polyline points="10,110 50,90 90,95 130,80 170,65 210,55 250,30 290,10"
        fill="none" stroke="#8899b4" strokeWidth="1.5" />
      <rect x="10" y="68" width="260" height="10" fill="rgba(255,215,0,0.08)" />
    </svg>
  ),
  vwap: (
    <svg viewBox="0 0 320 120" style={{ width: '100%', height: 120 }}>
      <polyline points="10,80 40,70 70,60 100,65 130,55 160,50 190,55 220,45 250,38 280,32 310,28"
        fill="none" stroke="#8899b4" strokeWidth="1.5" />
      <polyline points="10,75 40,66 70,58 100,60 130,53 160,50 190,52 220,46 250,40 280,34 310,30"
        fill="none" stroke="#ff9500" strokeWidth="2" />
      <polyline points="10,85 40,75 70,62 100,70 130,58 160,55 190,60 220,50 250,42 280,38 310,33"
        fill="none" stroke="rgba(255,149,0,0.3)" strokeWidth="1" strokeDasharray="4,2" />
      <text x="260" y="18" fill="#ff9500" fontSize="9" fontFamily="monospace">VWAP</text>
      <text x="155" y="110" fill="#00e676" fontSize="8">Price above VWAP → Bullish</text>
    </svg>
  ),
  stochastic: (
    <svg viewBox="0 0 320 120" style={{ width: '100%', height: 120 }}>
      <line x1="10" y1="24" x2="290" y2="24" stroke="rgba(255,51,102,0.4)" strokeWidth="1" strokeDasharray="3,3" />
      <line x1="10" y1="96" x2="290" y2="96" stroke="rgba(0,230,118,0.4)" strokeWidth="1" strokeDasharray="3,3" />
      <text x="292" y="27" fill="#ff3366" fontSize="8">80</text>
      <text x="292" y="99" fill="#00e676" fontSize="8">20</text>
      <polyline points="10,50 40,35 70,20 100,18 130,30 160,55 190,80 220,98 250,90 270,70 290,50"
        fill="none" stroke="#ec4899" strokeWidth="2" />
      <polyline points="10,55 40,42 70,28 100,22 130,34 160,58 190,82 220,96 250,88 270,68 290,52"
        fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,2" />
      <circle cx="220" cy="98" r="4" fill="#00e676" opacity="0.9" />
      <text x="210" y="112" fill="#00e676" fontSize="8">BUY zone</text>
      <circle cx="100" cy="18" r="4" fill="#ff3366" opacity="0.9" />
      <text x="88" y="14" fill="#ff3366" fontSize="8">SELL zone</text>
      <text x="240" y="15" fill="#ec4899" fontSize="9">%K</text>
      <text x="255" y="15" fill="#f59e0b" fontSize="9">%D</text>
    </svg>
  ),
  atr: (
    <svg viewBox="0 0 320 120" style={{ width: '100%', height: 120 }}>
      <polyline points="10,100 40,90 70,85 100,88 130,70 160,55 190,40 220,35 250,28 280,32 310,38"
        fill="none" stroke="#a3e635" strokeWidth="2" />
      <text x="150" y="15" fill="#a3e635" fontSize="9" textAnchor="middle">ATR (14)</text>
      {[10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310].map((x, i) => {
        const heights = [8, 10, 9, 11, 16, 20, 24, 26, 28, 25, 22]
        const mid = [100, 90, 85, 88, 70, 55, 40, 35, 28, 32, 38]
        return <line key={x} x1={x} y1={mid[i] - heights[i] / 2} x2={x} y2={mid[i] + heights[i] / 2}
          stroke="rgba(163,230,53,0.4)" strokeWidth="8" strokeLinecap="round" />
      })}
      <text x="200" y="108" fill="#f59e0b" fontSize="8">Rising ATR = more volatility</text>
    </svg>
  ),
}

const ALL_QUIZZES = [
  { q: 'RSI above 70 indicates the stock is...', options: ['Oversold', 'Overbought', 'Trending up', 'Consolidating'], answer: 1, difficulty: 'Beginner', topic: 'RSI', explanation: 'RSI > 70 means the asset is overbought — it has risen too fast and may reverse down.' },
  { q: 'SMA stands for...', options: ['Signal Moving Average', 'Simple Moving Average', 'Standard Market Analysis', 'Short Moving Aggregate'], answer: 1, difficulty: 'Beginner', topic: 'SMA', explanation: 'SMA = Simple Moving Average. It averages closing prices over N periods.' },
  { q: 'When price crosses ABOVE the SMA, it signals...', options: ['Bearish trend', 'Bullish trend', 'No change', 'Overbought'], answer: 1, difficulty: 'Beginner', topic: 'SMA', explanation: 'Price crossing above SMA is a bullish signal — buyers are taking control.' },
  { q: 'A Bollinger Band squeeze means...', options: ['High volatility now', 'Low volatility before a big move', 'Strong buy signal', 'Price will drop'], answer: 1, difficulty: 'Beginner', topic: 'Bollinger', explanation: 'Squeeze = bands contract = low volatility. This often precedes an explosive breakout.' },
  { q: 'MACD stands for...', options: ['Moving Average Convergence Divergence', 'Market Amplitude Change Direction', 'Mean Average Cross Divergence', 'Momentum And Chart Direction'], answer: 0, difficulty: 'Beginner', topic: 'MACD', explanation: 'MACD = Moving Average Convergence Divergence. It tracks two EMAs and their relationship.' },
  { q: 'RSI below 30 means the asset is...', options: ['Overbought', 'In a downtrend', 'Oversold (potential buy)', 'Volatile'], answer: 2, difficulty: 'Beginner', topic: 'RSI', explanation: 'RSI < 30 = oversold. The asset has fallen too fast and may bounce back up.' },
  { q: 'Which timeframe is VWAP typically reset on?', options: ['Weekly', 'Daily', 'Monthly', 'Hourly'], answer: 1, difficulty: 'Beginner', topic: 'VWAP', explanation: 'VWAP resets at the start of each trading day, making it a daily intraday indicator.' },
  { q: 'EMA reacts faster than SMA because...', options: ['It uses more data points', 'It gives more weight to recent prices', 'It uses volume data', 'It ignores old prices'], answer: 1, difficulty: 'Beginner', topic: 'EMA', explanation: 'EMA applies an exponential multiplier that gives heavier weight to the most recent prices.' },
  { q: 'What does ATR measure?', options: ['Trend direction', 'Market volatility', 'Volume strength', 'Price momentum'], answer: 1, difficulty: 'Beginner', topic: 'ATR', explanation: 'ATR (Average True Range) measures volatility — how much the price moves on average per candle.' },
  { q: 'Fibonacci 61.8% is also called...', options: ['The Silver Ratio', 'The Golden Ratio', 'The Key Level', 'The Mean Reversion'], answer: 1, difficulty: 'Beginner', topic: 'Fibonacci', explanation: '61.8% is derived from dividing a Fibonacci number by the next one. Known as the Golden Ratio.' },
  { q: 'MACD histogram growing ABOVE zero means...', options: ['Bearish momentum increasing', 'Bullish momentum increasing', 'Price is overbought', 'Trend reversal imminent'], answer: 1, difficulty: 'Intermediate', topic: 'MACD', explanation: 'Growing histogram above zero = MACD accelerating away from signal line = increasing bullish momentum.' },
  { q: 'In Stochastic, %K crossing ABOVE %D below 20 is a...', options: ['Sell signal', 'Strong buy signal', 'Neutral signal', 'Overbought warning'], answer: 1, difficulty: 'Intermediate', topic: 'Stochastic', explanation: '%K crossing above %D while in the oversold zone (<20) is one of the strongest Stochastic buy signals.' },
  { q: 'Price touching the UPPER Bollinger Band means...', options: ['Strong buy', 'Potential reversal down', 'Guaranteed breakout', 'Low volatility'], answer: 1, difficulty: 'Intermediate', topic: 'Bollinger', explanation: 'Upper band touch = price is statistically extended. It may reverse, though in strong trends it can "walk the band".' },
  { q: 'A MACD zero-line crossover (MACD crosses above 0) means...', options: ['MACD is overbought', 'EMA12 crossed above EMA26', 'Price hit resistance', 'Volume is low'], answer: 1, difficulty: 'Intermediate', topic: 'MACD', explanation: 'MACD crossing above zero = EMA12 crossed above EMA26. This is a Golden Cross — a strong trend signal.' },
  { q: 'VWAP is most useful for...', options: ['Long-term investors', 'Intraday traders and institutions', 'Weekly swing traders', 'Fundamental analysis'], answer: 1, difficulty: 'Intermediate', topic: 'VWAP', explanation: 'VWAP is an intraday tool. Institutions use it to benchmark their orders, making it a key level for day traders.' },
  { q: 'RSI divergence occurs when...', options: ['RSI and price move in the same direction', 'RSI and price move in opposite directions', 'RSI crosses 50', 'RSI stays flat'], answer: 1, difficulty: 'Intermediate', topic: 'RSI', explanation: 'Divergence = price makes new high but RSI makes lower high. This warns of a potential reversal.' },
  { q: 'In Fibonacci, the BEST retracement entry zones in an uptrend are...', options: ['100% and 78.6%', '38.2%, 50%, 61.8%', '23.6% only', '10% and 20%'], answer: 1, difficulty: 'Intermediate', topic: 'Fibonacci', explanation: 'In an uptrend, price commonly pulls back to 38.2%, 50%, or 61.8% before continuing up — ideal entry zones.' },
  { q: 'ATR is best used to set...', options: ['Entry price', 'Stop loss distance', 'Profit targets only', 'Position size only'], answer: 1, difficulty: 'Intermediate', topic: 'ATR', explanation: 'ATR tells you average price movement. Placing SL at 1.5×-2× ATR gives trades room without premature stops.' },
  { q: 'A Golden Cross is when...', options: ['Price hits all-time high', 'SMA 50 crosses above SMA 200', 'RSI hits 100', 'MACD hits zero'], answer: 1, difficulty: 'Intermediate', topic: 'SMA', explanation: 'Golden Cross = short-term MA (50) crosses above long-term MA (200). Historically a very bullish signal.' },
  { q: 'Which indicator combines price AND volume data?', options: ['RSI', 'MACD', 'VWAP', 'Bollinger Bands'], answer: 2, difficulty: 'Intermediate', topic: 'VWAP', explanation: 'VWAP weights average price by volume traded. All other listed indicators use only price data.' },
  { q: 'RSI divergence is MOST powerful when RSI is...', options: ['Near 50', 'In overbought (>70) or oversold (<30) zones', 'Rising steadily', 'Flat for many bars'], answer: 1, difficulty: 'Advanced', topic: 'RSI', explanation: 'Divergence at extremes (<30 or >70) is the most reliable reversal warning signal in technical analysis.' },
  { q: 'In a strong uptrend, Bollinger Bands can show "band walking" which means...', options: ['Price breaks the bands', 'Price repeatedly closes near the upper band without reversing', 'Bands contract sharply', 'Price crosses the middle band'], answer: 1, difficulty: 'Advanced', topic: 'Bollinger', explanation: 'Band walking = strong momentum. In this case the upper band is NOT a reversal signal — use other indicators to confirm.' },
  { q: 'Stochastic %D line is calculated as...', options: ['EMA of %K', 'SMA(3) of %K', 'RSI of %K', 'Standard deviation of %K'], answer: 1, difficulty: 'Advanced', topic: 'Stochastic', explanation: '%D = 3-period SMA of %K. It acts as a signal line, smoothing out noise from the faster %K.' },
  { q: 'Which scenario best describes MACD bearish divergence?', options: ['Price falls, MACD rises', 'Price rises to new high, MACD makes a lower high', 'MACD crosses below zero', 'MACD histogram turns red'], answer: 1, difficulty: 'Advanced', topic: 'MACD', explanation: 'Bearish divergence = price makes new high but MACD momentum is weakening. This warns bulls are losing strength.' },
  { q: 'The optimal Risk:Reward ratio professional traders target is...', options: ['1:0.5', '1:1', '1:2 or higher', '5:1'], answer: 2, difficulty: 'Advanced', topic: 'Risk Management', explanation: 'Professionals aim for at minimum 1:2 R:R. This means even with a 40% win rate you still profit overall.' },
  { q: 'When ATR is very LOW, what does this typically precede?', options: ['A period of continued calm', 'A large explosive price move', 'A guaranteed uptrend', 'A volume spike with no price change'], answer: 1, difficulty: 'Advanced', topic: 'ATR', explanation: 'Low ATR = compression. Markets cycle between expansion and contraction. Low volatility precedes high volatility.' },
  { q: 'In a DOWNTREND, where would Fibonacci retracements be drawn?', options: ['From swing low to swing high', 'From swing high to swing low', 'From any random point', 'Using daily closes only'], answer: 1, difficulty: 'Advanced', topic: 'Fibonacci', explanation: 'In a downtrend, draw Fibonacci from the swing HIGH to swing LOW. Retracement bounces are SHORT entries.' },
  { q: 'VWAP acting as resistance (price below VWAP) means institutions are likely...', options: ['Buying aggressively', 'Selling into rallies toward VWAP', 'Neutral on the stock', 'Waiting for earnings'], answer: 1, difficulty: 'Advanced', topic: 'VWAP', explanation: 'When price is below VWAP, institutions who bought above it are underwater and often sell rallies back to VWAP.' },
  { q: 'Triple top pattern combined with RSI overbought is a...', options: ['Strong buy setup', 'High probability reversal signal', 'Continuation signal', 'Irrelevant combination'], answer: 1, difficulty: 'Advanced', topic: 'RSI', explanation: 'Triple top + overbought RSI = classic multi-confirmation reversal. Pattern analysis + indicator confluence = higher probability.' },
  { q: 'Position sizing using ATR means...', options: ['Always buying 100 shares', 'Adjusting shares so your dollar risk equals 1-2× ATR × shares', 'Setting SL at exactly ATR', 'Using ATR for entry only'], answer: 1, difficulty: 'Advanced', topic: 'ATR', explanation: 'ATR-based position sizing: Risk per trade ÷ (ATR × multiplier) = number of shares. This normalizes risk across volatile and calm stocks.' },
]

const STRATEGIES = [
  {
    name: 'RSI + EMA Pullback',
    difficulty: 'Beginner',
    color: '#00e676',
    steps: [
      'Confirm stock is in uptrend (price above EMA 50)',
      'Wait for RSI to pull back below 40 (but not below 30)',
      'Look for RSI to turn back up from this dip',
      'Enter BUY when RSI crosses above 40 again',
      'Set Stop Loss below recent swing low',
      'Set Take Profit at 2× the risk distance (1:2 R:R)',
    ],
    tip: 'Only trade in the direction of the main trend. Never fight the EMA.',
  },
  {
    name: 'Bollinger Band Bounce',
    difficulty: 'Intermediate',
    color: '#06b6d4',
    steps: [
      'Identify a ranging (sideways) market using the bands',
      'Wait for price to touch or close outside the lower band',
      'Confirm RSI is below 35 (oversold confirmation)',
      'Enter BUY when next candle closes back inside the band',
      'Place Stop Loss 1× ATR below the entry candle low',
      'Target the middle band (SMA 20) as minimum Take Profit',
    ],
    tip: 'This strategy fails in strong trends — always check if the market is ranging first.',
  },
  {
    name: 'MACD + VWAP Momentum',
    difficulty: 'Advanced',
    color: '#10b981',
    steps: [
      'Only take trades when price is ABOVE VWAP (bullish bias)',
      'Wait for MACD line to cross above signal line',
      'Confirm the crossover happened while MACD is above zero',
      'Stochastic %K should be below 80 (not already overbought)',
      'Enter BUY immediately after confirmation candle closes',
      'SL: 2× ATR below entry. TP: 3× ATR above entry (1:1.5 R:R)',
    ],
    tip: 'The more confluence (indicators agreeing), the higher the probability. Never trade on one signal alone.',
  },
]

const GLOSSARY = [
  { term: 'Bull Market', cat: 'Market', def: 'A rising market where prices are increasing or expected to increase by 20%+ from lows.' },
  { term: 'Bear Market', cat: 'Market', def: 'A falling market — prices have dropped 20%+ from recent highs. Sentiment is negative.' },
  { term: 'Support Level', cat: 'Price Action', def: 'A price floor where buying demand is strong enough to stop the price from falling further.' },
  { term: 'Resistance Level', cat: 'Price Action', def: 'A price ceiling where selling pressure is strong enough to prevent further price rises.' },
  { term: 'Volatility', cat: 'Market', def: 'The degree of price variation over time. High volatility = large swings. Measured by ATR, Bollinger Bands.' },
  { term: 'Volume', cat: 'Market', def: 'Number of shares traded in a period. High volume confirms moves. Low volume = weak breakout.' },
  { term: 'Candlestick', cat: 'Chart', def: 'A chart bar showing Open, High, Low, Close. Green/White = close > open. Red/Black = close < open.' },
  { term: 'Divergence', cat: 'Indicators', def: 'When price and indicator move opposite directions. Warns of potential trend reversal.' },
  { term: 'Stop Loss (SL)', cat: 'Risk', def: 'An order that automatically sells your position if price falls to a set level. Limits your loss.' },
  { term: 'Take Profit (TP)', cat: 'Risk', def: 'An order that automatically closes your position when it reaches your profit target.' },
  { term: 'Risk:Reward (R:R)', cat: 'Risk', def: 'Ratio of potential loss to potential gain. 1:2 means risking $50 to make $100. Aim for 1:2 minimum.' },
  { term: 'Confluence', cat: 'Strategy', def: 'Multiple indicators or signals agreeing on the same trade direction. Increases probability.' },
  { term: 'Swing High / Low', cat: 'Price Action', def: 'Local peaks (swing high) and valleys (swing low) in price. Used for Fibonacci, Support/Resistance.' },
  { term: 'Breakout', cat: 'Price Action', def: 'When price breaks through a support or resistance level with momentum. Often leads to large moves.' },
  { term: 'Consolidation', cat: 'Price Action', def: 'A period where price moves sideways in a tight range before the next big directional move.' },
  { term: 'Position Sizing', cat: 'Risk', def: 'How many shares to buy. Calculated based on your account risk tolerance and stop loss distance.' },
]

const TABS = [
  { key: 'indicators', label: 'Indicators', icon: BarChart2 },
  { key: 'strategies', label: 'Strategies', icon: Target },
  { key: 'quiz', label: 'Quiz', icon: Trophy },
  { key: 'glossary', label: 'Glossary', icon: BookOpen },
]

export default function LearnPage() {
  const [indicators, setIndicators] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [activeTab, setActiveTab] = useState('indicators')
  const [quizDifficulty, setQuizDifficulty] = useState('All')
  const [quizTopic, setQuizTopic] = useState('All')
  const [quizIdx, setQuizIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [quizScore, setQuizScore] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [showExplain, setShowExplain] = useState(false)
  const [quizList, setQuizList] = useState(ALL_QUIZZES)
  const [watchingVideo, setWatchingVideo] = useState(null)
  const [glossarySearch, setGlossarySearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')

  useEffect(() => {
    getIndicatorsGuide().then((r) => setIndicators(r.data)).catch(() => { })
  }, [])

  useEffect(() => {
    let filtered = ALL_QUIZZES
    if (quizDifficulty !== 'All') filtered = filtered.filter((q) => q.difficulty === quizDifficulty)
    if (quizTopic !== 'All') filtered = filtered.filter((q) => q.topic === quizTopic)
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)
    setQuizList(shuffled)
    setQuizIdx(0); setSelected(null); setQuizScore(0); setQuizDone(false); setShowExplain(false)
  }, [quizDifficulty, quizTopic])

  const handleAnswer = (optIdx) => {
    if (selected !== null) return
    setSelected(optIdx)
    if (optIdx === quizList[quizIdx].answer) setQuizScore((s) => s + 1)
    setShowExplain(true)
  }

  const nextQuestion = () => {
    if (quizIdx < quizList.length - 1) {
      setQuizIdx((i) => i + 1); setSelected(null); setShowExplain(false)
    } else {
      setQuizDone(true)
    }
  }

  const resetQuiz = () => {
    const shuffled = [...quizList].sort(() => Math.random() - 0.5)
    setQuizList(shuffled)
    setQuizIdx(0); setSelected(null); setQuizScore(0); setQuizDone(false); setShowExplain(false)
  }

  const topics = ['All', ...Array.from(new Set(ALL_QUIZZES.map((q) => q.topic)))]
  const filteredGlossary = GLOSSARY.filter((g) =>
    (filterCat === 'All' || g.cat === filterCat) &&
    (g.term.toLowerCase().includes(glossarySearch.toLowerCase()) || g.def.toLowerCase().includes(glossarySearch.toLowerCase()))
  )
  const glossaryCats = ['All', ...Array.from(new Set(GLOSSARY.map((g) => g.cat)))]

  const scorePercent = quizList.length > 0 ? (quizScore / quizList.length) * 100 : 0
  const scoreEmoji = scorePercent === 100 ? '🏆' : scorePercent >= 70 ? '🌟' : scorePercent >= 50 ? '📈' : '📚'
  const scoreMsg = scorePercent === 100 ? 'Perfect! You\'re a trading master!' : scorePercent >= 70 ? 'Great job! Keep practicing!' : scorePercent >= 50 ? 'Good effort! Review the indicators.' : 'Keep studying — come back stronger!'

  return (
    <div style={{ maxWidth: 1050 }}>
      {watchingVideo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setWatchingVideo(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: 800, background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{watchingVideo.title}</span>
              <button onClick={() => setWatchingVideo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${watchingVideo.id}?autoplay=1&rel=0`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 2, marginBottom: 4 }}>
          TRADING <span style={{ color: 'var(--accent)' }} className="glow-text">ACADEMY</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Master {ALL_QUIZZES.length} quiz questions · {indicators.length || 9} indicators · 3 strategies · {GLOSSARY.length} glossary terms
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7,
            background: activeTab === key ? 'var(--accent)' : 'var(--bg-card)',
            color: activeTab === key ? '#000' : 'var(--text-secondary)',
            border: activeTab === key ? 'none' : '1px solid var(--border)',
            boxShadow: activeTab === key ? '0 0 20px var(--accent-glow)' : 'none',
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'indicators' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(indicators.length ? indicators : FALLBACK_INDICATORS).map((ind) => {
            const Icon = CATEGORY_ICONS[ind.category] || BookOpen
            const color = CATEGORY_COLORS[ind.category] || 'var(--accent)'
            const diffColor = DIFFICULTY_COLOR[ind.difficulty] || '#8899b4'
            const isOpen = expanded === ind.id
            const video = YOUTUBE_VIDEOS[ind.id]
            const chart = SVG_CHARTS[ind.id]
            return (
              <div key={ind.id} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                  onClick={() => setExpanded(isOpen ? null : ind.id)}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} color={color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800 }}>{ind.name}</h3>
                      <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 10, background: `${color}18`, color, border: `1px solid ${color}40`, fontWeight: 700 }}>{ind.category}</span>
                      {ind.difficulty && <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 10, background: `${diffColor}18`, color: diffColor, border: `1px solid ${diffColor}40`, fontWeight: 700 }}>{ind.difficulty}</span>}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ind.description}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {video && !isOpen && (
                      <button onClick={(e) => { e.stopPropagation(); setWatchingVideo(video) }} style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
                        background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.3)',
                        color: '#ff4444', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      }}>
                        <Play size={11} fill="#ff4444" /> Watch
                      </button>
                    )}
                    {isOpen ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                  </div>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', animation: 'fadeInUp 0.25s ease' }}>
                    {chart && (
                      <div style={{ padding: '16px 22px 0', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Chart Illustration</div>
                        {chart}
                      </div>
                    )}

                    <div style={{ padding: '20px 22px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: `1px solid ${color}20` }}>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Formula</div>
                          <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{ind.formula}</code>
                        </div>
                        <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>How to Use</div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{ind.usage}</p>
                        </div>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Trading Signals</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {ind.signals.map((sig, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: `1px solid ${color}25` }}>
                              <Zap size={12} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{sig}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {video && (
                        <button onClick={() => setWatchingVideo(video)} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 10,
                          background: 'rgba(255,0,0,0.12)', border: '1px solid rgba(255,0,0,0.3)',
                          color: '#ff5555', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%',
                          transition: 'all 0.15s',
                        }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Play size={16} fill="#ff5555" />
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>▶ {video.title}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,100,100,0.8)', fontWeight: 400 }}>by {video.channel} · YouTube</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'strategies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '16px 22px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertTriangle size={18} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              These are learning strategies for paper trading only. Always combine at least 2–3 indicators for confluence before entering any trade. Never risk more than 1–2% of your account on a single trade.
            </p>
          </div>
          {STRATEGIES.map((strat) => (
            <div key={strat.name} className="card" style={{ padding: 24, borderLeft: `3px solid ${strat.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{strat.name}</h3>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: `${DIFFICULTY_COLOR[strat.difficulty]}20`, color: DIFFICULTY_COLOR[strat.difficulty], border: `1px solid ${DIFFICULTY_COLOR[strat.difficulty]}40`, fontWeight: 700 }}>
                    {strat.difficulty}
                  </span>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${strat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={22} color={strat.color} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {strat.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${strat.color}20`, border: `1px solid ${strat.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: strat.color }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, paddingTop: 3 }}>{step}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', background: `${strat.color}10`, border: `1px solid ${strat.color}30`, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Zap size={14} color={strat.color} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: strat.color, fontWeight: 600 }}>Pro Tip: </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{strat.tip}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'quiz' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Difficulty</label>
              <div style={{ display: 'flex', gap: 5 }}>
                {['All', 'Beginner', 'Intermediate', 'Advanced'].map((d) => (
                  <button key={d} onClick={() => setQuizDifficulty(d)} style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                    background: quizDifficulty === d ? (DIFFICULTY_COLOR[d] || 'var(--accent)') : 'var(--bg-card)',
                    color: quizDifficulty === d ? '#000' : 'var(--text-secondary)',
                    border: `1px solid ${quizDifficulty === d ? (DIFFICULTY_COLOR[d] || 'var(--accent)') : 'var(--border)'}`,
                  }}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Topic</label>
              <select style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', outline: 'none' }}
                value={quizTopic} onChange={(e) => setQuizTopic(e.target.value)}>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginLeft: 'auto', padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{quizList.length} questions loaded</span>
            </div>
          </div>

          <div className="card" style={{ padding: 40, maxWidth: 680, margin: '0 auto' }}>
            {quizDone ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 72, marginBottom: 16 }}>{scoreEmoji}</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 2, marginBottom: 8, color: scorePercent >= 70 ? 'var(--green)' : 'var(--accent)' }}>
                  {quizScore}/{quizList.length}
                </h2>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{Math.round(scorePercent)}% Score</div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>{scoreMsg}</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn btn-ghost" onClick={resetQuiz}>
                    <RotateCcw size={15} /> Retry
                  </button>
                  <button className="btn btn-primary" onClick={() => setActiveTab('indicators')}>
                    Study Indicators →
                  </button>
                </div>
              </div>
            ) : quizList.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                No questions match your filters. Try changing difficulty or topic.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Q {quizIdx + 1} / {quizList.length}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: `${DIFFICULTY_COLOR[quizList[quizIdx].difficulty]}20`, color: DIFFICULTY_COLOR[quizList[quizIdx].difficulty], fontWeight: 700 }}>
                      {quizList[quizIdx].difficulty}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: 'var(--accent-dim)', color: 'var(--accent)', fontWeight: 700 }}>
                      {quizList[quizIdx].topic}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={14} color="var(--gold)" fill="var(--gold)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{quizScore}</span>
                  </div>
                </div>

                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, marginBottom: 28, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${((quizIdx) / quizList.length) * 100}%`, background: 'linear-gradient(90deg, var(--accent), var(--green))', borderRadius: 3, transition: 'width 0.4s ease' }} />
                </div>

                <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 24, lineHeight: 1.5 }}>{quizList[quizIdx].q}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {quizList[quizIdx].options.map((opt, i) => {
                    const isCorrect = i === quizList[quizIdx].answer
                    const isSelected = i === selected
                    let bg = 'var(--bg-secondary)', border = 'var(--border)', color = 'var(--text-primary)', icon = null
                    if (selected !== null) {
                      if (isCorrect) { bg = 'var(--green-dim)'; border = 'var(--green)'; color = 'var(--green)'; icon = <CheckCircle size={16} color="var(--green)" /> }
                      else if (isSelected) { bg = 'var(--red-dim)'; border = 'var(--red)'; color = 'var(--red)'; icon = <XCircle size={16} color="var(--red)" /> }
                    }
                    return (
                      <button key={i} onClick={() => handleAnswer(i)} style={{
                        padding: '14px 18px', border: `1px solid ${border}`, borderRadius: 12, background: bg,
                        color, fontSize: 14, textAlign: 'left', cursor: selected !== null ? 'default' : 'pointer',
                        fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{ width: 26, height: 26, borderRadius: 8, background: `${color === 'var(--text-primary)' ? 'var(--border)' : border}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span style={{ flex: 1 }}>{opt}</span>
                        {icon}
                      </button>
                    )
                  })}
                </div>

                {showExplain && (
                  <div style={{ marginTop: 16, padding: '14px 18px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 12, animation: 'fadeInUp 0.3s ease' }}>
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Explanation</div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{quizList[quizIdx].explanation}</p>
                    <button className="btn btn-primary" style={{ marginTop: 14, width: '100%' }} onClick={nextQuestion}>
                      {quizIdx < quizList.length - 1 ? 'Next Question →' : 'See Results →'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'glossary' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" placeholder="Search terms..." value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                style={{ paddingLeft: 34 }} />
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {glossaryCats.map((c) => (
                <button key={c} onClick={() => setFilterCat(c)} style={{
                  padding: '7px 13px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                  background: filterCat === c ? 'var(--accent)' : 'var(--bg-card)',
                  color: filterCat === c ? '#000' : 'var(--text-secondary)',
                  border: `1px solid ${filterCat === c ? 'var(--accent)' : 'var(--border)'}`,
                }}>{c}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {filteredGlossary.map((g) => (
              <div key={g.term} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>{g.term}</div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{g.cat}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{g.def}</div>
              </div>
            ))}
            {filteredGlossary.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                No results found for "{glossarySearch}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const FALLBACK_INDICATORS = [
  { id: 'sma', name: 'Simple Moving Average (SMA)', category: 'Trend', difficulty: 'Beginner', description: 'Average closing price over N periods.', formula: 'SMA = (P1 + P2 + ... + Pn) / n', signals: ['Price above SMA = Bullish', 'Price below SMA = Bearish'], usage: 'SMA 20 = short term. SMA 50 = medium term. Use for trend direction.' },
  { id: 'rsi', name: 'RSI', category: 'Momentum', difficulty: 'Beginner', description: 'Oscillator 0–100 measuring speed of price changes.', formula: 'RSI = 100 − (100 / (1 + Avg Gain / Avg Loss))', signals: ['RSI > 70 = Overbought', 'RSI < 30 = Oversold'], usage: 'Confirm with trend. RSI divergence is the strongest signal.' },
]