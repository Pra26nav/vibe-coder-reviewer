import re
from pathlib import Path
from app.services.detectors.base import Detector, RawHit

# string-concat / f-string SQL, no parameterization
PATTERNS = [
    re.compile(r"(execute|executemany)\s*\(\s*f[\"']"),
    re.compile(r"(SELECT|INSERT|UPDATE|DELETE)\b.*[\"']\s*\+\s*\w+", re.IGNORECASE),
    re.compile(r"(SELECT|INSERT|UPDATE|DELETE)\b.*%s?\s*%\s*\(", re.IGNORECASE),
    re.compile(r"query\s*=\s*[\"'].*\{.*\}.*[\"']"),  # f-string style templated query
]


class SqlInjectionDetector(Detector):
    category = "sql_injection"

    def scan(self, file_path: Path, content: str) -> list[RawHit]:
        hits = []
        lines = content.splitlines()
        for i, line in enumerate(lines, start=1):
            for pattern in PATTERNS:
                if pattern.search(line):
                    hits.append(RawHit(self.category, str(file_path), i, line.strip(), "high"))
        return hits
