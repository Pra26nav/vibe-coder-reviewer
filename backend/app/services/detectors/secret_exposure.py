import re
from pathlib import Path
from app.services.detectors.base import Detector, RawHit

PATTERNS = [
    (re.compile(r"AKIA[0-9A-Z]{16}"), "critical"),  # AWS key
    (re.compile(r"sk-[a-zA-Z0-9]{20,}"), "critical"),  # OpenAI/Groq-style key
    (re.compile(r"gh[pousr]_[A-Za-z0-9]{36,}"), "critical"),  # GitHub token
    (re.compile(r"(api_key|apikey|secret_key|access_token)\s*=\s*[\"'][^\"']{10,}[\"']", re.IGNORECASE), "high"),
    (re.compile(r"(password|passwd)\s*=\s*[\"'][^\"']{4,}[\"']", re.IGNORECASE), "high"),
    (re.compile(r"mongodb(\+srv)?://[^\s\"']+:[^\s\"']+@"), "critical"),  # creds in connection string
]


class SecretExposureDetector(Detector):
    category = "secret_exposure"

    def scan(self, file_path: Path, content: str) -> list[RawHit]:
        hits = []
        lines = content.splitlines()
        for i, line in enumerate(lines, start=1):
            for pattern, severity in PATTERNS:
                if pattern.search(line):
                    hits.append(RawHit(self.category, str(file_path), i, line.strip(), severity))
        return hits
