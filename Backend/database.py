"""Tương thích với lệnh kiểm tra MySQL trước khi chia thư mục."""
from app.core.database import DATABASE_URL, engine, SessionLocal, Base, get_db
