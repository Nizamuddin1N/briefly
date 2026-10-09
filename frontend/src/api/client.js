import axios from 'axios'

export const TOKEN_KEY = 'ra_token'
const LEGACY_TOKEN_KEY = 'token' // pre-redesign key; migrated once on load

export function getToken() {
  try {
    const legacy = localStorage.getItem(LEGACY_TOKEN_KEY)
    if (legacy && !localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, legacy)
      localStorage.removeItem(LEGACY_TOKEN_KEY)
    }
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* storage blocked — the session lasts until reload */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
  } catch {
    /* nothing to do */
  }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Registered by AuthProvider so the interceptor can hand a 401 back to the app
 * without importing the router here.
 */
let onUnauthorized = null
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

/** FastAPI returns `detail` as a string, or as a Pydantic error array on 422. */
function readDetail(data) {
  const detail = data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0]
    const field = first?.loc?.[first.loc.length - 1]
    return field ? `${field}: ${first.msg}` : first?.msg
  }
  return null
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''

    if (!error.response) {
      return Promise.reject({
        status: 0,
        message:
          "Can't reach the server. Check that the API is running on port 8000.",
      })
    }

    // A 401 on /login is a wrong password, not an expired session.
    if (status === 401 && !url.includes('/login')) {
      clearToken()
      onUnauthorized?.()
      return Promise.reject({ status, message: 'Your session expired. Sign in again.' })
    }

    return Promise.reject({
      status,
      message: readDetail(error.response.data) || 'Something went wrong.',
    })
  }
)

export default client
