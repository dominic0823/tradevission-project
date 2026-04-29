# TradeVission – Refactored Project

A paper-trading simulator with live charts, technical indicators, and portfolio management.

---

## Project Structure

```
tradevission/
├── backend/
│   ├── main.py                  ← FastAPI app entry point (start here)
│   ├── requirements.txt
│   ├── db/
│   │   └── database.py          ← SQLite connection, schema, migrations
│   ├── services/
│   │   ├── market_data.py       ← Stock definitions, price history generation
│   │   ├── indicators.py        ← SMA, EMA, RSI, MACD, Bollinger, etc.
│   │   └── sl_tp.py             ← Stop-loss / Take-profit auto-execution
│   └── routers/
│       ├── auth.py              ← POST /api/register, POST /api/login
│       ├── market.py            ← GET /api/stocks, GET /api/stocks/{symbol}/chart
│       ├── orders.py            ← POST/GET/DELETE /api/orders
│       ├── portfolio.py         ← GET /api/portfolio/{user_id}
│       ├── learn.py             ← GET /api/learn/indicators
│       └── websocket.py         ← WS /ws/prices (live price stream)
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx             ← React app entry
        ├── App.jsx              ← Router setup
        ├── index.css
        ├── components/
        │   └── Layout.jsx       ← Navigation sidebar + layout wrapper
        ├── pages/
        │   ├── AuthPage.jsx     ← Login / Register
        │   ├── DashboardPage.jsx
        │   ├── TradingPage.jsx  ← Chart + order panel
        │   ├── PortfolioPage.jsx
        │   ├── MarketPage.jsx
        │   └── LearnPage.jsx
        ├── hooks/
        │   └── useWebSocket.js  ← WebSocket hook for live prices
        ├── store/
        │   └── index.js         ← Zustand global state
        └── utils/
            └── api.js           ← Axios API helpers
```

---

## How to Run in VS Code

### 1. Backend

Open a terminal in VS Code and run:

```bash
# Navigate to backend
cd backend

# Create a virtual environment (first time only)
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be live at: **http://localhost:8000**
API docs (auto-generated): **http://localhost:8000/docs**

---

### 2. Frontend

Open a **second terminal** in VS Code:

```bash
# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
```

The app will open at: **http://localhost:5173**

---

## API Reference

| Method   | Endpoint                              | Description               |
|----------|---------------------------------------|---------------------------|
| POST     | `/api/register`                       | Create account            |
| POST     | `/api/login`                          | Login                     |
| GET      | `/api/stocks`                         | List all stocks           |
| GET      | `/api/stocks/{symbol}/chart?period=1M`| OHLCV + indicators        |
| GET      | `/api/market/overview`                | Top gainers/losers        |
| GET      | `/api/portfolio/{user_id}`            | Portfolio summary         |
| POST     | `/api/orders`                         | Place buy/sell order      |
| POST     | `/api/orders/modify`                  | Modify SL/TP              |
| DELETE   | `/api/orders/cancel/{user_id}/{id}`   | Cancel active order       |
| GET      | `/api/orders/{user_id}`               | Order history             |
| GET      | `/api/orders/active/{user_id}`        | Active orders (SL/TP)     |
| GET      | `/api/learn/indicators`               | Indicator guide           |
| WS       | `/ws/prices`                          | Live price stream (2s)    |

---

## What Changed in the Refactor

The original project had everything in a single `backend/main.py` (665 lines). It's now split by responsibility:

- **`db/database.py`** — all database setup in one place
- **`services/market_data.py`** — stock data, price history, candle aggregation
- **`services/indicators.py`** — every technical indicator as a clean function
- **`services/sl_tp.py`** — stop-loss/take-profit logic separated out
- **`routers/auth.py`** — only auth endpoints
- **`routers/market.py`** — only market/chart endpoints
- **`routers/orders.py`** — only order management
- **`routers/portfolio.py`** — only portfolio endpoint
- **`routers/learn.py`** — only the learn/indicators guide
- **`routers/websocket.py`** — only the WebSocket handler
- **`main.py`** — just wires everything together (20 lines)

The frontend is unchanged — it was already well-structured in separate page files.
