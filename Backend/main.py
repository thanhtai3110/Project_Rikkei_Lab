
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import cast, or_, select, String, delete
from sqlalchemy.exc import IntegrityError
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer

from database import get_db
from models import Application, Job, User, SavedJob
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
    AdminUserResponse,
    AdminUserStatusUpdate,
)
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES



app = FastAPI(title='JobConnect Python API')
FRONTEND_DIR = Path(__file__).resolve().parent.parent / 'frontend'
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware,
    allow_origins=['http://127.0.0.1:5500','http://localhost:5500','http://127.0.0.1:5501','http://localhost:5501'],
    allow_credentials=False, allow_methods=['GET','POST','PUT','PATCH','DELETE'], allow_headers=['Authorization','Content-Type'])
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
    return FileResponse(FRONTEND_DIR / "index.html")

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
        role="candidate"
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
        "email": user.email,
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
    job.open = True
    db.commit()
    db.refresh(job)
    return job

@app.get('/api/jobs/mine', response_model=list[JobResponse])
def my_jobs(db: Session=Depends(get_db), user:User=Depends(get_current_recruiter)):
    return db.execute(select(Job).where(Job.recruiter_id==user.user_id).order_by(Job.job_id.desc())).scalars().all()


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
    job.status = 'pending'
    job.open = False

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



# Endpoints bổ sung để Frontend gốc có thể sử dụng dữ liệu MySQL thật.
from pydantic import BaseModel

@app.get('/api/admin/users', response_model=list[AdminUserResponse], tags=['Admin'])
def admin_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[User]:
    # Chỉ Admin có JWT hợp lệ mới xem được tài khoản. Không trả mật khẩu.
    statement = select(User).order_by(User.user_id.desc())
    return list(db.execute(statement).scalars().all())

# T05F45D - Chỉ Admin được khóa/mở khóa hoặc xóa người dùng.
# Khóa là trạng thái có thể khôi phục; xóa là vĩnh viễn và xóa dữ liệu liên quan.
@app.patch('/api/admin/users/{user_id}/status', response_model=AdminUserResponse, tags=['Admin'])
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


@app.delete('/api/admin/users/{user_id}', tags=['Admin'])
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


@app.get('/api/saved')
def saved_jobs(db:Session=Depends(get_db), user:User=Depends(get_current_candidate)):
    return [x.job_id for x in db.execute(select(SavedJob).where(SavedJob.candidate_id==user.user_id)).scalars()]

@app.post('/api/saved/{id}')
def save_job(id:int,db:Session=Depends(get_db),user:User=Depends(get_current_candidate)):
    if not db.get(Job,id):raise HTTPException(404,'Tin tuyển dụng không tồn tại')
    if not db.execute(select(SavedJob).where(SavedJob.candidate_id==user.user_id,SavedJob.job_id==id)).scalar_one_or_none():
        db.add(SavedJob(candidate_id=user.user_id,job_id=id));db.commit()
    return {'saved':True}

@app.delete('/api/saved/{id}')
def remove_saved(id:int,db:Session=Depends(get_db),user:User=Depends(get_current_candidate)):
    row=db.execute(select(SavedJob).where(SavedJob.candidate_id==user.user_id,SavedJob.job_id==id)).scalar_one_or_none()
    if row:db.delete(row);db.commit()
    return {'saved':False}

@app.get('/api/recruiter/applications')
def recruiter_applications(db:Session=Depends(get_db),user:User=Depends(get_current_recruiter)):
    rows=db.execute(select(Application,Job,User).join(Job,Application.job_id==Job.job_id).join(User,Application.candidate_id==User.user_id).where(Job.recruiter_id==user.user_id)).all()
    return [{'id':a.application_id,'job_id':a.job_id,'status':a.status,'applied_at':a.applied_at.isoformat(),
      'candidate':{'name':u.full_name,'email':u.email,'skills':u.skills or []}} for a,j,u in rows]

@app.patch('/api/admin/jobs/{id}/reject',response_model=JobResponse)
def reject_job(id:int,db:Session=Depends(get_db),user:User=Depends(get_current_admin)):
    job=db.get(Job,id)
    if not job or job.status!='pending':raise HTTPException(409,'Chỉ từ chối được tin chờ duyệt')
    job.status='rejected';job.open=False;db.commit();db.refresh(job);return job

@app.patch('/api/jobs/{id}/close',response_model=JobResponse)
def close_job(id:int,db:Session=Depends(get_db),user:User=Depends(get_current_recruiter)):
    job=db.get(Job,id)
    if not job:raise HTTPException(404,'Không tìm thấy tin tuyển dụng')
    if job.recruiter_id!=user.user_id:raise HTTPException(403,'Không có quyền sửa tin')
    job.open=False;job.status='closed';db.commit();db.refresh(job);return job

@app.patch('/api/applications/{id}/withdraw')
def withdraw_app(id:int,db:Session=Depends(get_db),user:User=Depends(get_current_candidate)):
    app_row=db.get(Application,id)
    if not app_row:raise HTTPException(404,'Không tìm thấy đơn')
    if app_row.candidate_id!=user.user_id:raise HTTPException(403,'Không có quyền rút đơn')
    if app_row.status in ['approved','rejected','withdrawn']:raise HTTPException(409,'Đơn đã kết thúc')
    app_row.status='withdrawn';db.commit();return {'status':'withdrawn'}

@app.get('/health')
def health():return {'ok':True}


@app.get('/api/admin/jobs',response_model=list[JobResponse])
def admin_all_jobs(db:Session=Depends(get_db),user:User=Depends(get_current_admin)):
    return db.execute(select(Job).order_by(Job.job_id.desc())).scalars().all()


# Phục vụ HTML/CSS/JS/ảnh trên cùng cổng 8000 với API.
# Đặt SAU tất cả API routes để không che đường dẫn /api, /auth và /docs.
from password_reset import router as password_reset_router
app.include_router(password_reset_router)

app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
