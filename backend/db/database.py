import sqlite3
import threading

DB_FILE = "tradevission.db"
db_lock = threading.Lock()


def get_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db_lock:
        conn = get_db()
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                joined TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS portfolios (
                user_id TEXT PRIMARY KEY,
                cash REAL NOT NULL DEFAULT 100000.0,
                holdings TEXT NOT NULL DEFAULT '{}',
                realized_pnl REAL NOT NULL DEFAULT 0.0
            );
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                symbol TEXT NOT NULL,
                side TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                total REAL NOT NULL,
                order_type TEXT NOT NULL,
                status TEXT NOT NULL,
                stop_loss REAL,
                take_profit REAL,
                realized_pnl REAL DEFAULT 0.0,
                timestamp TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS active_orders (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                symbol TEXT NOT NULL,
                side TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                entry_price REAL NOT NULL,
                sl REAL,
                tp REAL
            );
        """)
        for migration in [
            "ALTER TABLE portfolios ADD COLUMN realized_pnl REAL NOT NULL DEFAULT 0.0",
            "ALTER TABLE orders ADD COLUMN realized_pnl REAL DEFAULT 0.0",
        ]:
            try:
                conn.execute(migration)
            except Exception:
                pass
        conn.commit()
        conn.close()
        print(f"[DB] SQLite ready: {DB_FILE}")
