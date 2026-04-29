import random
from datetime import datetime, timedelta
from typing import Dict

STOCKS: Dict[str, dict] = {
    "AAPL":  {"name": "Apple Inc.",       "base_price": 178.50, "sector": "Technology"},
    "GOOGL": {"name": "Alphabet Inc.",     "base_price": 141.80, "sector": "Technology"},
    "MSFT":  {"name": "Microsoft Corp.",   "base_price": 415.20, "sector": "Technology"},
    "TSLA":  {"name": "Tesla Inc.",        "base_price": 248.90, "sector": "Automotive"},
    "AMZN":  {"name": "Amazon.com Inc.",   "base_price": 186.70, "sector": "E-Commerce"},
    "NVDA":  {"name": "NVIDIA Corp.",      "base_price": 875.40, "sector": "Technology"},
    "META":  {"name": "Meta Platforms",    "base_price": 521.30, "sector": "Social Media"},
    "NFLX":  {"name": "Netflix Inc.",      "base_price": 628.50, "sector": "Streaming"},
}

stock_prices: Dict[str, float] = {}
price_history: Dict[str, list] = {}


def generate_price_history(symbol: str, days: int = 90) -> list:
    """Generate simulated 5-minute OHLCV history for a symbol."""
    base = STOCKS[symbol]["base_price"]
    history = []
    current = base * random.uniform(0.75, 0.88)
    now = datetime.now()
    for i in range(days * 78):
        ts = now - timedelta(minutes=(days * 78 - i) * 5)
        change = random.gauss(0.00008, 0.0025)
        current = max(current * (1 + change), 1.0)
        history.append({
            "time":   ts.isoformat(),
            "open":   round(current * random.uniform(0.999, 1.001), 2),
            "high":   round(current * random.uniform(1.001, 1.006), 2),
            "low":    round(current * random.uniform(0.994, 0.999), 2),
            "close":  round(current, 2),
            "volume": random.randint(200000, 8000000),
        })
    return history


def aggregate_candles(raw: list, minutes_per_bar: int) -> list:
    """Combine 5-minute candles into larger timeframe bars."""
    if minutes_per_bar <= 5:
        return raw
    bars_per_new = minutes_per_bar // 5
    result = []
    for i in range(0, len(raw), bars_per_new):
        chunk = raw[i:i + bars_per_new]
        if not chunk:
            continue
        result.append({
            "time":   chunk[0]["time"],
            "open":   chunk[0]["open"],
            "high":   max(c["high"]  for c in chunk),
            "low":    min(c["low"]   for c in chunk),
            "close":  chunk[-1]["close"],
            "volume": sum(c["volume"] for c in chunk),
        })
    return result


def init_prices():
    """Initialise price history for all symbols at startup."""
    for sym in STOCKS:
        price_history[sym] = generate_price_history(sym)
        stock_prices[sym] = price_history[sym][-1]["close"]
        print(f"[INIT] {sym} @ ${stock_prices[sym]:.2f}")
