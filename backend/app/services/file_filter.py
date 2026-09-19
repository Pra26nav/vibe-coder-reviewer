from pathlib import Path
from app.config import ALLOWED_EXTENSIONS, SKIP_DIRS, MAX_FILES

PRIORITY_HINTS = ("api", "auth", "route", "middleware", "server", "backend", "controller", "db", "prisma", "model")


def collect_files(root: Path) -> list[Path]:
    all_files: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix not in ALLOWED_EXTENSIONS and path.name != ".env":
            continue
        all_files.append(path)

    def priority(p: Path) -> int:
        s = str(p).lower()
        return 0 if any(hint in s for hint in PRIORITY_HINTS) else 1

    all_files.sort(key=priority)
    return all_files[:MAX_FILES]


def read_file_safe(path: Path, max_bytes: int = 50_000) -> str:
    try:
        data = path.read_bytes()[:max_bytes]
        return data.decode("utf-8", errors="ignore")
    except Exception:
        return ""