
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import cast, or_, select, String
from sqlalchemy.exc import IntegrityError
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer

from database import get_db
from models import Application, Job, User
from schemas import RegisterRequest, LoginRequest
from schemas import (
    CandidateProfileResponse,
    CandidateProfileUpdate,
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate,
    CompanyProfileResponse,
    CompanyProfileUpdate,
    JobCreate,
    JobResponse,
)
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES



app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

@app.get("/")
def home():
    return {"message": "Job Portal API đang hoạt động"}

@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    statement = select(User)
    users = db.execute(statement).scalars().all()

    return users

@app.get("/users/{email}")
def get_user_by_email(email: str, db: Session = Depends(get_db)):
    statement = select(User).where(User.email == email)

    user = db.execute(statement).scalar_one_or_none()

    if user is None:
        return {"message": "Không tìm thấy người dùng"}

    return user

@app.post("/auth/register", status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    statement = select(User).where(User.email == data.email)
    existing_user = db.execute(statement).scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email đã được sử dụng"
        )

    hashed_password = bcrypt.hashpw(
        data.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    new_user = User(
        full_name=data.full_name,
        email=data.email,
        password=hashed_password,
        role=data.role
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email đã được sử dụng")

    return {
        "message": "Đăng ký thành công",
        "user_id": new_user.user_id,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "role": new_user.role
    }

@app.post("/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    statement = select(User).where(User.email == data.email)
    user = db.execute(statement).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Email hoặc mật khẩu không chính xác"
        )

    if not bcrypt.checkpw(
        data.password.encode("utf-8"),
        user.password.encode("utf-8")
    ):
        raise HTTPException(
            status_code=401,
            detail="Email hoặc mật khẩu không chính xác"
        )

    if user.status != "active":
        raise HTTPException(
            status_code=403,
            detail="Tài khoản đã bị khóa hoặc vô hiệu hóa"
        )

    access_token = create_access_token({
        "sub": str(user.user_id),
        "role": user.role
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "full_name": user.full_name,
        "role": user.role
    }

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Token không hợp lệ hoặc đã hết hạn",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    statement = select(User).where(User.user_id == int(user_id))
    user = db.execute(statement).scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if user.status != "active":
        raise HTTPException(
            status_code=403,
            detail="Tài khoản không hoạt động"
        )

    return user

def get_current_candidate(
    user: User = Depends(get_current_user)
) -> User:
    if user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Chỉ ứng viên mới có thể truy cập hồ sơ này"
        )

    return user

@app.get(
    "/candidate/profile",
    response_model=CandidateProfileResponse
)
def get_candidate_profile(
    user: User = Depends(get_current_candidate)
) -> User:
    return user

@app.patch(
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

def get_current_recruiter(
    user: User = Depends(get_current_user)
) -> User:
    if user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Chỉ nhà tuyển dụng mới có thể truy cập hồ sơ doanh nghiệp"
        )

    return user

def get_current_admin(
    user: User = Depends(get_current_user)
) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Chỉ quản trị viên mới có thể duyệt tin tuyển dụng"
        )

    return user

@app.get(
    "/company/profile",
    response_model=CompanyProfileResponse
)
def get_company_profile(
    user: User = Depends(get_current_recruiter)
) -> User:
    return user

@app.patch(
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

@app.get(
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

@app.get(
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

@app.patch(
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
    db.commit()
    db.refresh(job)
    return job

@app.get(
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

@app.get(
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

@app.get(
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

@app.patch(
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

@app.post(
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

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tin tuyển dụng"
        )

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

@app.post(
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

@app.put(
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

    db.commit()
    db.refresh(job)
    return job

@app.get("/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role
    }
