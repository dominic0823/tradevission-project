from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["learn"])

INDICATORS_GUIDE = [
    {"id": "sma", "name": "Simple Moving Average (SMA)", "category": "Trend", "difficulty": "Beginner",
     "description": "Average closing price over N periods. Smooths noise to reveal trend direction.",
     "formula": "SMA = (P1+P2+...+Pn) / n",
     "signals": ["Price above SMA = Bullish", "Price below SMA = Bearish", "SMA 20 > SMA 50 = Active uptrend"],
     "usage": "SMA 20 = short term. SMA 50 = medium term.", "color": "#f59e0b"},
    {"id": "ema", "name": "Exponential Moving Average (EMA)", "category": "Trend", "difficulty": "Beginner",
     "description": "Like SMA but weights recent prices more — reacts faster to changes.",
     "formula": "EMA = Price × (2/(n+1)) + EMA_prev × (1-2/(n+1))",
     "signals": ["EMA 12 > EMA 26 = Golden Cross (BUY)", "EMA 12 < EMA 26 = Death Cross (SELL)"],
     "usage": "Pairs with MACD. EMA 12/26 for entries, EMA 200 as trend filter.", "color": "#8b5cf6"},
    {"id": "rsi", "name": "Relative Strength Index (RSI)", "category": "Momentum", "difficulty": "Beginner",
     "description": "Oscillator 0-100 measuring speed of price changes.",
     "formula": "RSI = 100 - (100 / (1 + Avg Gain / Avg Loss))",
     "signals": ["RSI > 70 = Overbought → look to SELL", "RSI < 30 = Oversold → look to BUY", "Divergence = early reversal warning"],
     "usage": "Never trade RSI alone. Confirm with trend indicators.", "color": "#06b6d4"},
    {"id": "macd", "name": "MACD", "category": "Momentum", "difficulty": "Intermediate",
     "description": "Shows trend direction and momentum via two EMAs.",
     "formula": "MACD=EMA(12)-EMA(26) | Signal=EMA(9) | Histogram=MACD-Signal",
     "signals": ["MACD above Signal = BUY", "MACD below Signal = SELL", "Growing histogram = momentum up"],
     "usage": "Best on 1H+ charts. Zero-line crossovers are strongest.", "color": "#10b981"},
    {"id": "bollinger", "name": "Bollinger Bands", "category": "Volatility", "difficulty": "Intermediate",
     "description": "Bands ±2 std devs from SMA. Expand in volatile, shrink in calm markets.",
     "formula": "Middle=SMA(20) | Upper=SMA+2×StdDev | Lower=SMA-2×StdDev",
     "signals": ["Price at upper = Overbought", "Price at lower = Oversold", "Squeeze = big move incoming"],
     "usage": "Band squeeze precedes breakouts.", "color": "#f43f5e"},
    {"id": "fibonacci", "name": "Fibonacci Retracement", "category": "Support/Resistance", "difficulty": "Intermediate",
     "description": "Key price levels from Fibonacci. Markets statistically respect these.",
     "formula": "Levels: 23.6%, 38.2%, 50%, 61.8% (Golden Ratio), 78.6%",
     "signals": ["38.2% pullback = BUY zone", "61.8% = strongest S/R", "Break of 78.6% = reversal"],
     "usage": "Draw from swing low to high. Buy bounces at 38.2/50/61.8%.", "color": "#ffd700"},
    {"id": "vwap", "name": "VWAP", "category": "Volume", "difficulty": "Intermediate",
     "description": "Volume Weighted Average Price — institutional benchmark.",
     "formula": "VWAP = Σ(Typical Price × Volume) / Σ(Volume)",
     "signals": ["Price above VWAP = Bullish", "Price below VWAP = Bearish", "Return to VWAP = entry opportunity"],
     "usage": "Long above VWAP, short below. Institutions benchmark here.", "color": "#ff9500"},
    {"id": "stochastic", "name": "Stochastic Oscillator", "category": "Momentum", "difficulty": "Advanced",
     "description": "Compares close to range. More sensitive than RSI.",
     "formula": "%K=(Close-LowestLow)/(HighestHigh-LowestLow)×100 | %D=SMA(3) of %K",
     "signals": ["%K>%D below 20 = BUY", "%K<%D above 80 = SELL", "Divergence = reversal warning"],
     "usage": "Best in ranging markets. Use with Bollinger Bands.", "color": "#ec4899"},
    {"id": "atr", "name": "Average True Range (ATR)", "category": "Volatility", "difficulty": "Advanced",
     "description": "Measures volatility. Essential for stop loss sizing.",
     "formula": "TR=max(H-L, |H-PrevC|, |L-PrevC|) | ATR=SMA(TR,14)",
     "signals": ["Rising ATR = more volatility", "Falling ATR = consolidation"],
     "usage": "Set SL at 1.5-2× ATR. Size positions by ATR.", "color": "#a3e635"},
]


@router.get("/learn/indicators")
def get_indicators_guide():
    return INDICATORS_GUIDE
