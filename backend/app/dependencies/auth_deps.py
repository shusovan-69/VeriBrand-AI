import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo.database import Database

from app.database import get_db
from app.services.auth_service import decode_access_token

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Database = Depends(get_db)
) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    user = db.users.find_one({"user_id": user_id, "is_active": True})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Attach workspace details
    workspace = db.workspaces.find_one({"workspace_id": user["workspace_id"]})
    user["workspace_name"] = workspace["name"] if workspace else "Workspace"
    return user


def require_roles(allowed_roles: List[str]) -> Callable:
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "").lower()
        if user_role not in [r.lower() for r in allowed_roles] and user_role != "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Action requires one of roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


def record_audit_event(
    db: Database,
    workspace_id: str,
    actor_id: str,
    actor_name: str,
    action: str,
    target_type: str,
    target_id: str,
    details: str,
    metadata: Dict[str, Any] = None
):
    event_doc = {
        "event_id": f"EVT-{uuid.uuid4().hex[:10].upper()}",
        "workspace_id": workspace_id,
        "actor_id": actor_id,
        "actor_name": actor_name,
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "details": details,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc)
    }
    db.audit_events.insert_one(event_doc)
    return event_doc
