from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
import json
import uuid

from config import settings
from database import get_db, User, ResearchHistory, create_tables
from auth import (
    hash_password, verify_password,
    create_access_token, get_current_user
)
from research import run_research
import redis

# Text stored for a run whose web search came back empty. Kept as a constant
# so /result and /history agree on how to recognise it.
NO_RESULTS = "No results found"

INLINE = settings.research_mode == "inline"

# Celery is only imported when it will actually be used. On a serverless host
# there is no worker and no Redis, and importing the task module would pull in
# a broker configuration that can never connect.
if not INLINE:
    from tasks import research_agent_task

app = FastAPI(title="Briefly API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
create_tables()

redis_client = None if INLINE else redis.Redis.from_url(settings.redis_url)

# ---- SCHEMAS ----
class UserSignup(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)  # bcrypt caps at 72 bytes

class ResearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=500)

class TaskResponse(BaseModel):
    task_id: str
    status: str
    message: str

# ---- AUTH ENDPOINTS ----

@app.post("/signup")
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    # Check if username exists
    existing_user = db.query(User).filter(
        User.username == user_data.username
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )

    # Check if email exists
    existing_email = db.query(User).filter(
        User.email == user_data.email
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Return token immediately after signup
    token = create_access_token({"sub": new_user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": new_user.username
    }

@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Find user
    user = db.query(User).filter(
        User.username == form_data.username
    ).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    token = create_access_token({"sub": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username
    }

@app.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email
    }

# ---- RESEARCH ENDPOINTS ----

@app.post("/research", response_model=TaskResponse)
def start_research(
    request: ResearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if INLINE:
        # No worker exists here, so do the work now and store the finished
        # result. The response shape is unchanged, so the frontend still polls
        # /result once and immediately gets a completed task.
        task_id = str(uuid.uuid4())
        payload = run_research(request.query)
        history = ResearchHistory(
            user_id=current_user.id,
            task_id=task_id,
            query=request.query,
            result=payload["result"],
            sources=json.dumps(payload["sources"]),
        )
        db.add(history)
        db.commit()
        return TaskResponse(
            task_id=task_id,
            status="queued",
            message=f"Research completed for: {request.query}",
        )

    task = research_agent_task.delay(request.query)

    # Save to history immediately with pending status, keyed by task_id so the
    # result can be matched back to this exact row later.
    history = ResearchHistory(
        user_id=current_user.id,
        task_id=task.id,
        query=request.query,
        result="pending",
        sources="[]"
    )
    db.add(history)
    db.commit()

    return TaskResponse(
        task_id=task.id,
        status="queued",
        message=f"Research started for: {request.query}"
    )

@app.get("/result/{task_id}")
def get_result(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only let a user poll their own tasks.
    history = db.query(ResearchHistory).filter(
        ResearchHistory.task_id == task_id,
        ResearchHistory.user_id == current_user.id
    ).first()
    if history is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if INLINE:
        # The row was written complete by /research; there is nothing to poll.
        return {
            "task_id": task_id,
            "status": "completed",
            "result": {
                "status": "error" if history.result == NO_RESULTS else "completed",
                "query": history.query,
                "result": history.result,
                "sources": json.loads(history.sources) if history.sources else [],
            },
        }

    task = research_agent_task.AsyncResult(task_id)

    if task.state == "SUCCESS":
        result_data = task.result

        # Update this task's own row — matching on task_id, not on the query
        # text, so repeating a query no longer overwrites the earlier result.
        history.result = result_data.get("result", "")
        history.sources = json.dumps(result_data.get("sources", []))
        db.commit()

        return {
            "task_id": task_id,
            "status": "completed",
            "result": result_data
        }
    elif task.state == "FAILURE":
        history.result = "failed"
        db.commit()
        return {"task_id": task_id, "status": "failed"}
    elif task.state == "PENDING":
        return {"task_id": task_id, "status": "pending"}
    else:
        return {"task_id": task_id, "status": "running"}

@app.get("/history")
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(ResearchHistory).filter(
        ResearchHistory.user_id == current_user.id,
        ResearchHistory.result.notin_(["pending", "failed", NO_RESULTS])
    ).order_by(ResearchHistory.created_at.desc()).limit(20).all()

    return [
        {
            "id": h.id,
            "query": h.query,
            "result": h.result,
            "sources": json.loads(h.sources) if h.sources else [],
            "created_at": h.created_at.isoformat()
        }
        for h in history
    ]

@app.get("/health")
def health_check():
    if INLINE:
        return {"status": "healthy", "mode": "inline"}
    try:
        redis_client.ping()
        return {"status": "healthy", "mode": "queue", "redis": "connected"}
    except redis.RedisError:
        return {"status": "unhealthy", "mode": "queue", "redis": "disconnected"}
