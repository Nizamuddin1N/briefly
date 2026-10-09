/** Export helpers for a finished report. */

export function slugify(text, max = 60) {
  return (
    (text || 'report')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, max)
      .replace(/-+$/, '') || 'report'
  )
}

/** The report body plus a Sources list, as one markdown document. */
export function toMarkdown({ query, result, sources = [] }) {
  const parts = [`# ${query}`, '', result?.trim() || '']
  if (sources.length) {
    parts.push('', '## Sources', '')
    sources.forEach((url, index) => parts.push(`${index + 1}. ${url}`))
  }
  return parts.join('\n')
}

/** Clipboard API needs a secure context; fall back to a hidden textarea. */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

export function downloadMarkdown(filename, text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.md') ? filename : `${filename}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
