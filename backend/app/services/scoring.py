from app.models.schemas import Finding

SEVERITY_WEIGHT = {"low": 0.5, "medium": 1.0, "high": 2.0, "critical": 4.0}


def compute_score(findings: list[Finding], files_scanned: int) -> tuple[float, str]:
    """Deterministic, judge-defensible: 10 - severity_weighted(findings)/files_scanned.
    No LLM in this step - reproducible on re-run."""
    if files_scanned == 0:
        return 0.0, "No files scanned"

    weighted = sum(SEVERITY_WEIGHT.get(f.severity, 1.0) for f in findings)
    raw_score = 10 - (weighted / files_scanned)
    score = max(0.0, min(10.0, round(raw_score, 1)))

    if score >= 8:
        verdict = "Looks solid"
    elif score >= 6:
        verdict = "Minor concerns"
    elif score >= 4:
        verdict = "Needs attention"
    else:
        verdict = "High risk"

    return score, verdict
