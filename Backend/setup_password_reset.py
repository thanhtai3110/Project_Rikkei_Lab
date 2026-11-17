"""Tao RIENG bang ma khoi phuc mat khau neu chua co. Khong xoa bang/du lieu cu."""
from database import engine
from models import PasswordResetCode

if __name__ == '__main__':
    PasswordResetCode.__table__.create(bind=engine, checkfirst=True)
    print('OK: Bang password_reset_codes da san sang (khong xoa du lieu cu).')
