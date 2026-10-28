import logging
import re
from typing import Optional
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import mongomock

from app.config import settings

logger = logging.getLogger("veribrand.database")

_client: Optional[MongoClient] = None
_db: Optional[Database] = None
_is_mock: bool = False


def mask_mongo_uri(uri: str) -> str:
    """Mask credentials in MongoDB connection string for secure logging."""
    if not uri:
        return "<empty>"
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", uri)


def connect_to_mongo() -> Database:
    global _client, _db, _is_mock

    # Attempt real MongoDB connection
    if settings.MONGODB_URI:
        safe_uri = mask_mongo_uri(settings.MONGODB_URI)
        try:
            logger.info(f"Connecting to MongoDB cluster ({safe_uri})...")
            client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            # Verify connectivity & authentication
            client.admin.command("ping")

            # Determine target database: prefer URI default db or settings.MONGODB_DB_NAME
            try:
                default_db = client.get_default_database()
                target_db = default_db if default_db is not None else client[settings.MONGODB_DB_NAME]
            except Exception:
                target_db = client[settings.MONGODB_DB_NAME]

            _client = client
            _db = target_db
            _is_mock = False
            logger.info(f"Successfully connected to MongoDB database: '{_db.name}'")
            init_indexes(_db)
            return _db
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            logger.error(f"Failed to connect to MongoDB ({safe_uri}): {e}")
            if not getattr(settings, "ALLOW_MOCK_DB", False):
                logger.critical(
                    "Production safety error: Real MongoDB connection failed and ALLOW_MOCK_DB is False. "
                    "Aborting startup to prevent accidental data loss. "
                    "Please verify Atlas network access (IP allowlist), user credentials, and connection string."
                )
                raise ConnectionError(
                    f"MongoDB connection failed: {e}. "
                    "Fallback to mock database is disabled for production safety. "
                    "Set ALLOW_MOCK_DB=true in your environment only if you explicitly intend to run offline mock tests."
                ) from e

            logger.warning(
                "ALLOW_MOCK_DB is enabled. Falling back to in-memory mongomock for local testing."
            )

    elif not getattr(settings, "ALLOW_MOCK_DB", False):
        raise ConnectionError(
            "MONGODB_URI is not configured and ALLOW_MOCK_DB is False. "
            "Please configure MONGODB_URI in backend/.env."
        )

    # In-memory mongomock fallback (only when ALLOW_MOCK_DB=True)
    _client = mongomock.MongoClient()
    _db = _client[settings.MONGODB_DB_NAME]
    _is_mock = True
    logger.info("Initialized in-memory MongoDB test instance (ALLOW_MOCK_DB=true).")
    init_indexes(_db)
    return _db


def init_indexes(db: Database):
    """Ensure essential indexes for workspace isolation and query performance."""
    try:
        # Users: unique email
        db.users.create_index("email", unique=True)
        # Workspaces: slug / id
        db.workspaces.create_index("workspace_id", unique=True)
        # Guidelines: workspace_id + version
        db.guidelines.create_index([("workspace_id", 1), ("rule_id", 1)])
        # Approved facts: workspace_id + source_id + version_id
        db.approved_facts.create_index([("workspace_id", 1), ("source_id", 1)])
        # Drafts: workspace_id + draft_id
        db.drafts.create_index([("workspace_id", 1), ("draft_id", 1)])
        # Revisions: workspace_id + draft_id + revision_id
        db.revisions.create_index([("workspace_id", 1), ("revision_id", 1)])
        # Findings: workspace_id + revision_id
        db.findings.create_index([("workspace_id", 1), ("revision_id", 1)])
        # Approvals: workspace_id + revision_id
        db.approval_decisions.create_index([("workspace_id", 1), ("revision_id", 1)])
        # Audit: workspace_id + timestamp
        db.audit_events.create_index([("workspace_id", 1), ("created_at", -1)])
        logger.info("Database collections and indexes successfully verified.")
    except Exception as e:
        logger.warning(f"Note on index creation: {e}")


def close_mongo_connection():
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed.")


def get_db() -> Database:
    global _db
    if _db is None:
        _db = connect_to_mongo()
    return _db


def is_mock_db() -> bool:
    return _is_mock
