import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import ResearchLog from '../components/report/ResearchLog'
import ReportView from '../components/report/ReportView'
import ErrorState from '../components/ErrorState'
import Button from '../components/Button'
import Composer from '../components/composer/Composer'
import { useResearchTask } from '../hooks/useResearchTask'
import { startResearch } from '../api/research'
import { rememberTask } from '../lib/inflight'

const SLOW_AFTER_MS = 90_000

export default function TaskPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const task = useResearchTask(taskId)
  const [slow, setSlow] = useState(false)
  const [keepWaiting, setKeepWaiting] = useState(false)
  const [retryQuery, setRetryQuery] = useState('')
  const [retryBusy, setRetryBusy] = useState(false)

  const { status, startedAt } = task
  const isTerminal = status === 'completed' || status === 'failed'

  useEffect(() => {
    if (isTerminal) return undefined
    const id = window.setInterval(() => {
      if (Date.now() - startedAt > SLOW_AFTER_MS) setSlow(true)
    }, 1000)
    return () => window.clearInterval(id)
  }, [isTerminal, startedAt])

  useEffect(() => {
    if (!isTerminal) document.title = 'Researching… — Briefly'
  }, [isTerminal])

  const resubmit = async (text) => {
    if (!text?.trim()) return
    setRetryBusy(true)
    try {
      const next = await startResearch(text.trim())
      rememberTask(next.task_id, text.trim())
      queryClient.setQueryData(['task', next.task_id], {
        task_id: next.task_id,
        status: 'pending',
      })
      navigate(`/task/${next.task_id}`, { replace: true })
    } catch {
      setRetryBusy(false)
    }
  }

  // The task id is unknown to this account, or the URL was mistyped.
  if (task.isError) {
    return (
      <div className="mx-auto w-full max-w-[720px] pt-8">
        <ErrorState title="That research task could not be found">
          It may belong to a different account, or the link may be out of date.
          <div className="mt-3">
            <Button onClick={() => navigate('/')}>Start new research</Button>
          </div>
        </ErrorState>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="mx-auto w-full max-w-[720px] pt-8">
        <h1 className="mb-5 font-reading text-lg font-semibold text-ink break-words">{task.query}</h1>
        <ErrorState title="The research job failed before finishing">
          Your question is saved in the box below — try again.
        </ErrorState>
        <div className="mt-4">
          <Composer
            value={retryQuery || task.query}
            onChange={setRetryQuery}
            onSubmit={resubmit}
            busy={retryBusy}
            submitLabel="Try again"
          />
        </div>
      </div>
    )
  }

  if (status === 'completed') {
    const payload = task.data?.result || {}

    // A completed task can still carry no findings; that is not a success.
    if (payload.status === 'error' || !payload.result) {
      return (
        <div className="mx-auto w-full max-w-[720px] pt-8">
          <h1 className="mb-5 font-reading text-lg font-semibold text-ink break-words">
            {payload.query || task.query}
          </h1>
          <ErrorState tone="quiet" title="No web results came back for this question">
            Try wording it more specifically.
          </ErrorState>
          <div className="mt-4">
            <Composer
              value={retryQuery || payload.query || task.query}
              onChange={setRetryQuery}
              onSubmit={resubmit}
              busy={retryBusy}
              submitLabel="Research"
            />
          </div>
        </div>
      )
    }

    return (
      <ReportView
        query={payload.query || task.query}
        result={payload.result}
        sources={payload.sources || []}
        createdAt={new Date(startedAt).toISOString()}
        animate
        onResearchAgain={() => resubmit(payload.query || task.query)}
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-[720px] pt-8">
      <h1 className="mb-6 font-reading text-lg font-semibold leading-snug text-ink break-words md:text-xl">
        {task.query || 'Researching…'}
      </h1>

      <ResearchLog status={status} startedAt={startedAt} />

      {slow && !keepWaiting && (
        <div className="mt-8">
          <ErrorState tone="quiet" title="This is taking longer than usual">
            The worker may be busy — you can keep waiting or try again.
            <div className="mt-3 flex gap-2">
              <Button onClick={() => setKeepWaiting(true)}>Keep waiting</Button>
              <Button variant="primary" onClick={() => resubmit(task.query)} disabled={retryBusy}>
                Try again
              </Button>
            </div>
          </ErrorState>
        </div>
      )}
    </div>
  )
}
