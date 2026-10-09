import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import ReportView from '../components/report/ReportView'
import ErrorState from '../components/ErrorState'
import Button from '../components/Button'
import { useHistory } from '../hooks/useHistory'
import { startResearch } from '../api/research'
import { rememberTask } from '../lib/inflight'

/**
 * There is no GET /history/{id}, so a saved report is read out of the cached
 * history list — refetched automatically on a cold load.
 */
export default function SavedReportPage() {
  const { historyId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: history = [], isLoading, isError } = useHistory()
  const [busy, setBusy] = useState(false)

  const report = history.find((item) => String(item.id) === String(historyId))

  useEffect(() => {
    if (!isLoading && !report) document.title = 'Report not found — Briefly'
  }, [isLoading, report])

  const researchAgain = async () => {
    if (!report) return
    setBusy(true)
    try {
      const task = await startResearch(report.query)
      rememberTask(task.task_id, report.query)
      queryClient.setQueryData(['task', task.task_id], {
        task_id: task.task_id,
        status: 'pending',
      })
      navigate(`/task/${task.task_id}`)
    } catch {
      setBusy(false)
    }
  }

  if (isLoading) {
    return (
      <p role="status" className="mx-auto w-full max-w-[720px] pt-8 text-xs text-graphite">
        Loading report…
      </p>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[720px] pt-8">
        <ErrorState title="Your reports could not be loaded">
          Check that the API is running, then reload the page.
        </ErrorState>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="mx-auto w-full max-w-[720px] pt-8">
        <ErrorState tone="quiet" title="That report is not in your history">
          It may have been pushed out by newer reports — the API keeps the 20 most recent.
          <div className="mt-3">
            <Button onClick={() => navigate('/')}>Start new research</Button>
          </div>
        </ErrorState>
      </div>
    )
  }

  return (
    <ReportView
      query={report.query}
      result={report.result}
      sources={report.sources || []}
      createdAt={report.created_at}
      onResearchAgain={busy ? undefined : researchAgain}
    />
  )
}
