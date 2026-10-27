from datetime import timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.database import get_db
from app.config import settings
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserProfile
from app.services.auth_service import register_user, authenticate_user, create_access_token
from app.dependencies.auth_deps import get_current_user, record_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest, db: Database = Depends(get_db)):
    user = register_user(
        db=db,
        email=req.email,
        password=req.password,
        full_name=req.full_name,
        role=req.role,
        workspace_name=req.workspace_name,
        workspace_id=req.workspace_id
    )

    access_token = create_access_token(
        data={"sub": user["user_id"], "email": user["email"], "role": user["role"], "workspace_id": user["workspace_id"]}
    )

    workspace = db.workspaces.find_one({"workspace_id": user["workspace_id"]})
    workspace_name = workspace["name"] if workspace else "Brand Workspace"

    record_audit_event(
        db=db,
        workspace_id=user["workspace_id"],
        actor_id=user["user_id"],
        actor_name=user["full_name"],
        action="user_registered",
        target_type="user",
        target_id=user["user_id"],
        details=f"User {user['full_name']} registered with role '{user['role']}' in workspace '{workspace_name}'."
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user["user_id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        workspace_id=user["workspace_id"],
        workspace_name=workspace_name
    )


@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest, db: Database = Depends(get_db)):
    user = authenticate_user(db, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    access_token = create_access_token(
        data={"sub": user["user_id"], "email": user["email"], "role": user["role"], "workspace_id": user["workspace_id"]}
    )

    workspace = db.workspaces.find_one({"workspace_id": user["workspace_id"]})
    workspace_name = workspace["name"] if workspace else "Brand Workspace"

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user["user_id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        workspace_id=user["workspace_id"],
        workspace_name=workspace_name
    )


@router.get("/me", response_model=UserProfile)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return UserProfile(
        user_id=current_user["user_id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        workspace_id=current_user["workspace_id"],
        workspace_name=current_user.get("workspace_name", "Brand Workspace"),
        created_at=current_user["created_at"]
    )
