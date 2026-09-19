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
  "fix_code_hint": "short code snippet showing the fix"
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