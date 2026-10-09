import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Composer from '../components/composer/Composer'
import ErrorState from '../components/ErrorState'
import { startResearch } from '../api/research'
import { rememberTask } from '../lib/inflight'
import { useHistory } from '../hooks/useHistory'
import { shortWhen } from '../lib/dates'

const SUGGESTIONS = [
  'How is RAG different from fine-tuning?',
  'What changed in the EU AI Act in 2026?',
  'Compare Celery and RQ for task queues',
]

export default function NewResearchPage() {
  const location = useLocation()
  const [query, setQuery] = useState(location.state?.prefill || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: history = [] } = useHistory()

  useEffect(() => {
    document.title = 'New research — Briefly'
  }, [])

  const submit = async (text) => {
    setBusy(true)
    setError(null)
    try {
      const task = await startResearch(text)
      rememberTask(task.task_id, text)
      queryClient.setQueryData(['task', task.task_id], {
        task_id: task.task_id,
        status: 'pending',
      })
      navigate(`/task/${task.task_id}`)
    } catch (err) {
      setError(err?.message || 'Could not start the research.')
      setBusy(false)
    }
  }

  const recent = history.slice(0, 3)

  return (
    <div className="mx-auto w-full max-w-[720px] pt-8 md:pt-16">
      <h1 className="font-reading text-xl font-semibold leading-tight text-ink md:text-2xl">
        What do you want to find out?
      </h1>

      <div className="mt-6">
        <Composer
          value={query}
          onChange={setQuery}
          onSubmit={submit}
          busy={busy}
          autoFocus
        />
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState title="The research could not be started">{error}</ErrorState>
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-2xs text-graphite">Try one of these</h2>
        <ul className="mt-2 space-y-1">
          {SUGGESTIONS.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => setQuery(suggestion)}
                className="rounded-control px-2 py-1.5 text-left text-xs text-ink hover:bg-sheet"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {recent.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xs text-graphite">Continue where you left off</h2>
          <ul className="mt-2 space-y-1">
            {recent.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/report/${item.id}`)}
                  className="flex w-full items-baseline gap-3 rounded-control px-2 py-1.5 text-left hover:bg-sheet"
                >
                  <span className="min-w-0 flex-1 truncate text-xs text-ink">{item.query}</span>
                  <span className="shrink-0 text-[11px] text-graphite">
                    {shortWhen(item.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
