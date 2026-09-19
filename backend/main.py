from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import scan

app = FastAPI(title="Vibe Coder Reviewer API")

# open CORS for hackathon demo - tighten origin list if you have time left
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)


@app.get("/health")
def health():
    return {"status": "ok"}
