import base64
import re
import time
import httpx

GITHUB_API = "https://api.github.com"


def parse_owner_repo(repo_url: str) -> tuple[str, str]:
    match = re.search(r"github\.com[/:]([^/]+)/([^/.]+)", repo_url)
    if not match:
        raise ValueError(f"could not parse owner/repo from {repo_url}")
    return match.group(1), match.group(2)


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }


async def get_default_branch(client: httpx.AsyncClient, owner: str, repo: str, token: str) -> str:
    res = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=_headers(token))
    res.raise_for_status()
    return res.json()["default_branch"]


async def get_file(client: httpx.AsyncClient, owner: str, repo: str, path: str, branch: str, token: str) -> tuple[str, str]:
    """Returns (decoded_content, sha)."""
    res = await client.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
        params={"ref": branch},
        headers=_headers(token),
    )
    res.raise_for_status()
    data = res.json()
    content = base64.b64decode(data["content"]).decode("utf-8")
    return content, data["sha"]


async def get_branch_sha(client: httpx.AsyncClient, owner: str, repo: str, branch: str, token: str) -> str:
    res = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}/git/ref/heads/{branch}", headers=_headers(token))
    res.raise_for_status()
    return res.json()["object"]["sha"]


async def create_branch(client: httpx.AsyncClient, owner: str, repo: str, new_branch: str, from_sha: str, token: str) -> None:
    res = await client.post(
        f"{GITHUB_API}/repos/{owner}/{repo}/git/refs",
        headers=_headers(token),
        json={"ref": f"refs/heads/{new_branch}", "sha": from_sha},
    )
    res.raise_for_status()


async def update_file(
    client: httpx.AsyncClient, owner: str, repo: str, path: str, new_content: str, sha: str, branch: str, message: str, token: str
) -> None:
    res = await client.put(
        f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
        headers=_headers(token),
        json={
            "message": message,
            "content": base64.b64encode(new_content.encode("utf-8")).decode("utf-8"),
            "sha": sha,
            "branch": branch,
        },
    )
    res.raise_for_status()


async def create_pull_request(
    client: httpx.AsyncClient, owner: str, repo: str, head: str, base: str, title: str, body: str, token: str
) -> str:
    res = await client.post(
        f"{GITHUB_API}/repos/{owner}/{repo}/pulls",
        headers=_headers(token),
        json={"title": title, "head": head, "base": base, "body": body},
    )
    res.raise_for_status()
    return res.json()["html_url"]


async def apply_fix_as_pr(
    repo_url: str, file_path: str, new_content: str, category: str, plain_explanation: str, token: str
) -> str:
    owner, repo = parse_owner_repo(repo_url)
    branch_name = f"vibe-reviewer-fix-{category}-{int(time.time())}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        default_branch = await get_default_branch(client, owner, repo, token)
        _, sha = await get_file(client, owner, repo, file_path, default_branch, token)
        base_sha = await get_branch_sha(client, owner, repo, default_branch, token)
        await create_branch(client, owner, repo, branch_name, base_sha, token)
        await update_file(
            client, owner, repo, file_path, new_content, sha, branch_name,
            message=f"Fix: {category} in {file_path}", token=token,
        )
        pr_url = await create_pull_request(
            client, owner, repo, head=branch_name, base=default_branch,
            title=f"Security fix: {category.replace('_', ' ')} in {file_path}",
            body=f"Automated fix suggested by Vibe Coder Reviewer.\n\n**Issue:** {plain_explanation}",
            token=token,
        )
    return pr_url