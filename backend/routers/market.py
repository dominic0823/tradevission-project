import random

from fastapi import APIRouter, HTTPException

from services.market_data import STOCKS, stock_prices, price_history, aggregate_candles
from services.indicators import (
    compute_sma, compute_ema, compute_rsi, compute_macd,
    compute_bollinger, compute_vwap, compute_stochastic,
    compute_atr, compute_fibonacci,
)

router = APIRouter(prefix="/api", tags=["market"])
PERIOD_MAP = {
    "1H": (1,  5),    
    "4H": (5,  30),   
    "1D": (10, 60),   
    "1W": (30, 240),  
    "1M": (60, 480),  
    "3M": (90, 960), 
}


@router.get("/stocks")
def get_stocks():
    result = []
    for sym, info in STOCKS.items():
        price  = stock_prices[sym]
        hist   = price_history[sym]
        prev   = hist[-2]["close"] if len(hist) > 1 else price
        change = price - prev
        recent = hist[-78:]
        result.append({
            "symbol":     sym,
            "name":       info["name"],
            "sector":     info["sector"],
            "price":      round(price, 2),
            "change":     round(change, 2),
            "change_pct": round((change / prev) * 100, 2),
            "volume":     sum(c["volume"] for c in recent),
            "market_cap": round(price * random.randint(5_000_000_000, 30_000_000_000) / 1e9, 2),
            "high_24h":   round(max(c["high"] for c in recent), 2),
            "low_24h":    round(min(c["low"]  for c in recent), 2),
        })
    return result


@router.get("/stocks/{symbol}/chart")
def get_chart(symbol: str, period: str = "1M"):
    if symbol not in price_history:
        raise HTTPException(404, "Symbol not found")

    days, mins_per_bar = PERIOD_MAP.get(period, (60, 480))
    raw  = price_history[symbol][-(days * 78):]
    hist = aggregate_candles(raw, mins_per_bar)

    closes = [c["close"] for c in hist]
    times  = [c["time"]  for c in hist]

    ml, sl2, hg  = compute_macd(closes)
    bu, bm, bl   = compute_bollinger(closes)
    sk, sd       = compute_stochastic(hist)

    def pair(vals):
        return [{"time": t, "value": v} for t, v in zip(times, vals) if v is not None]

    return {
        "symbol":      symbol,
        "candles":     hist,
        "period":      period,
        "bar_minutes": mins_per_bar,
        "indicators": {
            "sma20":      pair(compute_sma(closes, 20)),
            "sma50":      pair(compute_sma(closes, 50)),
            "ema12":      pair(compute_ema(closes, 12)),
            "ema26":      pair(compute_ema(closes, 26)),
            "vwap":       pair(compute_vwap(hist)),
            "rsi":        pair(compute_rsi(closes)),
            "macd":       {"macd": pair(ml), "signal": pair(sl2), "histogram": pair(hg)},
            "bollinger":  {"upper": pair(bu), "middle": pair(bm), "lower": pair(bl)},
            "stochastic": {"k": pair(sk), "d": pair(sd)},
            "atr":        pair(compute_atr(hist)),
            "volume": [
                {
                    "time":  t,
                    "value": c["volume"],
                    "color": (
                        "rgba(0,230,118,0.55)"
                        if closes[i] >= (closes[i - 1] if i > 0 else closes[i])
                        else "rgba(255,51,102,0.55)"
                    ),
                }
                for i, (t, c) in enumerate(zip(times, hist))
            ],
            "fibonacci": compute_fibonacci(hist[-min(len(hist), 300):]),
        },
    }


@router.get("/market/overview")
def market_overview():
    gainers, losers = [], []
    for sym in STOCKS:
        price = stock_prices[sym]
        hist  = price_history[sym]
        prev  = hist[-2]["close"] if len(hist) > 1 else price
        cp    = ((price - prev) / prev) * 100
        entry = {"symbol": sym, "price": round(price, 2), "change_pct": round(cp, 2)}
        (gainers if cp > 0 else losers).append(entry)
    gainers.sort(key=lambda x: x["change_pct"], reverse=True)
    losers.sort( key=lambda x: x["change_pct"])
    return {"gainers": gainers[:4], "losers": losers[:4]}
