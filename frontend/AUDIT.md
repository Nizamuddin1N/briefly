# Frontend audit — baseline before the "Reading Room" redesign

Written for Task 0.2 of `FRONTEND_IMPLEMENTATION_PLAN.md`. Facts only, recorded before any
redesign work began.

## Where the frontend came from

The plan describes a Create React App frontend committed as a gitlink. That is no longer the
state of the repo. In the session immediately before this one, the broken gitlink was cleared
(`git rm --cached frontend`) and the frontend was rebuilt from scratch on Vite, because the
original CRA source was not recoverable — it existed only as a dangling submodule pointer to
commit `82b0d72`, and the user confirmed they did not have the files locally.

So this audit describes a small, freshly scaffolded Vite app, not a legacy CRA app.

## Current files

```
frontend/
  index.html            plain Vite entry, no pre-paint theme script
  vite.config.js        React plugin, dev server pinned to 5173
  package.json          react 18.3.1, react-dom, axios, react-markdown; vite 6, @vitejs/plugin-react
  .env.example          VITE_API_URL=http://127.0.0.1:8000
  .gitignore            node_modules, dist, .env
  src/
    main.jsx            ReactDOM.createRoot, imports index.css
    App.jsx             the entire application in one component (~190 lines)
    api.js              axios instance, token helpers, endpoint functions
    index.css           hand-written dark-only stylesheet (~300 lines)
    components/
      AuthForm.jsx      combined login/signup with a tab switcher
      ResultView.jsx    markdown body + numbered source list
```

## How it currently works

**Token storage.** `localStorage` under the key `token` (plain string, not `ra_token`). An axios
request interceptor attaches `Authorization: Bearer <token>` to every request. There is no
response interceptor, so a 401 is handled ad hoc by whichever caller made the request.

**Session restore.** `App.jsx` calls `/me` on mount when a token exists and clears it on failure.

**Polling.** Hand-rolled recursion in `App.jsx`: `poll(taskId, attempt)` calls `/result/{id}`,
and on a non-terminal status schedules itself again via `setTimeout` at a flat 2000 ms, giving
up after 45 attempts. The timer id lives in a `useRef` and is cleared on unmount. There is no
caching layer and no back-off.

**Routing.** None. The app switches between three views with local state: a loading check, the
auth form, and the dashboard. There are no URLs for reports, so nothing is linkable or
refreshable.

**Auth calls.** `/login` correctly posts `application/x-www-form-urlencoded` via
`URLSearchParams`; `/signup` posts JSON. Both store the returned token and set the username.

**Theme.** Dark only. Colours are hardcoded CSS custom properties on `:root` in `index.css`.
There is no light palette, no `data-theme` attribute, and no toggle.

**Markdown.** `react-markdown` with no plugins — no `remark-gfm`, so GFM tables and strikethrough
do not render, and no `rehype-sanitize`, which means LLM output is not sanitised.

## Features present

| Feature | State |
|---|---|
| Login / signup | Present, works |
| Submit a research query | Present, works |
| Poll for a result | Present, flat interval |
| Markdown report | Present, unplugged `react-markdown` |
| Source links | Present, plain numbered list below the body |
| History list | Present, right sidebar, flat (no date grouping, no filter) |
| Voice input | **Absent** |
| Command palette | **Absent** |
| Copy / download report | **Absent** |
| Light theme | **Absent** |
| Routing / linkable reports | **Absent** |

## Problems found

1. **No `rehype-sanitize`** on LLM-generated markdown.
2. **No response interceptor**, so an expired JWT produces an inconsistent failure per call site.
3. **Flat 2 s polling** with no back-off, and in-flight tasks are lost on refresh — nothing is
   persisted to `sessionStorage`, and `/history` deliberately excludes in-flight rows.
4. **No URLs**, so a report cannot be linked, bookmarked, or reloaded.
5. **Dark-only** with no `prefers-color-scheme` support.
6. **Everything in `App.jsx`** — polling, auth state, history and layout in one component.
7. Accessibility unverified: no landmarks, no live region on the pending state, no focus styles
   beyond the browser default.

## Conflicts with the plan's stated assumptions

The plan says the real code wins and that conflicts should be recorded here. Four items in
§0 are out of date:

1. **"The frontend is not actually in the GitHub repo" (§0, Task 0.1).** Already resolved. The
   gitlink was removed and `frontend/` is staged as a normal tree. Nothing remains to do; there
   is no nested `frontend/.git`.
2. **"CORS allows only `http://localhost:3000`" (§0).** No longer true. CORS is read from the
   `CORS_ORIGINS` environment variable via `config.py`, defaulting to
   `http://localhost:5173,http://localhost:3000`. Both ports work with no backend edit. The plan's
   instruction to pin Vite to port 3000 is still followed, for consistency with the plan.
3. **Appendix A.4 — "`/result` matches the history row by query text."** Already implemented.
   `ResearchHistory` now has a unique, indexed `task_id` column, `/research` writes it, and
   `/result` matches on it. `/result` additionally scopes the lookup to the current user and
   returns 404 for an unknown task.
4. **Phase 1 — "migrate off CRA, remove `react-scripts`."** Not applicable. The app is already
   Vite 6 with React 18; `react-scripts` was never installed. Phase 1 reduces to installing the
   new dependencies and re-pinning the dev-server port.

One further note: `/signup` now enforces `EmailStr`, a username of 3–50 characters, and a
password of 8–72 characters. A 422 response carries a Pydantic error array rather than a plain
`detail` string, so client error handling must read both shapes.
