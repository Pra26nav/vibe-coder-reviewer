import re
from pathlib import Path
from app.services.detectors.base import Detector, RawHit

PATTERNS = [
    (re.compile(r"open\([^)]*request\.(GET|POST|args|form|files)"), "high"),  # unsanitized path from user input
    (re.compile(r"\.\./"), "medium"),  # literal traversal seq in code (rare true positive but cheap flag)
    (re.compile(r"pickle\.load\("), "critical"),  # unsafe deserialization
    (re.compile(r"yaml\.load\((?!.*Loader=yaml\.SafeLoader)"), "high"),
    (re.compile(r"send_file\([^)]*request\."), "high"),
    (re.compile(r"os\.path\.join\([^)]*request\."), "medium"),
]


class InsecureFileHandlingDetector(Detector):
    category = "insecure_file_handling"

    def scan(self, file_path: Path, content: str) -> list[RawHit]:
        hits = []
        lines = content.splitlines()
        for i, line in enumerate(lines, start=1):
            for pattern, severity in PATTERNS:
                if pattern.search(line):
                    hits.append(RawHit(self.category, str(file_path), i, line.strip(), severity))
        return hits
