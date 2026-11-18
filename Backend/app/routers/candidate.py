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
    "/candidate/profile",
    response_model=CandidateProfileResponse
)
def get_candidate_profile(
    user: User = Depends(get_current_candidate)
) -> User:
    return user


@router.patch(
    "/candidate/profile",
    response_model=CandidateProfileResponse
)
def update_candidate_profile(
    data: CandidateProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_candidate)
) -> User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.get('/api/saved')
def saved_jobs(db:Session=Depends(get_db), user:User=Depends(get_current_candidate)):
    return [x.job_id for x in db.execute(select(SavedJob).where(SavedJob.candidate_id==user.user_id)).scalars()]


@router.post('/api/saved/{id}')
def save_job(id:int,db:Session=Depends(get_db),user:User=Depends(get_current_candidate)):
    if not db.get(Job,id):raise HTTPException(404,'Tin tuyển dụng không tồn tại')
    if not db.execute(select(SavedJob).where(SavedJob.candidate_id==user.user_id,SavedJob.job_id==id)).scalar_one_or_none():
        db.add(SavedJob(candidate_id=user.user_id,job_id=id));db.commit()
    return {'saved':True}


@router.delete('/api/saved/{id}')
def remove_saved(id:int,db:Session=Depends(get_db),user:User=Depends(get_current_candidate)):
    row=db.execute(select(SavedJob).where(SavedJob.candidate_id==user.user_id,SavedJob.job_id==id)).scalar_one_or_none()
    if row:db.delete(row);db.commit()
    return {'saved':False}


@router.get(
    "/api/applications/my",
    response_model=list[ApplicationResponse],
)
def get_my_applications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_candidate),
) -> list[Application]:
    statement = (
        select(Application)
        .where(Application.candidate_id == user.user_id)
        .order_by(Application.applied_at.desc(), Application.application_id.desc())
    )
    return db.execute(statement).scalars().all()


@router.patch('/api/applications/{id}/withdraw')
def withdraw_app(id:int,db:Session=Depends(get_db),user:User=Depends(get_current_candidate)):
    app_row=db.get(Application,id)
    if not app_row:raise HTTPException(404,'Không tìm thấy đơn')
    if app_row.candidate_id!=user.user_id:raise HTTPException(403,'Không có quyền rút đơn')
    if app_row.status in ['approved','rejected','withdrawn']:raise HTTPException(409,'Đơn đã kết thúc')
    app_row.status='withdrawn';db.commit();return {'status':'withdrawn'}


@router.post(
    "/api/applications",
    status_code=201,
    response_model=ApplicationResponse,
)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_candidate),
) -> Application:
    job = db.execute(
        select(Job).where(Job.job_id == data.job_id)
    ).scalar_one_or_none()

    if job is None or job.status != "approved" or not job.open:
        raise HTTPException(status_code=404, detail="Tin tuyển dụng chưa được duyệt hoặc đã đóng")

    existing_application = db.execute(
        select(Application).where(
            Application.candidate_id == user.user_id,
            Application.job_id == data.job_id,
        )
    ).scalar_one_or_none()

    if existing_application is not None:
        raise HTTPException(
            status_code=409,
            detail="Bạn đã nộp đơn cho tin tuyển dụng này"
        )

    application = Application(
        candidate_id=user.user_id,
        job_id=data.job_id,
    )
    db.add(application)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        duplicate_application = db.execute(
            select(Application.application_id).where(
                Application.candidate_id == user.user_id,
                Application.job_id == data.job_id,
            )
        ).scalar_one_or_none()
        if duplicate_application is not None:
            raise HTTPException(
                status_code=409,
                detail="Bạn đã nộp đơn cho tin tuyển dụng này"
            )
        raise

    db.refresh(application)
    return application


