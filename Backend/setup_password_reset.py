"""Cho phép dùng lệnh cũ: python setup_password_reset.py."""
from app.core.database import engine
from app.models.entities import PasswordResetCode

if __name__ == "__main__":
    PasswordResetCode.__table__.create(bind=engine, checkfirst=True)
    print("OK: Bang password_reset_codes da san sang.")
