import SourceNote from './SourceNote'

/**
 * Desktop: a true margin beside the report. Below 1200px the same list renders
 * as a "Sources" section under the body — same component, different placement,
 * handled by the parent's layout classes.
 */
export default function SourceMargin({ sources = [], animate = false, heading = 'Sources' }) {
  if (sources.length === 0) {
    return (
      <div className="text-2xs text-graphite">
        <h2 className="mb-1 text-2xs font-semibold text-ink">{heading}</h2>
        <p>This report came back without source links.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-1 px-2 text-2xs font-semibold text-ink">{heading}</h2>
      <ol className="-mx-0.5">
        {sources.map((url, index) => (
          <SourceNote key={`${url}-${index}`} url={url} index={index + 1} animate={animate} />
        ))}
      </ol>
    </div>
  )
}
