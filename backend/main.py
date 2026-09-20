import app.config  # noqa: F401 - triggers load_dotenv() before other modules read env vars
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.routers import scan, auth, fix
from app.db import init_db

app = FastAPI(title="Vibe Coder Reviewer API")

init_db()

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "dev-secret-change-me"),
    same_site="lax",
    https_only=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)
app.include_router(auth.router)
app.include_router(fix.router)

@app.get("/health")
def health():
    return {"status": "ok"}