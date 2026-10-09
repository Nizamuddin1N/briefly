/**
 * The API stores timestamps in UTC. Rows written before the column became
 * timezone-aware serialise without an offset, which JavaScript would read as
 * local time — so treat a bare timestamp as UTC.
 */
export function parseTimestamp(value) {
  if (!value) return null
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
  const date = new Date(hasZone ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/** Whole days between `date` and today, in the viewer's own timezone. */
function daysAgo(date) {
  const diff = startOfDay(new Date()) - startOfDay(date)
  return Math.round(diff / 86_400_000)
}

export function groupLabel(date) {
  const days = daysAgo(date)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'Previous 7 days'
  return 'Earlier'
}

const GROUP_ORDER = ['Today', 'Yesterday', 'Previous 7 days', 'Earlier']

/**
 * Bucket history items by age, preserving the newest-first order the API
 * already returns.
 * @param {{created_at: string}[]} items
 */
export function groupByDate(items = []) {
  const buckets = new Map()
  for (const item of items) {
    const date = parseTimestamp(item.created_at)
    const label = date ? groupLabel(date) : 'Earlier'
    if (!buckets.has(label)) buckets.set(label, [])
    buckets.get(label).push(item)
  }
  return GROUP_ORDER.filter((label) => buckets.has(label)).map((label) => ({
    label,
    items: buckets.get(label),
  }))
}

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
})

/** "today at 14:02" / "yesterday at 09:10" / "on 3 Apr at 18:40" */
export function describeWhen(value) {
  const date = parseTimestamp(value)
  if (!date) return ''
  const days = daysAgo(date)
  const time = timeFormat.format(date)
  if (days <= 0) return `today at ${time}`
  if (days === 1) return `yesterday at ${time}`
  return `on ${dateFormat.format(date)} at ${time}`
}

/** Compact label for the history rail. */
export function shortWhen(value) {
  const date = parseTimestamp(value)
  if (!date) return ''
  return daysAgo(date) <= 0 ? timeFormat.format(date) : dateFormat.format(date)
}

/** mm:ss elapsed, used by the research log. */
export function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
