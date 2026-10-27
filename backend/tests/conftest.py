import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
import mongomock
from fastapi.testclient import TestClient

from app.main import app
from app.database import get_db
from app.services.auth_service import hash_password


@pytest.fixture(scope="session")
def mock_db():
    client = mongomock.MongoClient()
    db = client["veribrand_test_db"]
    return db


@pytest.fixture(scope="session")
def client(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
