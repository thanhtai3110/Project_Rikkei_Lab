from fastapi import Depends, HTTPException, Query
from fastapi.responses import Response
from urllib.parse import quote
from sqlalchemy.orm import Session
from sqlalchemy import cast, or_, select, String, delete
from sqlalchemy.exc import IntegrityError
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from app.core.database import get_db
from app.models.entities import Application, ApplicationCV, Job, User, SavedJob, PasswordResetCode
from app.schemas.contracts import *
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.dependencies import create_access_token, get_current_user, get_current_candidate, get_current_recruiter, get_current_admin
from fastapi import APIRouter

router = APIRouter()

@router.get(
    "/company/profile",
    response_model=CompanyProfileResponse
)
def get_company_profile(
    user: User = Depends(get_current_recruiter)
) -> User:
    return user


@router.patch(
    "/company/profile",
    response_model=CompanyProfileResponse
)
def update_company_profile(
    data: CompanyProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_recruiter)
) -> User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.get('/api/jobs/mine', response_model=list[JobResponse])
def my_jobs(db: Session=Depends(get_db), user:User=Depends(get_current_recruiter)):
    return db.execute(select(Job).where(Job.recruiter_id==user.user_id).order_by(Job.job_id.desc())).scalars().all()


@router.get(
    "/api/jobs/{job_id}/applications",
    response_model=list[ApplicationResponse],
)
def get_job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_recruiter),
) -> list[Application]:
    job = db.execute(
        select(Job).where(Job.job_id == job_id)
    ).scalar_one_or_none()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tin tuyển dụng"
        )

    if job.recruiter_id != user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Bạn không có quyền xem đơn ứng tuyển của tin này"
        )

    statement = (
        select(Application)
        .where(Application.job_id == job_id)
        .order_by(Application.applied_at.desc(), Application.application_id.desc())
    )
    return db.execute(statement).scalars().all()


@router.patch(
    "/api/applications/{id}/status",
    response_model=ApplicationResponse,
)
def update_application_status(
    id: int,
    data: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_recruiter),
) -> Application:
    application = db.execute(
        select(Application).where(Application.application_id == id)
    ).scalar_one_or_none()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy đơn ứng tuyển"
        )

    job = db.execute(
        select(Job).where(Job.job_id == application.job_id)
    ).scalar_one_or_none()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tin tuyển dụng"
        )

    if job.recruiter_id != user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Bạn không có quyền xét duyệt đơn ứng tuyển này"
        )

    application.status = data.status
    db.commit()
    db.refresh(application)
    return application


@router.post(
    "/api/jobs",
    status_code=201,
    response_model=JobResponse,
)
def create_job(
    data: JobCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_recruiter),
) -> Job:
    if not user.company_name:
        raise HTTPException(
            status_code=400,
            detail="Hãy cập nhật tên doanh nghiệp trước khi tạo tin tuyển dụng"
        )

    job = Job(
        recruiter_id=user.user_id,
        title=data.title,
        company=user.company_name,
        location=data.location,
        job_type=data.type,
        skills=data.skills,
        min_salary=data.min,
        max_salary=data.max,
        description=data.description,
        status="pending",
        open=False,
    )

    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.put(
    "/api/jobs/{id}",
    response_model=JobResponse,
)
def update_job(
    id: int,
    data: JobCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_recruiter),
) -> Job:
    job = db.execute(
        select(Job).where(Job.job_id == id)
    ).scalar_one_or_none()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tin tuyển dụng"
        )

    if job.recruiter_id != user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Bạn không có quyền cập nhật tin tuyển dụng này"
        )

    job.title = data.title
    job.location = data.location
    job.job_type = data.type
    job.skills = data.skills
    job.min_salary = data.min
    job.max_salary = data.max
    job.description = data.description
    job.status = 'pending'
    job.open = False

    db.commit()
    db.refresh(job)
    return job


@router.patch('/api/jobs/{id}/close',response_model=JobResponse)
def close_job(id:int,db:Session=Depends(get_db),user:User=Depends(get_current_recruiter)):
    job=db.get(Job,id)
    if not job:raise HTTPException(404,'Không tìm thấy tin tuyển dụng')
    if job.recruiter_id!=user.user_id:raise HTTPException(403,'Không có quyền sửa tin')
    job.open=False;job.status='closed';db.commit();db.refresh(job);return job


@router.get("/api/recruiter/applications")
def recruiter_applications(db: Session = Depends(get_db), user: User = Depends(get_current_recruiter)):
    statement = (
        select(Application, User, ApplicationCV.filename)
        .join(Job, Application.job_id == Job.job_id)
        .join(User, Application.candidate_id == User.user_id)
        .outerjoin(ApplicationCV, ApplicationCV.application_id == Application.application_id)
        .where(Job.recruiter_id == user.user_id)
    )
    return [
        {
            "id": application.application_id,
            "job_id": application.job_id,
            "status": application.status,
            "applied_at": application.applied_at.isoformat(),
            "cv_filename": filename,
            "candidate": {"name": candidate.full_name, "email": candidate.email, "skills": candidate.skills or []},
        }
        for application, candidate, filename in db.execute(statement)
    ]


@router.get("/api/recruiter/applications/{application_id}/cv", response_class=Response)
def get_application_cv(
    application_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_recruiter),
) -> Response:
    statement = (
        select(ApplicationCV)
        .join(Application, ApplicationCV.application_id == Application.application_id)
        .join(Job, Application.job_id == Job.job_id)
        .where(Application.application_id == application_id, Job.recruiter_id == user.user_id)
    )
    cv = db.execute(statement).scalar_one_or_none()
    if cv is None:
        raise HTTPException(404, "Không tìm thấy CV của đơn ứng tuyển")

    return Response(
        content=cv.content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename*=UTF-8''{quote(cv.filename, safe='')}",
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


