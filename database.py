from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime, Text, ForeignKey
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime, timezone
from config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def utcnow() -> datetime:
    """Timezone-aware UTC timestamp (datetime.utcnow() is deprecated in 3.12)."""
    return datetime.now(timezone.utc)

# ---- DATABASE MODELS ----

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    history = relationship(
        "ResearchHistory", back_populates="user", cascade="all, delete-orphan"
    )

class ResearchHistory(Base):
    __tablename__ = "research_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # Celery task id — the only reliable way to match a result back to its row.
    task_id = Column(String, unique=True, index=True, nullable=False)
    query = Column(String, nullable=False)
    result = Column(Text)
    sources = Column(Text)  # stored as JSON string
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="history")

# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
