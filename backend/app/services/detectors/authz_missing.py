import re
from pathlib import Path
from app.services.detectors.base import Detector, RawHit

# routes that take an id param (user-scoped resource) - candidate for IDOR
ID_PARAM_ROUTE = re.compile(
    r"@(app|router)\.(get|put|delete|patch)\([\"'][^\"']*\{?\w*_?id\}?[^\"']*[\"']"
)
OWNERSHIP_HINT = re.compile(
    r"(current_user\.id\s*==|owner_id\s*==|user_id\s*==\s*current_user|\.filter_by\(user_id=|"
    r"if\s+\w+\.user\s*!=\s*current_user)",
    re.IGNORECASE,
)
LOOKAHEAD_LINES = 8


class AuthzMissingDetector(Detector):
    category = "authz_missing"

    def scan(self, file_path: Path, content: str) -> list[RawHit]:
        hits = []
        lines = content.splitlines()
        for i, line in enumerate(lines):
            if ID_PARAM_ROUTE.search(line):
                window = "\n".join(lines[i : i + LOOKAHEAD_LINES])
                if not OWNERSHIP_HINT.search(window):
                    hits.append(
                        RawHit(self.category, str(file_path), i + 1, line.strip(), "critical")
                    )
        return hits
