from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import init_db
from services.market_data import init_prices
from routers import auth, market, orders, portfolio, learn, websocket

app = FastAPI(title="TradeVission API")
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://tradevission-project-production.up.railway.app",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(market.router)
app.include_router(orders.router)
app.include_router(portfolio.router)
app.include_router(learn.router)
app.include_router(websocket.router)

init_db()
init_prices()
