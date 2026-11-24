"""FastAPI application factory/entry point. Routes giữ nguyên URL cũ."""
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routers import auth, candidate, recruiter, jobs, admin, system
from app.services.password_reset import router as password_reset_router

app = FastAPI(title="JobConnect Python API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:5501", "http://localhost:5501"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

for module in (auth, candidate, recruiter, jobs, admin, system):
    app.include_router(module.router)
app.include_router(password_reset_router)

FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"

# API phải được đăng ký trước static mount.
@app.get("/index.html", include_in_schema=False)
@app.get("/", include_in_schema=False)
def home():
    return FileResponse(FRONTEND_DIR / "index.html", headers={"Cache-Control": "no-cache"})

app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
