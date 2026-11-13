from datetime import date, datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    role: Literal["candidate", "recruiter"] = "candidate"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CandidateProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    skills: list[str] | None = None
    cv_url: str | None = Field(default=None, max_length=2048)

    @field_validator("full_name")
    @classmethod
    def full_name_cannot_be_null(cls, value: str | None) -> str:
        if value is None:
            raise ValueError("full_name không được để trống")
        return value

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "CandidateProfileUpdate":
        if not self.model_fields_set:
            raise ValueError("Cần cung cấp ít nhất một trường để cập nhật")
        return self


class CandidateProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    phone: str | None
    skills: list[str] | None
    cv_url: str | None


class CompanyProfileUpdate(BaseModel):
    company_name: str | None = Field(default=None, min_length=2, max_length=200)
    address: str | None = Field(default=None, max_length=500)
    description: str | None = None
    logo_url: str | None = Field(default=None, max_length=2048)

    @field_validator("company_name")
    @classmethod
    def company_name_cannot_be_null(cls, value: str | None) -> str:
        if value is None:
            raise ValueError("company_name không được để trống")
        return value

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "CompanyProfileUpdate":
        if not self.model_fields_set:
            raise ValueError("Cần cung cấp ít nhất một trường để cập nhật")
        return self


class CompanyProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    company_name: str | None
    address: str | None
    description: str | None
    logo_url: str | None


class JobCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=140)
    location: str = Field(min_length=1, max_length=100)
    type: str = Field(min_length=1, max_length=50)
    skills: list[str] = Field(min_length=1)
    min: float = Field(ge=0, le=200)
    max: float = Field(ge=0, le=200)
    description: str = Field(min_length=1, max_length=3000)

    @field_validator("title", "location", "type", "description")
    @classmethod
    def fields_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Trường này không được để trống")
        return value.strip()

    @field_validator("skills")
    @classmethod
    def skills_must_not_be_blank(cls, value: list[str]) -> list[str]:
        cleaned_skills = [skill.strip() for skill in value if skill.strip()]
        if not cleaned_skills:
            raise ValueError("Cần cung cấp ít nhất một kỹ năng")
        return cleaned_skills

    @model_validator(mode="after")
    def salary_range_must_be_valid(self) -> "JobCreate":
        if self.min > self.max:
            raise ValueError("Lương tối thiểu không được lớn hơn lương tối đa")
        return self


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(validation_alias="job_id")
    title: str
    company: str
    location: str
    type: str = Field(validation_alias="job_type")
    skills: list[str]
    min: float = Field(validation_alias="min_salary")
    max: float = Field(validation_alias="max_salary")
    description: str
    date: date
    open: bool
    status: str


class ApplicationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: int = Field(gt=0)


class ApplicationStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["approved", "rejected"]


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(validation_alias="application_id")
    candidate_id: int
    job_id: int
    status: str
    applied_at: datetime
