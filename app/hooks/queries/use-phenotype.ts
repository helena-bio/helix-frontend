/**
 * Phenotype query hook.
 *
 * React Query hook for fetching patient phenotype data.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { getPhenotype, PatientPhenotype } from '@/lib/api/hpo'

export const phenotypeKeys = {
  all: ['phenotype'] as const,
  bySession: (sessionId: string) => [...phenotypeKeys.all, sessionId] as const,
}

/**
 * Hook for fetching patient phenotype data for a session.
 */
export function usePhenotype(
  sessionId: string | null | undefined,
  options?: Omit<UseQueryOptions<PatientPhenotype | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: phenotypeKeys.bySession(sessionId || ''),
    queryFn: () => {
      if (!sessionId) return null
      return getPhenotype(sessionId)
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}
