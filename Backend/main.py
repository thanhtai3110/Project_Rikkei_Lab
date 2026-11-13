
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



app = FastAPI(
    title="Job Portal API",
    description="API tuyển dụng. Các endpoint được phân nhóm theo chức năng trong Swagger UI.",
    openapi_tags=[
        {"name": "Hệ thống", "description": "Kiểm tra trạng thái backend."},
        {"name": "Tiện ích nội bộ", "description": "Các endpoint hỗ trợ phát triển và kiểm tra."},
        {"name": "Xác thực", "description": "Đăng ký, đăng nhập và xác minh JWT."},
        {"name": "Ứng viên", "description": "Hồ sơ ứng viên."},
        {"name": "Công ty", "description": "Hồ sơ doanh nghiệp."},
        {"name": "Việc làm", "description": "Danh sách, tìm kiếm, chi tiết và quản lý tin tuyển dụng."},
        {"name": "Ứng tuyển", "description": "Nộp đơn, xem đơn và xét duyệt đơn ứng tuyển."},
        {"name": "Quản trị", "description": "Quản trị và duyệt tin tuyển dụng."},
    ],
)
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

# API kiểm tra backend đang hoạt động (không nằm trong các task API ở hình).
@app.get(
    "/",
    tags=["Hệ thống"],
    summary="Kiểm tra trạng thái API",
    description="Kiểm tra nhanh backend đang hoạt động.",
)
def home():
    return {"message": "Job Portal API đang hoạt động"}

# API tiện ích nội bộ: lấy danh sách người dùng.
@app.get(
    "/users",
    tags=["Tiện ích nội bộ"],
    summary="Lấy danh sách người dùng",
    description="Endpoint tiện ích nội bộ, trả về toàn bộ người dùng.",
)
def get_users(db: Session = Depends(get_db)):
    statement = select(User)
    users = db.execute(statement).scalars().all()

    return users

# API tiện ích nội bộ: tìm người dùng theo email.
@app.get(
    "/users/{email}",
    tags=["Tiện ích nội bộ"],
    summary="Tìm người dùng theo email",
    description="Tra cứu tài khoản bằng địa chỉ email.",
)
def get_user_by_email(email: str, db: Session = Depends(get_db)):
    statement = select(User).where(User.email == email)

    user = db.execute(statement).scalar_one_or_none()

    if user is None:
        return {"message": "Không tìm thấy người dùng"}

    return user

# API đăng ký tài khoản (Sprint 3).
@app.post(
    "/auth/register",
    status_code=201,
    tags=["Xác thực"],
    summary="Đăng ký tài khoản",
    description="Tạo tài khoản mới với vai trò ứng viên hoặc nhà tuyển dụng.",
)
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

# API đăng nhập và cấp JWT (Sprint 2).
@app.post(
    "/auth/login",
    tags=["Xác thực"],
    summary="Đăng nhập",
    description="Xác thực email và mật khẩu, sau đó trả về JWT Bearer token.",
)
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

# API hồ sơ ứng viên: xem hồ sơ (Sprint 2).
@app.get(
    "/candidate/profile",
    response_model=CandidateProfileResponse,
    tags=["Ứng viên"],
    summary="Xem hồ sơ ứng viên",
    description="Trả về hồ sơ của ứng viên đang đăng nhập.",
)
def get_candidate_profile(
    user: User = Depends(get_current_candidate)
) -> User:
    return user

