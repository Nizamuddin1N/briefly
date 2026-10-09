import { useEffect, useMemo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import SourceMargin from './SourceMargin'
import ReportActions from './ReportActions'
import { describeWhen } from '../../lib/dates'

/**
 * Link `[n]` markers to the matching source note, but only when n actually
 * refers to a source we have. The backend does not emit citation markers yet
 * (Appendix A.2), so on today's output this is a no-op rather than a fake.
 * Skips fenced code and reference-style definitions like `[1]: https://…`.
 */
function linkCitations(markdown, sourceCount) {
  if (!markdown || sourceCount === 0) return markdown || ''
  return markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((segment, index) => {
      if (index % 2 === 1) return segment // inside code — leave alone
      return segment.replace(/\[(\d{1,2})\](?![(:])/g, (match, digits) => {
        const n = Number(digits)
        return n >= 1 && n <= sourceCount ? `[${n}](#source-${n})` : match
      })
    })
    .join('')
}

const MARKDOWN_COMPONENTS = {
  // GFM tables scroll inside their own box instead of widening the page.
  table: ({ node, ...props }) => (
    <div className="table-scroll">
      <table {...props} />
    </div>
  ),
  a: ({ node, href = '', children, ...props }) => {
    if (href.startsWith('#source-')) {
      return (
        <a
          href={href}
          className="citation"
          onClick={(event) => {
            event.preventDefault()
            const target = document.querySelector(href)
            if (!target) return
            target.scrollIntoView({ behavior: 'smooth', block: 'center' })
            target.classList.add('bg-highlighter-soft')
            window.setTimeout(() => target.classList.remove('bg-highlighter-soft'), 1200)
          }}
          {...props}
        >
          {children}
        </a>
      )
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    )
  },
}

export default function ReportView({
  query,
  result,
  sources = [],
  createdAt,
  animate = false,
  onResearchAgain,
}) {
  const body = useMemo(() => linkCitations(result, sources.length), [result, sources.length])

  useEffect(() => {
    document.title = query ? `${query} — Briefly` : 'Briefly'
    return () => {
      document.title = 'Briefly'
    }
  }, [query])

  return (
    <article className="mx-auto w-full max-w-[1100px]">
      <header className="mb-6">
        <h1 className="font-reading text-xl font-semibold leading-tight text-ink break-words md:text-2xl">
          {query}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-graphite">
          {createdAt && <span>Researched {describeWhen(createdAt)}</span>}
          <span>
            {sources.length} {sources.length === 1 ? 'source' : 'sources'}
          </span>
        </div>
      </header>

      <div className="border-t border-rule pt-6 xl:grid xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-10">
        <div className="min-w-0">
          <div className={`prose ${animate ? 'report-body-enter' : ''}`}>
            <Markdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={MARKDOWN_COMPONENTS}
            >
              {body}
            </Markdown>
          </div>

          <ReportActions
            query={query}
            result={result}
            sources={sources}
            onResearchAgain={onResearchAgain}
          />
        </div>

        {/* Margin on wide screens; a plain section under the report below 1280px. */}
        <aside
          aria-label="Sources"
          className="mt-10 border-t border-rule pt-5 xl:mt-0 xl:border-0 xl:pt-0"
        >
          <div className="xl:sticky xl:top-6">
            <SourceMargin sources={sources} animate={animate} />
          </div>
        </aside>
      </div>
    </article>
  )
}
