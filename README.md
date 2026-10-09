<div align="center">

# ⚡ Briefly — AI Research Agent

**Ask a question. Get a sourced briefing in under a minute.**

A full-stack research assistant that searches the web, summarises the findings with an LLM,
and returns a readable report with its sources — behind JWT auth, an async task queue, and a
reading-first React interface.

### [**▶ Try the live demo**](https://ai-research-agent-omega-ten.vercel.app)

<sub>No setup, no card — create an account and run a query.</sub>

<br>

[![Live](https://img.shields.io/badge/demo-live-0f6b6b?style=flat-square)](https://ai-research-agent-omega-ten.vercel.app)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Postgres](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Celery](https://img.shields.io/badge/Celery-37814A?style=flat-square&logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![Groq](https://img.shields.io/badge/LLM-Groq-F55036?style=flat-square)](https://groq.com/)
[![License](https://img.shields.io/badge/license-MIT-black?style=flat-square)](LICENSE)

</div>

---

## 📋 Contents

| | |
|---|---|
| [What it does](#-what-it-does) | The flow, end to end |
| [Features](#-features) | What is actually built |
| [Architecture](#%EF%B8%8F-architecture) | How the pieces fit |
| [Tech stack](#%EF%B8%8F-tech-stack) | Every dependency and why |
| [Run it locally](#-run-it-locally) | Four steps |
| [Deployment](#%EF%B8%8F-deployment) | Two run modes, one codebase |
| [Engineering notes](#-engineering-notes) | The decisions worth defending |
| [Tests](#-tests) | What is covered |
| [Roadmap](#-roadmap) | What is next |

---

## 🎯 What it does

```
You type a question
      ↓
FastAPI accepts it and returns a task id immediately
      ↓
A worker searches the web (DuckDuckGo, top 3 results)
      ↓
Groq summarises the findings into structured markdown
      ↓
The report lands in your history, with every source linked
```

The request never blocks: an LLM round-trip takes seconds, so the API hands back a
`task_id` and the frontend polls for the result while showing honest progress.

---

## ✨ Features

|  | Feature | Detail |
|---|---|---|
| 🔍 | **Web-backed research** | Live search feeding an LLM summariser — not the model's memory |
| ⚡ | **Async task queue** | Celery over Redis, so the API stays responsive under concurrent users |
| 🔐 | **JWT authentication** | bcrypt-hashed passwords, bearer-token protected endpoints |
| 💬 | **Per-user history** | Every report persisted to PostgreSQL and browsable from the sidebar |
| 📚 | **Sourced reports** | Markdown rendered with numbered source notes in the margin |
| 🎙️ | **Voice input** | Dictate a question via the Web Speech API, where the browser supports it |
| ⌨️ | **Command palette** | <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> to jump to any past report |
| 🌗 | **Light & dark themes** | Follows the system setting, with no flash on load |
| ♿ | **Accessible** | Visible focus, landmarks, live regions, reduced-motion support |

<details>
<summary><b>Also in this repo — standalone learning modules</b> (click to expand)</summary>

<br>

These were written while learning the underlying techniques. They run on their own and are
**not** called by the `/research` endpoint — stated plainly so the repo does not overclaim:

| File | Demonstrates |
|---|---|
| `agent.py` | An autonomous agent with a hand-written ReAct loop, a tool registry, and an AST-sandboxed calculator |
| `rag_production.py` | A RAG pipeline: recursive chunking, persistent ChromaDB, similarity-scored retrieval |
| `rag.py` | Basic retrieve → stuff context → grounded answer |
| `embeddings.py` | Sentence-Transformers + vector similarity search |
| `structured.py` | Pydantic schema → JSON mode → validated typed output |
| `chat.py` | Multi-turn conversation memory |
| `main.py` | A first LLM call: tokens, temperature, system prompts |

They need extra dependencies: `pip install -r requirements-rag.txt`

</details>

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────┐
│            React Frontend                │
│   Auth · Composer · Report · History     │
└────────────────────┬─────────────────────┘
                     │ HTTPS + JWT bearer
┌────────────────────▼─────────────────────┐
│            FastAPI Backend               │
│  /signup /login /me                      │
│  /research /result/{id} /history /health │
└──────┬──────────────────────┬────────────┘
       │                      │
┌──────▼───────┐      ┌───────▼───────────┐
│  PostgreSQL  │      │  Celery + Redis   │
│ users·history│      │ background worker │
└──────────────┘      └───────┬───────────┘
                              │
                      ┌───────▼───────────┐
                      │  DDGS  +  Groq    │
                      │ search + summarise│
                      └───────────────────┘
```

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router, TanStack Query, Tailwind CSS v4, Radix UI |
| **Frontend content** | react-markdown + remark-gfm + rehype-sanitize, cmdk, sonner, lucide-react |
| **Backend** | FastAPI, Python 3.12, Pydantic v2, pydantic-settings |
| **Database** | PostgreSQL, SQLAlchemy 2 |
| **Auth** | JWT (python-jose), bcrypt via passlib |
| **Task queue** | Celery, Redis |
| **LLM** | Groq (`openai/gpt-oss-120b` by default, set via `GROQ_MODEL`) |
| **Web search** | DDGS (DuckDuckGo) |
| **RAG modules** | ChromaDB, Sentence Transformers (`all-MiniLM-L6-v2`) |
| **Testing** | pytest |

---

## 🚀 Run it locally

**Prerequisites** — Python 3.12+, Node 18+, PostgreSQL, Redis, and a free
[Groq API key](https://console.groq.com).

```bash
git clone https://github.com/Nizamuddin1N/briefly.git
cd briefly
```

<details open>
<summary><b>1 · Python environment</b></summary>

```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
```

</details>

<details open>
<summary><b>2 · Environment variables</b></summary>

```bash
cp .env.example .env
```

Generate a signing key rather than inventing one:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

```ini
GROQ_API_KEY=your-groq-key
GROQ_MODEL=openai/gpt-oss-120b
SECRET_KEY=the-generated-hex-string
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/research_agent
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:3000
```

> [!WARNING]
> **Groq retires hosted models.** This project originally targeted
> `llama-3.3-70b-versatile`, which is no longer served — hence the configurable `GROQ_MODEL`.
> If a model id stops working, list what your key can actually reach with
> `Groq(api_key=...).models.list()` and set `GROQ_MODEL` to one of them.

> [!CAUTION]
> Early commits in this repository contained a hardcoded database password and JWT signing
> key. Both have been revoked and moved to environment variables. If you forked before that
> change, rotate your own credentials — anything committed to git history is public.

</details>

<details>
<summary><b>3 · Database</b></summary>

Create the database; the tables are created on first start.

```sql
CREATE DATABASE research_agent;
```

</details>

<details open>
<summary><b>4 · Start the services</b> (three terminals)</summary>

```bash
# 1 — API
uvicorn api:app --reload

# 2 — Celery worker  (--pool=solo is required on Windows)
celery -A tasks worker --loglevel=info --pool=solo

# 3 — Frontend
cd frontend && npm install && npm run dev
```

</details>

**Open [localhost:3000](http://localhost:3000)** and create an account.
Interactive API docs live at [localhost:8000/docs](http://localhost:8000/docs).

---

## ☁️ Deployment

Live on Vercel as two projects — the Vite frontend, and FastAPI as a Python serverless
function — against a free-tier Neon Postgres.

**The interesting constraint:** Vercel has no always-on process, so a Celery worker cannot
run there. A queued task would never be consumed and every request would hang at `pending`.

Rather than fork the codebase, the pipeline lives in `research.run_research` and a single
setting chooses how it is scheduled:

| `RESEARCH_MODE` | Where | Behaviour |
|---|---|---|
| `queue` *(default)* | local | `/research` hands off to a Celery worker over Redis |
| `inline` | Vercel | `/research` runs the pipeline in-request and stores the finished row |

Both paths execute **identical code** and return **identical response shapes**, so the
frontend is unchanged between them. A live run takes roughly 7 seconds.

<details>
<summary><b>Environment variables per project</b></summary>

<br>

**API project** — `GROQ_API_KEY`, `GROQ_MODEL`, `SECRET_KEY`, `DATABASE_URL` (injected by the
Neon integration), `RESEARCH_MODE=inline`, `CORS_ORIGINS` set to the frontend origin.

**Frontend project** — `VITE_API_URL` pointing at the API deployment. Vite inlines this at
build time, so changing it requires a redeploy.

</details>

---

## 🧠 Engineering notes

<details open>
<summary><b>Why a task queue?</b></summary>

An LLM summarisation round-trip takes seconds. Doing it inside the request would hold an HTTP
connection open and occupy a worker, so `/research` returns a `task_id` immediately and the
client polls `/result/{task_id}`.

</details>

<details>
<summary><b>Why history rows are keyed on <code>task_id</code></b></summary>

An earlier version matched the most recent row with the same query text. Asking the same
question twice silently overwrote the earlier report. The Celery task id is the only stable
key, so `ResearchHistory.task_id` is now unique and indexed, and `/result` scopes its lookup
to the requesting user — polling someone else's task returns 404.

</details>

<details>
<summary><b>Why the calculator tool does not use <code>eval()</code></b></summary>

The agent's tool input is LLM-generated. `calculate` parses the expression to an AST and walks
it against an operator whitelist, rejecting names, calls and attribute access — a cleared
`__builtins__` is a well-known bypassable sandbox. Exponents are capped too, so a
seven-character input like `9**9**9` cannot pin a worker computing a 369-million-digit integer.

</details>

<details>
<summary><b>Why the UI reads like a document</b></summary>

A report is prose, not a chat transcript. The answer runs in one measured column of Literata at
a 68-character measure with its sources as numbered notes in the margin. While a task runs, the
research log shows only states the backend actually reports — sent, waiting, searching, ready —
with an elapsed timer. No invented progress bar, and no invented source titles: the API returns
bare URLs, so every source note is derived from its URL.

</details>

<details>
<summary><b>Why LLM markdown is sanitised</b></summary>

Model output is untrusted HTML-wise. `react-markdown` runs `rehype-sanitize`, and every
external link carries `rel="noopener noreferrer"`.

</details>

---

## 🧪 Tests

```bash
pytest test_agent.py -v
```

The unit tests mock both the web search and the Groq client, so they run **offline** with no
API key and no network:

```
test_agent.py::test_research_task_returns_correct_structure PASSED
test_agent.py::test_research_task_handles_no_results        PASSED
test_agent.py::test_query_is_preserved_in_result            PASSED
3 passed
```

For a full check against a running stack:

```bash
python test_api.py
```

It signs up a throwaway user, submits a query, polls until the worker finishes, and prints the
report with its sources.

---

## 🔮 Roadmap

- [x] Core RAG pipeline *(standalone)*
- [x] Autonomous agent with web search *(standalone)*
- [x] Async task queue
- [x] React dashboard
- [x] User authentication
- [x] Per-user history
- [x] Live deployment
- [ ] Wire the ReAct loop and retrieval into the live `/research` path
- [ ] Rate limiting
- [ ] Alembic migrations
- [ ] Endpoint test coverage
- [ ] Docker Compose for one-command local setup
