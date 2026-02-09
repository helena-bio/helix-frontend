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
  list: () => [...casesKeys.all, 'list'] as const,
}

export interface CasesResponse {
  sessions: AnalysisSession[]
  total_count: number
  statistics: Record<string, any>
}

/**
 * Fetch all cases for the authenticated user.
 * JWT provides user_id automatically via backend auth middleware.
 */
export function useCases() {
  return useQuery<CasesResponse>({
    queryKey: casesKeys.list(),
    queryFn: () => listCases(),
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  })
}
