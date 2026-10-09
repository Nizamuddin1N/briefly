/**
 * Response shapes from the FastAPI backend, kept as JSDoc typedefs so editors
 * can check call sites without adding TypeScript to the build.
 *
 * @typedef {Object} AuthResponse
 * @property {string} access_token
 * @property {string} token_type
 * @property {string} username
 *
 * @typedef {Object} User
 * @property {string} username
 * @property {string} email
 *
 * @typedef {Object} TaskAccepted
 * @property {string} task_id
 * @property {'queued'} status
 * @property {string} message
 *
 * @typedef {Object} ResearchPayload
 * @property {'completed'|'error'} status  `error` means the search returned nothing
 * @property {string} query
 * @property {string} result                markdown from the LLM
 * @property {string[]} sources             URLs only — no titles, no snippets
 *
 * @typedef {Object} TaskResult
 * @property {string} task_id
 * @property {'pending'|'running'|'completed'|'failed'} status
 * @property {ResearchPayload} [result]     present only when status is completed
 *
 * @typedef {Object} HistoryItem
 * @property {number} id
 * @property {string} query
 * @property {string} result
 * @property {string[]} sources
 * @property {string} created_at            ISO 8601
 */

export {}
