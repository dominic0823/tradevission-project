import json

from fastapi import APIRouter, HTTPException

from db.database import get_db, db_lock
from services.market_data import STOCKS, stock_prices

router = APIRouter(prefix="/api", tags=["portfolio"])


@router.get("/portfolio/{user_id}")
def get_portfolio(user_id: str):
    with db_lock:
        conn = get_db()
        try:
            port = conn.execute("SELECT * FROM portfolios WHERE user_id=?", (user_id,)).fetchone()
            if not port:
                raise HTTPException(404, "User portfolio not found")

            holdings     = json.loads(port["holdings"])
            realized_pnl = port["realized_pnl"] if "realized_pnl" in port.keys() else 0.0
            actives      = conn.execute("SELECT * FROM active_orders WHERE user_id=?", (user_id,)).fetchall()
            am           = {a["symbol"]: a for a in actives}

            holdings_detail = []
            total_mv = total_cost = 0

            for sym, holding in holdings.items():
                price = stock_prices.get(sym, 0)
                mv    = price * holding["quantity"]
                cost  = holding["avg_price"] * holding["quantity"]
                pnl   = mv - cost
                total_mv   += mv
                total_cost += cost
                ao = am.get(sym)
                holdings_detail.append({
                    "symbol":           sym,
                    "name":             STOCKS.get(sym, {}).get("name", sym),
                    "quantity":         holding["quantity"],
                    "avg_price":        round(holding["avg_price"], 2),
                    "current_price":    round(price, 2),
                    "market_value":     round(mv, 2),
                    "pnl":              round(pnl, 2),
                    "pnl_pct":          round((pnl / cost * 100) if cost > 0 else 0, 2),
                    "stop_loss":        ao["sl"] if ao else None,
                    "take_profit":      ao["tp"] if ao else None,
                    "active_order_id":  ao["id"] if ao else None,
                })

            unrealized_pnl = total_mv - total_cost
            equity         = port["cash"] + total_mv
            return {
                "cash":               round(port["cash"], 2),
                "holdings":           holdings_detail,
                "total_market_value": round(total_mv, 2),
                "unrealized_pnl":     round(unrealized_pnl, 2),
                "realized_pnl":       round(realized_pnl, 2),
                "total_pnl":          round(realized_pnl + unrealized_pnl, 2),
                "equity":             round(equity, 2),
                "initial_capital":    100000.0,
                "total_return_pct":   round(((equity - 100000) / 100000) * 100, 2),
            }
        finally:
            conn.close()
