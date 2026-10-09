from celery import Celery
from ddgs import DDGS

from config import settings
from research import run_research

# Connect Celery to Redis
celery_app = Celery(
    "research_tasks",
    broker=settings.redis_url,      # Redis as message queue
    backend=settings.redis_url      # Redis stores results too
)

# ---- CELERY TASKS ----
# The @celery_app.task decorator makes this run in background

@celery_app.task
def search_web_task(query: str) -> str:
    """Background task to search the web"""
    print(f"Worker: searching for '{query}'")
    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=3))

    if not results:
        return "No results found"

    formatted = []
    for r in results:
        formatted.append(f"Title: {r['title']}\nSummary: {r['body']}")

    return "\n\n".join(formatted)

@celery_app.task
def research_agent_task(user_query: str) -> dict:
    """Full research agent running as background task.

    The work itself lives in research.run_research so the serverless
    deployment, which has no worker, can call exactly the same code.
    """
    print(f"Worker: starting research for '{user_query}'")
    return run_research(user_query)
