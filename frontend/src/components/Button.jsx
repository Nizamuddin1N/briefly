/** Shared button shapes so the same action looks the same everywhere. */
const VARIANTS = {
  primary:
    'bg-teal text-teal-contrast font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'border border-rule bg-sheet text-ink hover:bg-paper disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'text-graphite hover:bg-paper hover:text-ink disabled:opacity-50',
}

export default function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-control px-3.5 py-2 text-xs transition-opacity',
        VARIANTS[variant],
        className,
      ].join(' ')}
      {...props}
    />
  )
}
