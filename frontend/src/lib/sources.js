/**
 * The API returns sources as bare URLs — no titles, no snippets. Everything a
 * source note displays is therefore derived from the URL itself. Nothing here
 * invents a title; the path hint is only ever a readable version of the path.
 */

/** @param {string} url */
export function describeSource(url) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    // Not a parseable URL — show it as-is rather than dropping the source.
    return { url, domain: url, hint: '', favicon: null, valid: false }
  }

  const domain = parsed.hostname.replace(/^www\./, '')

  return {
    url,
    domain,
    hint: pathHint(parsed),
    favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`,
    valid: true,
  }
}

/**
 * Turn the last meaningful path segment into something readable:
 * `/wiki/Solid-state_battery` → "Solid state battery". Returns an empty string
 * for a bare domain, so the note simply shows the domain alone.
 */
function pathHint(parsed) {
  const segments = parsed.pathname.split('/').filter(Boolean)
  if (segments.length === 0) return ''

  // Walk back past purely numeric segments — a date path like
  // /news/2024/12/31/12345 should fall through to "news", not to "31".
  let index = segments.length - 1
  let last = segments[index].replace(/\.(html?|php|aspx?|jsp)$/i, '')
  while (/^\d+$/.test(last) && index > 0) {
    index -= 1
    last = segments[index]
  }
  if (/^\d+$/.test(last)) return ''

  const words = decodeURIComponent(last)
    .replace(/[-_+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!words || words.length > 80) return ''
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** First letter of the domain, for the tile shown when a favicon fails. */
export function faviconFallback(domain) {
  return (domain || '?').charAt(0).toUpperCase()
}
