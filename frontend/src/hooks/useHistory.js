import { useQuery } from '@tanstack/react-query'
import { getHistory } from '../api/research'

/** The API caps history at 20 rows, newest first, excluding in-flight tasks. */
export const HISTORY_LIMIT = 20

export function useHistory({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['history'],
    queryFn: getHistory,
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}
