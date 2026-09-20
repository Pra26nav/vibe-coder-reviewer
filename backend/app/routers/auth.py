import os
import httpx
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
from app.db import upsert_user, get_user, get_user_scans
from app.db import upsert_user, get_user

router = APIRouter(prefix="/auth", tags=["auth"])

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@router.get("/github/login")
def github_login():
    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        "&scope=repo"
        "&redirect_uri=http://localhost:8000/auth/github/callback"
    )
    return RedirectResponse(url)


@router.get("/github/callback")
async def github_callback(request: Request, code: str):
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse(f"{FRONTEND_URL}/?auth_error=1")

        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        gh_user = user_res.json()

    user_id = upsert_user(
        github_id=gh_user["id"],
        username=gh_user["login"],
        avatar_url=gh_user.get("avatar_url", ""),
        access_token=access_token,
    )

    request.session["user_id"] = user_id
    return RedirectResponse(FRONTEND_URL)


@router.get("/me")
def me(request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        return JSONResponse({"user": None})
    user = get_user(user_id)
    if not user:
        return JSONResponse({"user": None})
    return JSONResponse({
        "user": {
            "id": user["id"],
            "username": user["username"],
            "avatar_url": user["avatar_url"],
        }
    })


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return JSONResponse({"ok": True})

@router.get("/scans")
def scan_history(request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        return JSONResponse({"scans": []})
    return JSONResponse({"scans": get_user_scans(user_id)})