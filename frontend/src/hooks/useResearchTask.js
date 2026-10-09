import { useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getResult } from '../api/research'
import { forgetTask, recallTask } from '../lib/inflight'

const TERMINAL = new Set(['completed', 'failed'])

/**
 * Polls /result/{taskId} until the task reaches a terminal state, with a gentle
 * back-off so a slow worker does not get hammered.
 */
export function useResearchTask(taskId) {
  const queryClient = useQueryClient()
  const remembered = useMemo(() => (taskId ? recallTask(taskId) : null), [taskId])

  // Survives a refresh via sessionStorage; falls back to now for a cold load.
  const startedAtRef = useRef(remembered?.startedAt || Date.now())

  const query = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getResult(taskId),
    enabled: Boolean(taskId),
    refetchInterval: (q) => {
      const status = q.state.data?.status
      if (TERMINAL.has(status)) return false
      const elapsed = Date.now() - startedAtRef.current
      return elapsed < 20_000 ? 1500 : 3000
    },
    refetchIntervalInBackground: false,
    retry: false,
  })

  const status = query.data?.status

  useEffect(() => {
    if (!taskId || !TERMINAL.has(status)) return
    forgetTask(taskId)
    if (status === 'completed') {
      queryClient.invalidateQueries({ queryKey: ['history'] })
    }
  }, [taskId, status, queryClient])

  return {
    ...query,
    status,
    /** The question, available even on a cold reload mid-run. */
    query: query.data?.result?.query || remembered?.query || '',
    startedAt: startedAtRef.current,
  }
}
