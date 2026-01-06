/**
 * Task Status Query Hook
 * Polling hook for async task status
 */

import { useQuery } from '@tanstack/react-query'
import { getTaskStatus } from '@/lib/api/variant-analysis'

export function useTaskStatus(taskId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['task-status', taskId],
    queryFn: () => getTaskStatus(taskId!),
    enabled: !!taskId && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const data = query.state.data
      // Stop polling when task is complete
      if (data?.ready) return false
      // Poll every 2 seconds while running
      return 2000
    },
    retry: 3,
    retryDelay: 1000,
  })
}
