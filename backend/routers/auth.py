import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db.database import get_db, db_lock

router = APIRouter(prefix="/api", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(req: RegisterRequest):
    with db_lock:
        conn = get_db()
        try:
            if conn.execute("SELECT id FROM users WHERE email=?", (req.email,)).fetchone():
                raise HTTPException(400, "Email already registered")
            uid    = str(uuid.uuid4())
            joined = datetime.now().isoformat()
            conn.execute("INSERT INTO users VALUES (?,?,?,?,?)",
                         (uid, req.username, req.email, req.password, joined))
            conn.execute("INSERT INTO portfolios VALUES (?,?,?,?)", (uid, 100000.0, "{}", 0.0))
            conn.commit()
        finally:
            conn.close()
    return {"user_id": uid, "username": req.username, "joined": joined, "is_new": True}


@router.post("/login")
def login(req: LoginRequest):
    with db_lock:
        conn = get_db()
        try:
            user = conn.execute(
                "SELECT * FROM users WHERE email=? AND password=?",
                (req.email, req.password)
            ).fetchone()
            if not user:
                raise HTTPException(401, "Invalid email or password")
            return {
                "user_id":  user["id"],
                "username": user["username"],
                "joined":   user["joined"],
                "is_new":   False,
            }
        finally:
            conn.close()
