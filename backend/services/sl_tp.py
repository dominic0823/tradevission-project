import json
import uuid
from datetime import datetime

from db.database import get_db, db_lock
from services.market_data import stock_prices


def check_sl_tp(user_id: str) -> list:
    """
    Check active orders for SL/TP triggers.
    Returns a list of triggered order summaries.
    """
    triggered = []
    with db_lock:
        conn = get_db()
        try:
            actives  = conn.execute("SELECT * FROM active_orders WHERE user_id=?", (user_id,)).fetchall()
            port_row = conn.execute("SELECT * FROM portfolios WHERE user_id=?",    (user_id,)).fetchone()
            if not port_row:
                return []

            cash         = port_row["cash"]
            realized_pnl = port_row["realized_pnl"]
            holdings     = json.loads(port_row["holdings"])
            to_delete    = []

            for o in actives:
                price = stock_prices.get(o["symbol"], 0)
                hit, reason = False, ""

                if o["sl"] and price <= o["sl"]:
                    hit, reason = True, "Stop Loss Hit"
                elif o["tp"] and price >= o["tp"]:
                    hit, reason = True, "Take Profit Hit"

                if hit:
                    sym, qty = o["symbol"], o["quantity"]
                    h = holdings.get(sym, {})
                    if h.get("quantity", 0) >= qty:
                        sell_total   = round(price * qty, 2)
                        buy_cost     = round(o["entry_price"] * qty, 2)
                        trade_pnl    = round(sell_total - buy_cost, 2)
                        h["quantity"] -= qty
                        cash          = round(cash + sell_total, 2)
                        realized_pnl  = round(realized_pnl + trade_pnl, 2)
                        if h["quantity"] == 0:
                            del holdings[sym]
                        conn.execute(
                            "INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                            (str(uuid.uuid4()), user_id, sym, "SELL", qty,
                             round(price, 2), sell_total, "AUTO", reason,
                             None, None, trade_pnl, datetime.now().isoformat())
                        )
                        to_delete.append(o["id"])
                        triggered.append({"symbol": sym, "reason": reason, "price": price, "pnl": trade_pnl})

            if to_delete:
                conn.execute(
                    "UPDATE portfolios SET cash=?, holdings=?, realized_pnl=? WHERE user_id=?",
                    (cash, json.dumps(holdings), realized_pnl, user_id)
                )
                for oid in to_delete:
                    conn.execute("DELETE FROM active_orders WHERE id=?", (oid,))
                conn.commit()
        finally:
            conn.close()
    return triggered
