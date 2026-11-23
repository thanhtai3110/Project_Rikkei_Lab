"""Khôi phục mật khẩu qua mã email, dùng FastAPI + MySQL.
Cấu hình SMTP_* trong Backend/.env. KHÔNG trả mã qua API hoặc log.
"""
import hashlib
import logging
import os
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
import bcrypt

from app.core.config import SECRET_KEY
from app.core.database import get_db
from app.models.entities import User, PasswordResetCode

router = APIRouter(prefix='/auth', tags=['Khôi phục mật khẩu'])
logger = logging.getLogger(__name__)
CODE_LIFETIME_MINUTES = 10
REQUEST_COOLDOWN_SECONDS = 60
MAX_ATTEMPTS = 5


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r'^\d{6}$')
    new_password: str = Field(min_length=8)


def utc_now():
    # MySQL DATETIME không lưu múi giờ, sử dụng UTC nhất quán.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def hash_code(user_id: int, code: str) -> str:
    data = f'{user_id}:{code}:{SECRET_KEY}'.encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def send_email(to_email: str, code: str):
    host = os.getenv('SMTP_HOST', '').strip()
    port = int(os.getenv('SMTP_PORT', '587'))
    username = os.getenv('SMTP_USER', '').strip()
    password = os.getenv('SMTP_PASSWORD', '').strip().replace(' ', '')
    sender = os.getenv('SMTP_FROM', '').strip() or username
    if not all([host, username, password, sender]):
        raise RuntimeError('SMTP_NOT_CONFIGURED')
    msg = EmailMessage()
    msg['Subject'] = 'JobConnect - Mã xác minh đặt lại mật khẩu'
    msg['From'] = sender
    msg['To'] = to_email
    msg.set_content(
        f'Xin chào,\n\nMã xác minh đặt lại mật khẩu JobConnect của bạn: {code}\n\n'
        f'Mã chỉ có hiệu lực {CODE_LIFETIME_MINUTES} phút và sử dụng một lần.\n'
        'Nếu bạn không yêu cầu, hãy bỏ qua email này. Không chia sẻ mã với bất kỳ ai.\n\nJobConnect'
    )
    if port == 465:
        with smtplib.SMTP_SSL(host, port, timeout=12) as smtp:
            smtp.login(username, password)
            smtp.send_message(msg)
    else:
        with smtplib.SMTP(host, port, timeout=12) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(username, password)
            smtp.send_message(msg)


@router.post('/forgot-password')
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Phản hồi chung không tiết lộ email đã đăng ký hay chưa.
    generic = {'message': 'Nếu email có tài khoản, mã xác minh đã được gửi. Vui lòng kiểm tra hộp thư và Spam.'}
    user = db.execute(select(User).where(User.email == str(data.email))).scalar_one_or_none()
    if user is None:
        return generic

    now = utc_now()
    existing = db.get(PasswordResetCode, user.user_id)
    if existing and (now - existing.created_at).total_seconds() < REQUEST_COOLDOWN_SECONDS:
        # Giữ phản hồi chung trong thời gian giới hạn yêu cầu.
        return generic

    code = f'{secrets.randbelow(1000000):06d}'
    # Gửi email trước, sau đó mới lưu dấu băm để tránh mã vô dụng khi SMTP lỗi.
    try:
        send_email(user.email, code)
    except RuntimeError as error:
        if str(error) == 'SMTP_NOT_CONFIGURED':
            raise HTTPException(status_code=503, detail='Chưa cấu hình email SMTP trên máy chủ. Hãy xem HUONG_DAN_QUEN_MAT_KHAU.md.')
        raise HTTPException(status_code=503, detail='Không gửi được email. Vui lòng thử lại sau.')
    except (smtplib.SMTPException, OSError, ValueError):
        logger.exception('Không gửi được email khôi phục mật khẩu')
        raise HTTPException(status_code=503, detail='Không gửi được email. Kiểm tra SMTP rồi thử lại.')

    if existing is None:
        existing = PasswordResetCode(user_id=user.user_id)
        db.add(existing)
    existing.code_hash = hash_code(user.user_id, code)
    existing.created_at = now
    existing.expires_at = now + timedelta(minutes=CODE_LIFETIME_MINUTES)
    existing.attempts = 0
    db.commit()
    return generic


@router.post('/reset-password')
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    invalid = HTTPException(status_code=400, detail='Mã xác minh không đúng hoặc đã hết hạn.')
    user = db.execute(select(User).where(User.email == str(data.email))).scalar_one_or_none()
    if user is None:
        raise invalid
    row = db.get(PasswordResetCode, user.user_id)
    now = utc_now()
    if row is None or row.expires_at < now or row.attempts >= MAX_ATTEMPTS:
        raise invalid
    if not secrets.compare_digest(row.code_hash, hash_code(user.user_id, data.code)):
        row.attempts += 1
        db.commit()
        raise invalid
    user.password = bcrypt.hashpw(data.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.delete(row)  # Mã chỉ dùng một lần.
    db.commit()
    return {'message': 'Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.'}
