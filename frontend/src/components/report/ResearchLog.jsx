import { useEffect, useState } from 'react'
import { formatElapsed } from '../../lib/dates'

/**
 * Only the states the backend actually reports. There are no worker progress
 * stages (see Appendix A.3), so this shows four honest steps and an elapsed
 * timer rather than inventing a percentage.
 */
const STEPS = [
  { key: 'sent', label: 'Question sent' },
  { key: 'pending', label: 'Waiting for a worker' },
  { key: 'running', label: 'Searching the web and summarising' },
  { key: 'done', label: 'Report ready' },
]

function currentIndex(status) {
  if (status === 'running') return 2
  if (status === 'pending') return 1
  return 0
}

export default function ResearchLog({ status, startedAt }) {
  const [now, setNow] = useState(() => Date.now())
  const active = currentIndex(status)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div>
      <ol className="space-y-2.5" aria-live="polite">
        {STEPS.map((step, index) => {
          const isDone = index < active
          const isActive = index === active
          return (
            <li key={step.key} className="flex items-center gap-3 text-xs">
              <span
                aria-hidden="true"
                className={[
                  'size-2 shrink-0 rounded-full',
                  isDone ? 'bg-teal' : isActive ? 'bg-teal pulse-dot' : 'bg-rule',
                ].join(' ')}
              />
              <span className={isActive || isDone ? 'text-ink' : 'text-graphite'}>
                {step.label}
                {isActive && <span className="sr-only"> — in progress</span>}
              </span>
            </li>
          )
        })}
      </ol>

      <p className="mt-4 text-2xs tabular-nums text-graphite">
        Elapsed {formatElapsed(now - startedAt)}
      </p>

      {/* Placeholder lines so the swap to the finished report does not jump. */}
      <div className="mt-8 space-y-3" aria-hidden="true">
        {[100, 96, 88, 92, 60].map((width, index) => (
          <div key={index} className="skeleton-line" style={{ width: `${width}%` }} />
        ))}
      </div>
    </div>
  )
}
