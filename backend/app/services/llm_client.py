import json
import uuid
from groq import Groq
from app.config import GROQ_API_KEY, GROQ_MODEL
from app.services.detectors.base import RawHit
from app.models.schemas import Finding

client = Groq(api_key=GROQ_API_KEY)

EXPLAIN_SYSTEM_PROMPT = """You are a security auditor explaining code flaws to NON-CODERS
(vibe coders who used AI to generate this code and don't read code themselves).

For each finding given, confirm if it's a real issue (drop obvious false positives),
set correct severity (low/medium/high/critical), and return ONLY a JSON array, no prose,
no markdown fences. Each item:
{
  "id": "<echo input id>",
  "is_real_issue": true/false,
  "severity": "low|medium|high|critical",
  "plain_explanation": "one jargon-free sentence on the risk",
  "example": "You do X, an attacker does Y, Z happens - concrete walkthrough",
  "how_to_fix": "plain instruction, no code",
  "fix_code_hint": "short code snippet showing the fix",
  "test_case": "a concrete, non-technical way to check the fix actually worked - e.g. what input to try and what should happen instead of the vulnerable behavior"
}
Drop items where is_real_issue is false from your output entirely."""


def explain_batch(hits: list[RawHit]) -> list[Finding]:
    """Batch 3-5 raw hits -> LLM confirms + explains. Call this in small batches,
    not one giant call, or context gets diluted and quality drops."""
    if not hits:
        return []

    payload = [
        {
            "id": str(uuid.uuid4())[:8],
            "category": h.category,
            "file_path": h.file_path,
            "line": h.line,
            "snippet": h.snippet,
            "severity_guess": h.severity,
        }
        for h in hits
    ]

    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": EXPLAIN_SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(payload)},
        ],
        temperature=0.2,
        max_tokens=2000,
    )

    raw = resp.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        print(f"[explain_batch] JSON PARSE FAILED. Raw response was:\n{raw[:500]}")
        return []

    print(f"[explain_batch] batch of {len(hits)} hits -> LLM returned {len(parsed)} confirmed items")

    id_to_hit = {p["id"]: h for p, h in zip(payload, hits)}
    findings = []
    for item in parsed:
        hit = id_to_hit.get(item.get("id"))
        if not hit:
            continue
        findings.append(
            Finding(
                id=item["id"],
                category=hit.category,
                severity=item.get("severity", hit.severity),
                file_path=hit.file_path,
                line=hit.line,
                plain_explanation=item.get("plain_explanation", ""),
                example=item.get("example", ""),
                how_to_fix=item.get("how_to_fix", ""),
                fix_code_hint=item.get("fix_code_hint"),
                test_case=item.get("test_case"),
                raw_snippet=hit.snippet,
            )
        )
    return findings


ROLE_SYSTEM_PROMPT = """Classify each source file's role in the app architecture.
Return ONLY a JSON array, no prose: [{"path": "...", "role": "frontend|backend-api|auth|db|config|other"}]"""


ROLE_BATCH_SIZE = 40


def tag_file_roles(file_paths: list[str]) -> dict[str, str]:
    if not file_paths:
        return {}
    roles: dict[str, str] = {}
    for i in range(0, len(file_paths), ROLE_BATCH_SIZE):
        batch = file_paths[i : i + ROLE_BATCH_SIZE]
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": ROLE_SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(batch)},
            ],
            temperature=0,
            max_tokens=4000,
        )
        raw = resp.choices[0].message.content.strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            parsed = json.loads(raw)
            roles.update({item["path"]: item["role"] for item in parsed})
        except (json.JSONDecodeError, KeyError):
            roles.update({p: "other" for p in batch})  # fail safe per-batch, not whole scan
    return roles

RECS_SYSTEM_PROMPT = """You suggest specific, ready-to-paste AI prompts that help a vibe coder
enhance their existing project inside tools like Lovable, Replit, or Bolt.

You'll get: a list of files with their architecture role, and the stated purpose of the project
(business, project/portfolio, entertainment, or other - may be missing).

Return ONLY a JSON array of 4-6 strings, no prose, no markdown fences. Each string is a complete,
specific prompt the user could paste directly into their AI coding tool - not generic advice.
Tailor prompts to the actual roles present (e.g. if there's an auth file, suggest a prompt about
adding password reset; if it's a business/commerce purpose, suggest a prompt about adding payment
receipts or admin analytics). If purpose is missing, keep prompts general-purpose but still specific
to the files given."""


def generate_recommendations(files: list, purpose: str | None) -> list[str]:
    if not files:
        return []

    file_summary = [{"path": f.path, "role": f.role} for f in files]
    user_content = json.dumps({"purpose": purpose or "not specified", "files": file_summary})

    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": RECS_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        temperature=0.5,
        max_tokens=1000,
    )

    raw = resp.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        parsed = json.loads(raw)
        return [str(p) for p in parsed][:6]
    except json.JSONDecodeError:
        print(f"[generate_recommendations] JSON PARSE FAILED. Raw response was:\n{raw[:500]}")
        return []
    
FIX_FILE_SYSTEM_PROMPT = """You are a security engineer. You will receive the FULL current content of a
source file and a description of one specific security flaw in it. Rewrite the ENTIRE file with ONLY
that flaw fixed - preserve all other code, formatting, comments, and behavior exactly as-is.

Return ONLY the complete corrected file content, no prose, no markdown fences, no explanations.
Do not truncate the file. Do not add comments about what you changed."""


def generate_fixed_file(full_file_content: str, category: str, plain_explanation: str, how_to_fix: str, raw_snippet: str) -> str:
    user_content = (
        f"CATEGORY: {category}\n"
        f"ISSUE: {plain_explanation}\n"
        f"HOW TO FIX: {how_to_fix}\n"
        f"VULNERABLE LINE(S): {raw_snippet}\n\n"
        f"FULL FILE CONTENT:\n{full_file_content}"
    )

    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": FIX_FILE_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        temperature=0,
        max_tokens=8000,
    )

    raw = resp.choices[0].message.content.strip()
    raw = raw.removeprefix("```python").removeprefix("```javascript").removeprefix("```typescript").removeprefix("```json").removeprefix("```")
    raw = raw.removesuffix("```").strip()
    return raw