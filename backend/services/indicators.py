import math


def compute_sma(closes: list, period: int) -> list:
    result = []
    for i in range(len(closes)):
        result.append(
            None if i < period - 1
            else round(sum(closes[i - period + 1:i + 1]) / period, 2)
        )
    return result


def compute_ema(closes: list, period: int) -> list:
    result = []
    m = 2 / (period + 1)
    for i, c in enumerate(closes):
        result.append(
            round(c, 2) if i == 0
            else round((c - result[-1]) * m + result[-1], 2)
        )
    return result


def compute_rsi(closes: list, period: int = 14) -> list:
    result = [None] * period
    gains, losses = [], []
    for i in range(1, len(closes)):
        diff = closes[i] - closes[i - 1]
        gains.append(max(diff, 0))
        losses.append(max(-diff, 0))
        if i >= period:
            ag = sum(gains[-period:]) / period
            al = sum(losses[-period:]) / period
            result.append(100 if al == 0 else round(100 - (100 / (1 + ag / al)), 2))
    return result


def compute_macd(closes: list) -> tuple:
    e12 = compute_ema(closes, 12)
    e26 = compute_ema(closes, 26)
    macd_line = [round(a - b, 4) for a, b in zip(e12, e26)]
    signal    = compute_ema(macd_line, 9)
    histogram = [round(m - s, 4) for m, s in zip(macd_line, signal)]
    return macd_line, signal, histogram


def compute_bollinger(closes: list, period: int = 20, sd: int = 2) -> tuple:
    upper, middle, lower = [], [], []
    for i in range(len(closes)):
        if i < period - 1:
            upper.append(None); middle.append(None); lower.append(None)
        else:
            w    = closes[i - period + 1:i + 1]
            mean = sum(w) / period
            std  = math.sqrt(sum((x - mean) ** 2 for x in w) / period)
            middle.append(round(mean, 2))
            upper.append(round(mean + sd * std, 2))
            lower.append(round(mean - sd * std, 2))
    return upper, middle, lower


def compute_vwap(candles: list) -> list:
    result, ctv, cv = [], 0.0, 0
    for c in candles:
        tp   = (c["high"] + c["low"] + c["close"]) / 3
        ctv += tp * c["volume"]
        cv  += c["volume"]
        result.append(round(ctv / cv, 2) if cv > 0 else None)
    return result


def compute_stochastic(candles: list, k: int = 14, d: int = 3) -> tuple:
    kv = []
    for i in range(len(candles)):
        if i < k - 1:
            kv.append(None)
        else:
            w  = candles[i - k + 1:i + 1]
            hi = max(c["high"] for c in w)
            lo = min(c["low"]  for c in w)
            cl = candles[i]["close"]
            kv.append(50.0 if hi == lo else round(((cl - lo) / (hi - lo)) * 100, 2))
    valid = [v for v in kv if v is not None]
    dr    = compute_sma(valid, d)
    return kv, [None] * kv.count(None) + dr


def compute_atr(candles: list, period: int = 14) -> list:
    trs, result = [], []
    for i, c in enumerate(candles):
        tr = (
            c["high"] - c["low"] if i == 0
            else max(
                c["high"] - c["low"],
                abs(c["high"] - candles[i - 1]["close"]),
                abs(c["low"]  - candles[i - 1]["close"]),
            )
        )
        trs.append(tr)
        result.append(
            None if i < period - 1
            else round(sum(trs[-period:]) / period, 4)
        )
    return result


def compute_fibonacci(candles: list) -> dict:
    if not candles:
        return {}
    sh = max(c["high"] for c in candles)
    sl = min(c["low"]  for c in candles)
    d  = sh - sl
    return {
        "levels": {
            "0":     round(sh, 2),
            "0.236": round(sh - 0.236 * d, 2),
            "0.382": round(sh - 0.382 * d, 2),
            "0.5":   round(sh - 0.5   * d, 2),
            "0.618": round(sh - 0.618 * d, 2),
            "0.786": round(sh - 0.786 * d, 2),
            "1":     round(sl, 2),
        },
        "swing_high": round(sh, 2),
        "swing_low":  round(sl, 2),
    }
