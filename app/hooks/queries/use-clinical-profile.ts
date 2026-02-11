/**
 * Query hook for loading clinical profile from disk (NDJSON).
 */

import { useQuery } from '@tanstack/react-query'
import {
  getClinicalProfile,
  type ClinicalProfileResponse,
} from '@/lib/api/clinical-profile'

export function useClinicalProfile(sessionId: string | null) {
  return useQuery<ClinicalProfileResponse | null>({
    queryKey: ['clinical-profile', sessionId],
    queryFn: () => {
      if (!sessionId) return null
      return getClinicalProfile(sessionId)
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 10,
  })
}
