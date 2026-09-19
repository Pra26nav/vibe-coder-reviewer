import os
from pathlib import Path
from dotenv import load_dotenv

# explicit path, not implicit cwd search
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
MAX_FILES = int(os.getenv("MAX_FILES", "150"))

ALLOWED_EXTENSIONS = {".py", ".js", ".ts", ".jsx", ".tsx", ".env", ".yaml", ".yml", ".json"}
SKIP_DIRS = {"node_modules", ".git", "venv", ".venv", "dist", "build", "__pycache__"}

import tempfile
WORK_DIR = Path(tempfile.gettempdir()) / "vibe_reviewer_jobs"
WORK_DIR.mkdir(parents=True, exist_ok=True)