import { AlertCircle } from 'lucide-react'

/** Says what happened and what to do next. No apology, no vague wording. */
export default function ErrorState({ title, children, action, tone = 'danger' }) {
  const isDanger = tone === 'danger'
  return (
    <div
      role="alert"
      className={[
        'rounded-sheet border px-5 py-4',
        isDanger ? 'border-danger/35 bg-danger-soft' : 'border-rule bg-sheet',
      ].join(' ')}
    >
      <div className="flex gap-3">
        <AlertCircle
          size={18}
          aria-hidden="true"
          className={`mt-0.5 shrink-0 ${isDanger ? 'text-danger' : 'text-graphite'}`}
        />
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          {children && <div className="mt-1 text-xs text-graphite">{children}</div>}
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  )
}
