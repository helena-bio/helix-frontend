/**
 * Mutation hooks for clinical profile operations.
 * Saves/deletes complete clinical profile to/from disk (NDJSON).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  saveClinicalProfile,
  deleteClinicalProfile,
  type ClinicalProfileRequest,
} from '@/lib/api/clinical-profile'

interface SaveClinicalProfileParams {
  sessionId: string
  data: ClinicalProfileRequest
}

export function useSaveClinicalProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, data }: SaveClinicalProfileParams) =>
      saveClinicalProfile(sessionId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['clinical-profile', variables.sessionId],
      })
    },
  })
}

export function useDeleteClinicalProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => deleteClinicalProfile(sessionId),
    onSuccess: (_result, sessionId) => {
      queryClient.invalidateQueries({
        queryKey: ['clinical-profile', sessionId],
      })
    },
  })
}
