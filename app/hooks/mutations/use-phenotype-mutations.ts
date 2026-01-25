/**
 * Phenotype mutations hooks.
 *
 * React Query mutations for patient phenotype operations.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { savePhenotype, deletePhenotype } from '@/lib/api/hpo'
import type { SavePhenotypeRequest } from '@/lib/api/clinical-profile'

/**
 * Hook for saving patient phenotype data.
 */
export function useSavePhenotype() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: SavePhenotypeRequest }) =>
      savePhenotype(sessionId, data),
    onSuccess: (result, variables) => {
      // Invalidate phenotype query for this session
      queryClient.invalidateQueries({
        queryKey: ['phenotype', variables.sessionId],
      })
    },
  })
}

/**
 * Hook for deleting patient phenotype data.
 */
export function useDeletePhenotype() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => deletePhenotype(sessionId),
    onSuccess: (result, sessionId) => {
      // Invalidate phenotype query for this session
      queryClient.invalidateQueries({
        queryKey: ['phenotype', sessionId],
      })
    },
  })
}
