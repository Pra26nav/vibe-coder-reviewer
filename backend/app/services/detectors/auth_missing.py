import re
from pathlib import Path
from app.services.detectors.base import Detector, RawHit

# route decorators across common frameworks
ROUTE_DECORATOR = re.compile(
    r"@(app|router)\.(get|post|put|delete|patch)\(|@app\.route\("
)
AUTH_HINTS = re.compile(
    r"(login_required|Depends\(get_current_user\)|require_auth|jwt_required|"
    r"@authenticated|verify_token|check_auth|is_authenticated)",
    re.IGNORECASE,
)
SENSITIVE_PATH_HINT = re.compile(
    r"(delete|update|admin|profile|account|payment|settings|user)", re.IGNORECASE
)

# regex catches CANDIDATES only. LLM confirms - this category has high false-positive
# rate on plain regex (e.g. public routes are meant to be open).
LOOKAHEAD_LINES = 5


class AuthMissingDetector(Detector):
    category = "auth_missing"

    def scan(self, file_path: Path, content: str) -> list[RawHit]:
        hits = []
        lines = content.splitlines()
        for i, line in enumerate(lines):
            if ROUTE_DECORATOR.search(line) and SENSITIVE_PATH_HINT.search(line):
                window = "\n".join(lines[i : i + LOOKAHEAD_LINES])
                if not AUTH_HINTS.search(window):
                    hits.append(
                        RawHit(self.category, str(file_path), i + 1, line.strip(), "high")
                    )
        return hits
