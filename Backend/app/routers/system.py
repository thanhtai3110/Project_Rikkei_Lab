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

@router.get('/health')
def health():return {'ok':True}


