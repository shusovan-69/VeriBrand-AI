import logging
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


def connect_to_mongo() -> Database:
    global _client, _db, _is_mock

    # Attempt real MongoDB connection first
    if settings.MONGODB_URI:
        try:
            logger.info(f"Attempting connection to MongoDB at: {settings.MONGODB_URI}...")
            client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000,
                connectTimeoutMS=2000
            )
            # Trigger server selection
            client.admin.command("ping")
            _client = client
            _db = _client[settings.MONGODB_DB_NAME]
            _is_mock = False
            logger.info(f"Successfully connected to active MongoDB database: '{settings.MONGODB_DB_NAME}'")
            init_indexes(_db)
            return _db
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            logger.warning(
                f"Could not connect to external MongoDB ({e}). "
                f"Falling back to high-fidelity in-memory MongoDB engine (mongomock) for local/test execution."
            )

    # In-memory mongomock fallback
    _client = mongomock.MongoClient()
    _db = _client[settings.MONGODB_DB_NAME]
    _is_mock = True
    logger.info("Initialized resilient in-memory MongoDB instance.")
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
