/**
 * Query hook for fetching clinical profile
 */

import { useQuery } from '@tanstack/react-query'
import { getClinicalProfile } from '@/lib/api/clinical-profile'
import type { ClinicalProfile } from '@/types/clinical-profile.types'

export function useClinicalProfile(sessionId: string | null) {
  return useQuery<ClinicalProfile | null>({
    queryKey: ['clinical-profile', sessionId],
    queryFn: () => {
      if (!sessionId) return null
      return getClinicalProfile(sessionId)
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
