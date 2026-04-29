import json
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db.database import get_db, db_lock
from services.market_data import stock_prices

router = APIRouter(prefix="/api", tags=["orders"])


class OrderRequest(BaseModel):
    symbol: str
    order_type: str
    side: str
    quantity: int
    price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    user_id: str


class ModifyOrderRequest(BaseModel):
    order_id: str
    user_id: str
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None


@router.post("/orders")
def place_order(req: OrderRequest):
    with db_lock:
        conn = get_db()
        try:
            port = conn.execute("SELECT * FROM portfolios WHERE user_id=?", (req.user_id,)).fetchone()
            if not port:
                raise HTTPException(404, "User not found — please log in again")

            price = stock_prices.get(req.symbol)
            if not price:
                raise HTTPException(404, f"Symbol {req.symbol} not found")

            ep           = req.price if req.order_type == "LIMIT" and req.price else price
            tv           = round(ep * req.quantity, 2)
            holdings     = json.loads(port["holdings"])
            cash         = port["cash"]
            realized_pnl = port["realized_pnl"] if "realized_pnl" in port.keys() else 0.0
            trade_pnl    = 0.0

            if req.side == "BUY":
                if cash < tv:
                    raise HTTPException(400, f"Insufficient funds — need ${tv:.2f}, have ${cash:.2f}")
                cash = round(cash - tv, 2)
                if req.symbol not in holdings:
                    holdings[req.symbol] = {"quantity": 0, "avg_price": 0.0}
                h  = holdings[req.symbol]
                ts = h["quantity"] + req.quantity
                h["avg_price"] = round(((h["avg_price"] * h["quantity"]) + tv) / ts, 4)
                h["quantity"]  = ts
                if req.stop_loss or req.take_profit:
                    conn.execute(
                        "INSERT INTO active_orders VALUES (?,?,?,?,?,?,?,?)",
                        (str(uuid.uuid4()), req.user_id, req.symbol, "BUY",
                         req.quantity, ep, req.stop_loss, req.take_profit)
                    )

            elif req.side == "SELL":
                have = holdings.get(req.symbol, {}).get("quantity", 0)
                if have < req.quantity:
                    raise HTTPException(400, f"Insufficient shares — have {have}, selling {req.quantity}")
                avg_cost      = holdings[req.symbol]["avg_price"]
                buy_cost      = round(avg_cost * req.quantity, 2)
                trade_pnl     = round(tv - buy_cost, 2)
                realized_pnl  = round(realized_pnl + trade_pnl, 2)
                holdings[req.symbol]["quantity"] -= req.quantity
                cash = round(cash + tv, 2)
                if holdings[req.symbol]["quantity"] == 0:
                    del holdings[req.symbol]
                    conn.execute(
                        "DELETE FROM active_orders WHERE user_id=? AND symbol=?",
                        (req.user_id, req.symbol)
                    )

            conn.execute(
                "UPDATE portfolios SET cash=?, holdings=?, realized_pnl=? WHERE user_id=?",
                (cash, json.dumps(holdings), realized_pnl, req.user_id)
            )

            order_id = str(uuid.uuid4())
            ts_now   = datetime.now().isoformat()
            conn.execute(
                "INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (order_id, req.user_id, req.symbol, req.side, req.quantity,
                 round(ep, 2), tv, req.order_type, "FILLED",
                 req.stop_loss, req.take_profit, trade_pnl, ts_now)
            )
            conn.commit()
            print(f"[ORDER] {req.side} {req.quantity}x {req.symbol} @ ${ep:.2f}  PnL=${trade_pnl:.2f}")

            return {
                "id": order_id, "symbol": req.symbol, "side": req.side,
                "quantity": req.quantity, "price": round(ep, 2), "total": tv,
                "type": req.order_type, "status": "FILLED",
                "stop_loss": req.stop_loss, "take_profit": req.take_profit,
                "realized_pnl": trade_pnl, "timestamp": ts_now,
            }
        except HTTPException:
            raise
        except Exception as e:
            conn.rollback()
            print(f"[ORDER ERROR] {e}")
            raise HTTPException(500, f"Order error: {str(e)}")
        finally:
            conn.close()


@router.post("/orders/modify")
def modify_order(req: ModifyOrderRequest):
    with db_lock:
        conn = get_db()
        try:
            o = conn.execute(
                "SELECT * FROM active_orders WHERE id=? AND user_id=?",
                (req.order_id, req.user_id)
            ).fetchone()
            if not o:
                raise HTTPException(404, "Active order not found")
            conn.execute(
                "UPDATE active_orders SET sl=?, tp=? WHERE id=?",
                (req.stop_loss, req.take_profit, req.order_id)
            )
            conn.commit()
            return {"message": "Modified"}
        finally:
            conn.close()


@router.delete("/orders/cancel/{user_id}/{order_id}")
def cancel_active_order(user_id: str, order_id: str):
    with db_lock:
        conn = get_db()
        try:
            o = conn.execute(
                "SELECT id FROM active_orders WHERE id=? AND user_id=?",
                (order_id, user_id)
            ).fetchone()
            if not o:
                raise HTTPException(404, "Order not found")
            conn.execute("DELETE FROM active_orders WHERE id=? AND user_id=?", (order_id, user_id))
            conn.commit()
            return {"message": "Cancelled"}
        finally:
            conn.close()


@router.get("/orders/active/{user_id}")
def get_active_orders(user_id: str):
    with db_lock:
        conn = get_db()
        try:
            rows = conn.execute("SELECT * FROM active_orders WHERE user_id=?", (user_id,)).fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()


@router.get("/orders/{user_id}")
def get_orders(user_id: str):
    with db_lock:
        conn = get_db()
        try:
            rows = conn.execute(
                "SELECT * FROM orders WHERE user_id=? ORDER BY timestamp DESC",
                (user_id,)
            ).fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()
