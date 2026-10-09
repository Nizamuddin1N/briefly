/** Quiet placeholder that invites the next action rather than just reporting emptiness. */
export default function EmptyState({ title, children, action }) {
  return (
    <div className="rounded-sheet border border-rule bg-sheet px-6 py-8">
      <p className="font-reading text-base text-ink">{title}</p>
      {children && <div className="mt-2 text-xs text-graphite">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
