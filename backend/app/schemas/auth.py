from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: str = Field(..., description="Role: admin, creator, or reviewer")
    workspace_name: Optional[str] = "Default Brand Workspace"
    workspace_id: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    role: str
    workspace_id: str
    workspace_name: str


class UserProfile(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: str
    workspace_id: str
    workspace_name: str
    created_at: datetime
