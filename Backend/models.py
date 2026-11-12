from datetime import date

from sqlalchemy import Boolean, Column, Date, Float, ForeignKey, Integer, JSON, String, Text
from database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    skills = Column(JSON, nullable=True)
    cv_url = Column(String(2048), nullable=True)
    company_name = Column(String(200), nullable=True)
    address = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(2048), nullable=True)
    email = Column(String(150), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="active")


class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False,
        index=True,
    )
    title = Column(String(140), nullable=False)
    company = Column(String(200), nullable=False)
    location = Column(String(100), nullable=False)
    job_type = Column(String(50), nullable=False)
    skills = Column(JSON, nullable=False)
    min_salary = Column(Float, nullable=False)
    max_salary = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    open = Column(Boolean, nullable=False, default=False)
    status = Column(String(20), nullable=False, default="pending")