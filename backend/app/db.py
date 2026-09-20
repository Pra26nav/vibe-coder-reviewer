import sqlite3
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(__file__).parent.parent / "vibe_reviewer.db"


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                github_id INTEGER UNIQUE NOT NULL,
                username TEXT NOT NULL,
                avatar_url TEXT,
                access_token TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                repo_url TEXT,
                score REAL,
                verdict TEXT,
                findings_count INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.commit()


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def upsert_user(github_id: int, username: str, avatar_url: str, access_token: str) -> int:
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO users (github_id, username, avatar_url, access_token)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(github_id) DO UPDATE SET
                 username=excluded.username,
                 avatar_url=excluded.avatar_url,
                 access_token=excluded.access_token""",
            (github_id, username, avatar_url, access_token),
        )
        conn.commit()
        row = conn.execute("SELECT id FROM users WHERE github_id = ?", (github_id,)).fetchone()
        return row["id"]


def get_user(user_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None


def save_scan(scan_id: str, user_id: int | None, repo_url: str, score: float, verdict: str, findings_count: int):
    with get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO scans (id, user_id, repo_url, score, verdict, findings_count) VALUES (?, ?, ?, ?, ?, ?)",
            (scan_id, user_id, repo_url, score, verdict, findings_count),
        )
        conn.commit()


def get_user_scans(user_id: int):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM scans WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
        ).fetchall()
        return [dict(r) for r in rows]