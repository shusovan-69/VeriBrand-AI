import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import bcrypt
import jwt
from fastapi import HTTPException, status
from pymongo.database import Database

from app.config import settings


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def register_user(
    db: Database,
    email: str,
    password: str,
    full_name: str,
    role: str,
    workspace_name: Optional[str] = "Acme Corp Brand",
    workspace_id: Optional[str] = None
) -> Dict[str, Any]:
    email_clean = email.lower().strip()
    existing = db.users.find_one({"email": email_clean})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Valid roles
    allowed_roles = ["admin", "creator", "reviewer", "owner"]
    role_clean = role.lower().strip()
    if role_clean not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed roles: {', '.join(allowed_roles)}"
        )

    # Workspace setup
    if not workspace_id:
        # Check if default workspace exists or create one
        ws = db.workspaces.find_one({"name": workspace_name})
        if not ws:
            ws_id = f"WS-{uuid.uuid4().hex[:8].upper()}"
            db.workspaces.insert_one({
                "workspace_id": ws_id,
                "name": workspace_name,
                "brand_name": workspace_name,
                "created_at": datetime.now(timezone.utc)
            })
            workspace_id = ws_id
        else:
            workspace_id = ws["workspace_id"]
    else:
        ws = db.workspaces.find_one({"workspace_id": workspace_id})
        if not ws:
            # create with given id
            db.workspaces.insert_one({
                "workspace_id": workspace_id,
                "name": workspace_name or "Brand Workspace",
                "brand_name": workspace_name or "Brand Workspace",
                "created_at": datetime.now(timezone.utc)
            })

    user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
    hashed_pwd = hash_password(password)

    user_doc = {
        "user_id": user_id,
        "email": email_clean,
        "full_name": full_name.strip(),
        "hashed_password": hashed_pwd,
        "role": role_clean,
        "workspace_id": workspace_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    db.users.insert_one(user_doc)
    return user_doc


def authenticate_user(db: Database, email: str, password: str) -> Optional[Dict[str, Any]]:
    email_clean = email.lower().strip()
    user = db.users.find_one({"email": email_clean})
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user
