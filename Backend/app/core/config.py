import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BASE_DIR / ".env"

if not ENV_PATH.is_file():
    raise RuntimeError(
        "Khong tim thay file .env. "
        "Hay sao chep .env.example thanh .env trong thu muc Backend."
    )

load_dotenv(dotenv_path=ENV_PATH, override=True)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "Chua cau hinh DATABASE_URL trong file .env."
    )

if "MAT_KHAU_MYSQL" in DATABASE_URL:
    raise RuntimeError(
        "Hay thay MAT_KHAU_MYSQL bang mat khau MySQL cua ban trong file .env."
    )

SECRET_KEY = os.environ.get(
    "JOB_SECRET_KEY",
    "local-dev-only-change-before-deploy"
)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120
