/**
 * The API's /history deliberately excludes in-flight rows, so a refresh during
 * a run would otherwise lose the question that was asked. Keep a small record
 * in sessionStorage keyed by task id.
 */
const KEY = 'ra_inflight'

function readAll() {
  try {
    const raw = sessionStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    /* storage blocked — polling still works, only the query text is lost */
  }
}

export function rememberTask(taskId, query) {
  const map = readAll()
  map[taskId] = { query, startedAt: Date.now() }
  writeAll(map)
}

export function recallTask(taskId) {
  return readAll()[taskId] || null
}

export function forgetTask(taskId) {
  const map = readAll()
  if (taskId in map) {
    delete map[taskId]
    writeAll(map)
  }
}
