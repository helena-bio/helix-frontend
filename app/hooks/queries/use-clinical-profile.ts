/**
 * Query hook for fetching patient phenotype (HPO terms)
 */

import { useQuery } from '@tanstack/react-query'
import { getPatientPhenotype, PatientPhenotype } from '@/lib/api/clinical-profile'

export function usePatientPhenotype(sessionId: string | null) {
  return useQuery<PatientPhenotype | null>({
    queryKey: ['patient-phenotype', sessionId],
    queryFn: () => {
      if (!sessionId) return null
      return getPatientPhenotype(sessionId)
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
