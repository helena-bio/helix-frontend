/**
 * Cases Query Hook
 * Fetches user's analysis cases (sessions) from backend.
 * Server data only -- UI state managed by SessionContext.
 */

import { useQuery } from '@tanstack/react-query'
import { listCases } from '@/lib/api/variant-analysis'
import type { AnalysisSession } from '@/types/variant.types'

export const casesKeys = {
  all: ['cases'] as const,
  list: (mine: boolean = true) => [...casesKeys.all, 'list', { mine }] as const,
}

export interface CasesResponse {
  sessions: AnalysisSession[]
  total_count: number
  statistics: Record<string, any>
}

/**
 * Fetch cases for the authenticated user's organization.
 * mine=true: only my cases (default). mine=false: all org cases.
 */
export function useCases(mine: boolean = true) {
  return useQuery<CasesResponse>({
    queryKey: casesKeys.list(mine),
    queryFn: () => listCases({ mine }),
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  })
}
