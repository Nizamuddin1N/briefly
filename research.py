"""Core research pipeline, independent of how it is scheduled.

Locally this runs inside a Celery worker. On Vercel there is no always-on
process to run a worker, so the same function is called inline from the request
handler. Keeping it here means both paths execute identical code.
"""
from ddgs import DDGS
from groq import Groq

from config import settings

client = Groq(api_key=settings.groq_api_key)

SYSTEM_PROMPT = (
    "You are a research assistant. Summarise the search results into a clear, "
    "structured response."
)


def run_research(user_query: str) -> dict:
    """Search the web for `user_query` and summarise the findings.

    Returns the same shape in both modes:
        {status, query, result, sources}
    where status is "completed", or "error" when the search found nothing.
    """
    with DDGS() as ddgs:
        results = list(ddgs.text(user_query, max_results=3))

    if not results:
        return {
            "status": "error",
            "query": user_query,
            "result": "No results found",
            "sources": [],
        }

    context = "\n".join(f"- {r['title']}: {r['body']}" for r in results)

    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Search results:\n{context}\n\nQuery: {user_query}",
            },
        ],
        temperature=0.3,
    )

    return {
        "status": "completed",
        "query": user_query,
        "result": response.choices[0].message.content,
        "sources": [r["href"] for r in results if "href" in r],
    }
