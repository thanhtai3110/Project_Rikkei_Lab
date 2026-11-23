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
    "/api/jobs",
    response_model=list[JobResponse],
)
def get_jobs(
    keyword: str | None = Query(default=None, min_length=1),
    location: str | None = Query(default=None, min_length=1),
    min_salary: float | None = Query(default=None, ge=0),
    max_salary: float | None = Query(default=None, ge=0),
    db: Session = Depends(get_db),
) -> list[Job]:
    if min_salary is not None and max_salary is not None and min_salary > max_salary:
        raise HTTPException(
            status_code=422,
            detail="Lương tối thiểu không được lớn hơn lương tối đa"
        )

    statement = select(Job).where(Job.status == "approved")

    if keyword and keyword.strip():
        pattern = f"%{keyword.strip()}%"
        statement = statement.where(
            or_(
                Job.title.ilike(pattern),
                Job.company.ilike(pattern),
                Job.description.ilike(pattern),
                cast(Job.skills, String).ilike(pattern),
            )
        )

    if location and location.strip():
        statement = statement.where(
            Job.location.ilike(f"%{location.strip()}%")
        )

    if min_salary is not None:
        statement = statement.where(Job.max_salary >= min_salary)

    if max_salary is not None:
        statement = statement.where(Job.min_salary <= max_salary)

    statement = statement.order_by(Job.date.desc(), Job.job_id.desc())
    return db.execute(statement).scalars().all()


@router.get(
    "/api/jobs/{id}",
    response_model=JobResponse,
)
def get_job(
    id: int,
    db: Session = Depends(get_db),
) -> Job:
    job = db.execute(
        select(Job).where(
            Job.job_id == id,
            Job.status == "approved",
        )
    ).scalar_one_or_none()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tin tuyển dụng"
        )

    return job


