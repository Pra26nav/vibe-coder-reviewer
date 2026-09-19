import re
from pathlib import Path
from app.services.detectors.base import Detector, RawHit

PATTERNS = [
    (re.compile(r"\beval\s*\("), "high"),
    (re.compile(r"\bexec\s*\("), "high"),
    (re.compile(r"subprocess\.(Popen|call|run)\([^)]*shell\s*=\s*True"), "critical"),
    (re.compile(r"os\.system\("), "high"),
    (re.compile(r"base64\.b64decode\("), "medium"),  # often paired w/ exec = obfuscation
    (re.compile(r"requests\.(post|get)\([^)]*(webhook|pastebin|discord\.com/api)"), "critical"),
]


class MaliciousCodeDetector(Detector):
    category = "malicious_code"

    def scan(self, file_path: Path, content: str) -> list[RawHit]:
        hits = []
        lines = content.splitlines()
        for i, line in enumerate(lines, start=1):
            for pattern, severity in PATTERNS:
                if pattern.search(line):
                    hits.append(RawHit(self.category, str(file_path), i, line.strip(), severity))
        return hits
