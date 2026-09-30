import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt
from passlib.context import CryptContext

# Secret & Algorithm Configuration
APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()
if APP_ENV == "production":
    if len(SECRET_KEY) < 32 or any(marker in SECRET_KEY.lower() for marker in ("change_me", "replace_me", "your_")):
        raise RuntimeError("Set JWT_SECRET_KEY to a unique random secret of at least 32 characters in production.")
elif not SECRET_KEY:
    SECRET_KEY = secrets.token_urlsafe(48)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 Days token expiration for student convenience

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the hashed string."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generates bcrypt hash of password."""
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Encodes JWT access token with user identifier and expiry timestamp."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None
