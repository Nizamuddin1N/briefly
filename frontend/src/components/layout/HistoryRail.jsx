import { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Plus, Search, SquarePen } from 'lucide-react'
import { useHistory, HISTORY_LIMIT } from '../../hooks/useHistory'
import { useAuth } from '../../hooks/useAuth'
import { groupByDate, shortWhen } from '../../lib/dates'
import ThemeToggle from '../ThemeToggle'

/** Wrap every match of `term` so the rail shows why a row survived the filter. */
function highlight(text, term) {
  if (!term) return text
  const index = text.toLowerCase().indexOf(term.toLowerCase())
  if (index === -1) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-highlighter-soft text-ink">{text.slice(index, index + term.length)}</mark>
      {text.slice(index + term.length)}
    </>
  )
}

export default function HistoryRail({ onNavigate }) {
  const [filter, setFilter] = useState('')
  const { data: history = [], isLoading, isError } = useHistory()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const groups = useMemo(() => {
    const term = filter.trim().toLowerCase()
    const matching = term
      ? history.filter((item) => item.query.toLowerCase().includes(term))
      : history
    return groupByDate(matching)
  }, [history, filter])

  const handleNew = () => {
    navigate('/')
    onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col bg-paper">
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <span className="font-reading text-sm font-semibold text-ink">Briefly</span>
      </div>

      <div className="px-3">
        <button
          type="button"
          onClick={handleNew}
          className="flex w-full items-center gap-2 rounded-control border border-rule bg-sheet px-3 py-2 text-xs font-semibold text-ink hover:bg-paper"
        >
          <Plus size={15} aria-hidden="true" />
          New research
        </button>
      </div>

      <div className="relative px-3 pb-2 pt-3">
        <Search
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute left-5.5 top-1/2 -translate-y-1/2 text-graphite"
        />
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter reports"
          aria-label="Filter reports"
          className="w-full rounded-control border border-rule bg-sheet py-1.5 pl-7 pr-2 text-2xs text-ink placeholder:text-graphite"
        />
      </div>

      <nav aria-label="Research history" className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
        {isLoading && <p className="px-1 py-2 text-2xs text-graphite">Loading…</p>}

        {isError && (
          <p className="px-1 py-2 text-2xs text-graphite">
            Your reports could not be loaded.
          </p>
        )}

        {!isLoading && !isError && history.length === 0 && (
          <p className="px-1 py-2 text-2xs leading-relaxed text-graphite">
            Your reports will appear here after your first question.
          </p>
        )}

        {!isLoading && history.length > 0 && groups.length === 0 && (
          <p className="px-1 py-2 text-2xs text-graphite">No report matches “{filter}”.</p>
        )}

        {groups.map((group) => (
          <section key={group.label} className="mb-3">
            <h2 className="px-1 pb-1 pt-2 text-2xs text-graphite">{group.label}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={`/report/${item.id}`}
                    onClick={() => onNavigate?.()}
                    className={({ isActive }) =>
                      [
                        'block border-l-[3px] py-1.5 pl-2.5 pr-2 text-2xs leading-snug hover:bg-sheet',
                        isActive
                          ? 'border-highlighter bg-sheet text-ink'
                          : 'border-transparent text-graphite hover:text-ink',
                      ].join(' ')
                    }
                  >
                    <span className="line-clamp-2">{highlight(item.query, filter.trim())}</span>
                    <span className="mt-0.5 block text-[11px] text-graphite">
                      {shortWhen(item.created_at)}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {history.length === HISTORY_LIMIT && (
          <p className="px-1 py-2 text-[11px] text-graphite">
            Showing your {HISTORY_LIMIT} most recent reports.
          </p>
        )}
      </nav>

      <div className="flex items-center gap-2 border-t border-rule px-3 py-2.5">
        <SquarePen size={14} aria-hidden="true" className="text-graphite" />
        <span className="min-w-0 flex-1 truncate text-2xs text-ink">
          {user?.username || 'Signed in'}
        </span>
        <ThemeToggle />
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out"
          className="grid size-8 place-items-center rounded-control text-graphite hover:bg-sheet hover:text-ink"
        >
          <LogOut size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
