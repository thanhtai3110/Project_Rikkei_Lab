from fastapi import Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import cast, or_, select, String, delete
from sqlalchemy.exc import IntegrityError
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from app.core.database import get_db
from app.models.entities import Application, Job, User, SavedJob, PasswordResetCode
from app.schemas.contracts import *
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.dependencies import create_access_token, get_current_user, get_current_candidate, get_current_recruiter, get_current_admin
from fastapi import APIRouter

router = APIRouter()

@router.get(
    "/api/admin/jobs/pending",
    response_model=list[JobResponse],
)
def get_pending_jobs(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
) -> list[Job]:
    statement = (
        select(Job)
        .where(Job.status == "pending")
        .order_by(Job.date.asc(), Job.job_id.asc())
    )
    return db.execute(statement).scalars().all()


@router.patch(
    "/api/admin/jobs/{id}/approve",
    response_model=JobResponse,
)
def approve_job(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
) -> Job:
    job = db.execute(
        select(Job).where(Job.job_id == id)
    ).scalar_one_or_none()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tin tuyển dụng"
        )

    if job.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="Chỉ có thể duyệt tin đang chờ xét duyệt"
        )

    job.status = "approved"
    job.open = True
    db.commit()
    db.refresh(job)
    return job


@router.get('/api/admin/users', response_model=list[AdminUserResponse], tags=['Admin'])
def admin_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[User]:
    # Chỉ Admin có JWT hợp lệ mới xem được tài khoản. Không trả mật khẩu.
    statement = select(User).order_by(User.user_id.desc())
    return list(db.execute(statement).scalars().all())


@router.patch('/api/admin/users/{user_id}/status', response_model=AdminUserResponse, tags=['Admin'])
def admin_change_user_status(
    user_id: int,
    data: AdminUserStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> User:
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail='Không tìm thấy tài khoản')
    # Không được khóa chính mình hay tài khoản Admin khác.
    if target.role == 'admin' or target.user_id == admin.user_id:
        raise HTTPException(status_code=403, detail='Không được thay đổi trạng thái tài khoản Admin')
    target.status = data.status
    try:
        db.commit()
        db.refresh(target)
    except Exception:
        db.rollback()
        raise
    return target


@router.delete('/api/admin/users/{user_id}', tags=['Admin'])
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail='Không tìm thấy tài khoản')
    if target.role == 'admin' or target.user_id == admin.user_id:
        raise HTTPException(status_code=403, detail='Không được xóa tài khoản Admin')

    # Giải quyết khóa ngoại theo thứ tự: các đơn & tin lưu, tin đăng, tài khoản.
    # Việc xóa diễn ra trong một giao dịch; có lỗi sẽ rollback.
    try:
        if target.role == 'recruiter':
            job_ids = select(Job.job_id).where(Job.recruiter_id == user_id)
            db.execute(delete(Application).where(Application.job_id.in_(job_ids)))
            db.execute(delete(SavedJob).where(SavedJob.job_id.in_(job_ids)))
            db.execute(delete(Job).where(Job.recruiter_id == user_id))
        db.execute(delete(Application).where(Application.candidate_id == user_id))
        db.execute(delete(SavedJob).where(SavedJob.candidate_id == user_id))
        db.delete(target)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail='Không thể xóa tài khoản vì còn dữ liệu tham chiếu')
    except Exception:
        db.rollback()
        raise
    return {'message': 'Đã xóa tài khoản và dữ liệu liên quan', 'user_id': user_id}


@router.patch('/api/admin/jobs/{id}/reject',response_model=JobResponse)
def reject_job(id:int,db:Session=Depends(get_db),user:User=Depends(get_current_admin)):
    job=db.get(Job,id)
    if not job or job.status!='pending':raise HTTPException(409,'Chỉ từ chối được tin chờ duyệt')
    job.status='rejected';job.open=False;db.commit();db.refresh(job);return job


@router.get('/api/admin/jobs',response_model=list[JobResponse])
def admin_all_jobs(db:Session=Depends(get_db),user:User=Depends(get_current_admin)):
    return db.execute(select(Job).order_by(Job.job_id.desc())).scalars().all()