# API hồ sơ ứng viên: cập nhật hồ sơ (Sprint 2).
@app.patch(
    "/candidate/profile",
    response_model=CandidateProfileResponse,
    tags=["Ứng viên"],
    summary="Cập nhật hồ sơ ứng viên",
    description="Cập nhật thông tin hồ sơ của ứng viên đang đăng nhập.",
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

# API thông tin công ty: xem hồ sơ doanh nghiệp (Sprint 2).
@app.get(
    "/company/profile",
    response_model=CompanyProfileResponse,
    tags=["Công ty"],
    summary="Xem thông tin công ty",
    description="Trả về hồ sơ doanh nghiệp của nhà tuyển dụng đang đăng nhập.",
)
def get_company_profile(
    user: User = Depends(get_current_recruiter)
) -> User:
    return user

# API thông tin công ty: cập nhật hồ sơ doanh nghiệp (Sprint 2).
@app.patch(
    "/company/profile",
    response_model=CompanyProfileResponse,
    tags=["Công ty"],
    summary="Cập nhật thông tin công ty",
    description="Cập nhật hồ sơ doanh nghiệp của nhà tuyển dụng đang đăng nhập.",
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

# API danh sách và tìm kiếm việc làm (Sprint 3).
@app.get(
    "/api/jobs",
    response_model=list[JobResponse],
    tags=["Việc làm"],
    summary="Tìm kiếm và lọc việc làm",
    description=(
        "Lấy danh sách tin đã duyệt. Có thể lọc bằng keyword, location, "
        "min_salary và max_salary."
    ),
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

# API duyệt tin Admin: xem danh sách tin đang chờ duyệt (Sprint 3).
@app.get(
    "/api/admin/jobs/pending",
    response_model=list[JobResponse],
    tags=["Quản trị"],
    summary="Danh sách tin chờ duyệt",
    description="Admin xem các tin tuyển dụng đang có trạng thái pending.",
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

# API duyệt tin Admin: duyệt tin tuyển dụng (Sprint 3).
@app.patch(
    "/api/admin/jobs/{id}/approve",
    response_model=JobResponse,
    tags=["Quản trị"],
    summary="Duyệt tin tuyển dụng",
    description="Admin chuyển tin đang pending sang trạng thái approved.",
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

# API chi tiết việc làm (Sprint 3).
@app.get(
    "/api/jobs/{id}",
    response_model=JobResponse,
    tags=["Việc làm"],
    summary="Chi tiết việc làm",
    description="Xem nội dung và thông tin công ty của một tin đã duyệt.",
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

# API lịch sử ứng tuyển của ứng viên đang đăng nhập (Sprint 3).
@app.get(
    "/api/applications/my",
    response_model=list[ApplicationResponse],
    tags=["Ứng tuyển"],
    summary="Lịch sử ứng tuyển của tôi",
    description="Ứng viên xem danh sách đơn đã nộp bằng tài khoản hiện tại.",
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

# API xem hồ sơ ứng tuyển: lấy danh sách đơn theo tin tuyển dụng (Sprint 3).
@app.get(
    "/api/jobs/{job_id}/applications",
    response_model=list[ApplicationResponse],
    tags=["Ứng tuyển"],
    summary="Xem đơn ứng tuyển theo tin",
    description="Recruiter xem các đơn ứng tuyển cho tin tuyển dụng của mình.",
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

# API cập nhật trạng thái đơn ứng tuyển: recruiter xét duyệt (Sprint 3).
@app.patch(
    "/api/applications/{id}/status",
    response_model=ApplicationResponse,
    tags=["Ứng tuyển"],
    summary="Cập nhật trạng thái đơn",
    description="Recruiter xét duyệt đơn thuộc tin của mình: approved hoặc rejected.",
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

# API nộp đơn ứng tuyển (Sprint 3).
@app.post(
    "/api/applications",
    status_code=201,
    response_model=ApplicationResponse,
    tags=["Ứng tuyển"],
    summary="Nộp đơn ứng tuyển",
    description="Ứng viên nộp đơn cho một tin tuyển dụng; mỗi tin chỉ nộp một lần.",
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

# API tạo tin tuyển dụng (Sprint 2).
@app.post(
    "/api/jobs",
    status_code=201,
    response_model=JobResponse,
    tags=["Việc làm"],
    summary="Tạo tin tuyển dụng",
    description="Recruiter tạo tin mới. Tin mới được đưa vào trạng thái pending.",
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

# API sửa tin tuyển dụng (Sprint 2).
@app.put(
    "/api/jobs/{id}",
    response_model=JobResponse,
    tags=["Việc làm"],
    summary="Cập nhật tin tuyển dụng",
    description="Chủ sở hữu tin tuyển dụng cập nhật nội dung tin theo ID.",
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

# API tiện ích xác minh thông tin tài khoản từ JWT.
@app.get(
    "/auth/me",
    tags=["Xác thực"],
    summary="Thông tin tài khoản hiện tại",
    description="Xác minh JWT và trả về thông tin tài khoản đang đăng nhập.",
)
def get_me(user: User = Depends(get_current_user)):
    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role
    }
