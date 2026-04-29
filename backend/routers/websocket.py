import json
import random
import asyncio
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from db.database import get_db, db_lock
from services.market_data import STOCKS, stock_prices, price_history
from services.sl_tp import check_sl_tp

router = APIRouter(tags=["websocket"])
connected_clients: list = []


@router.websocket("/ws/prices")
async def websocket_prices(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            updates = {}
            for sym in STOCKS:
                last      = price_history[sym][-1]["close"]
                new_price = max(round(last * (1 + random.gauss(0.00004, 0.0016)), 2), 1.0)
                stock_prices[sym] = new_price
                price_history[sym].append({
                    "time":   datetime.now().isoformat(),
                    "open":   last,
                    "high":   round(max(last, new_price) * random.uniform(1.0, 1.002), 2),
                    "low":    round(min(last, new_price) * random.uniform(0.998, 1.0), 2),
                    "close":  new_price,
                    "volume": random.randint(10000, 500000),
                })
                prev = price_history[sym][-3]["close"] if len(price_history[sym]) > 2 else last
                updates[sym] = {
                    "price":      new_price,
                    "change":     round(new_price - prev, 2),
                    "change_pct": round(((new_price - prev) / prev) * 100, 2),
                }

            
            sl_tp_hits = {}
            with db_lock:
                conn = get_db()
                try:
                    uids = [r[0] for r in conn.execute(
                        "SELECT DISTINCT user_id FROM active_orders"
                    ).fetchall()]
                finally:
                    conn.close()
            for uid in uids:
                hits = check_sl_tp(uid)
                if hits:
                    sl_tp_hits[uid] = hits

            payload = {"prices": updates}
            if sl_tp_hits:
                payload["sl_tp_triggered"] = sl_tp_hits
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(2)

    except (WebSocketDisconnect, Exception):
        if websocket in connected_clients:
            connected_clients.remove(websocket)
