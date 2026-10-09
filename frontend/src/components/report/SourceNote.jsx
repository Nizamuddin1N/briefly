import { useState } from 'react'
import { describeSource, faviconFallback } from '../../lib/sources'

/**
 * One numbered note in the margin. Everything shown is derived from the URL —
 * the API sends no titles, so nothing here is invented.
 */
export default function SourceNote({ url, index, animate = false }) {
  const [faviconFailed, setFaviconFailed] = useState(false)
  const { domain, hint, favicon, valid } = describeSource(url)

  return (
    <li
      id={`source-${index}`}
      className={animate ? 'source-note-enter' : undefined}
      style={animate ? { animationDelay: `${(index - 1) * 60}ms` } : undefined}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex gap-2.5 rounded-control px-2 py-2 no-underline hover:bg-sheet"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-[3px] text-[11px] font-semibold tabular-nums text-graphite group-hover:bg-highlighter group-hover:text-ink group-focus-visible:bg-highlighter"
        >
          {index}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            {favicon && !faviconFailed ? (
              <img
                src={favicon}
                alt=""
                width={14}
                height={14}
                loading="lazy"
                onError={() => setFaviconFailed(true)}
                className="size-3.5 shrink-0 rounded-[2px]"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid size-3.5 shrink-0 place-items-center rounded-[2px] bg-rule text-[9px] font-semibold text-graphite"
              >
                {faviconFallback(domain)}
              </span>
            )}
            <span className="truncate text-2xs font-semibold text-ink">{domain}</span>
          </span>

          {hint && (
            <span className="mt-0.5 block text-[11px] leading-snug text-graphite">{hint}</span>
          )}
          {!valid && (
            <span className="mt-0.5 block break-all text-[11px] text-graphite">{url}</span>
          )}
        </span>
      </a>
    </li>
  )
}
