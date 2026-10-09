import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'ra_theme'
const MODES = ['system', 'light', 'dark']

/** A tiny shared store so every consumer sees the same mode without a provider. */
const listeners = new Set()

function read() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return MODES.includes(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

let mode = read()

function prefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Resolve `system` against the OS setting and write it to <html>. */
function apply() {
  const resolved = mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode
  document.documentElement.setAttribute('data-theme', resolved)
}

function emit() {
  apply()
  listeners.forEach((fn) => fn())
}

// Follow the OS while the user is on `system`.
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (mode === 'system') emit()
  })
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function getSnapshot() {
  return mode
}

export function useTheme() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const setTheme = useCallback((next) => {
    if (!MODES.includes(next)) return
    mode = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode or blocked storage — the theme still applies for this session.
    }
    emit()
  }, [])

  const resolved =
    value === 'system'
      ? typeof window !== 'undefined' && prefersDark()
        ? 'dark'
        : 'light'
      : value

  return { theme: value, resolved, setTheme, modes: MODES }
}
