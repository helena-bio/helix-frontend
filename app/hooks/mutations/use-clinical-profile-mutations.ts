/**
 * Mutation hooks for patient phenotype operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  savePatientPhenotype,
  deletePatientPhenotype,
  SavePhenotypeRequest,
  SavePhenotypeResponse,
} from '@/lib/api/clinical-profile'

interface SavePhenotypeParams {
  sessionId: string
  hpo_terms: Array<{ hpo_id: string; name: string; definition?: string }>
  clinical_notes?: string
}

export function useSavePatientPhenotype() {
  const queryClient = useQueryClient()

  return useMutation<SavePhenotypeResponse, Error, SavePhenotypeParams>({
    mutationFn: ({ sessionId, hpo_terms, clinical_notes }) =>
      savePatientPhenotype(sessionId, { hpo_terms, clinical_notes }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patient-phenotype', data.session_id] })
    },
  })
}

export function useDeletePatientPhenotype() {
  const queryClient = useQueryClient()

  return useMutation<{ session_id: string; deleted: boolean; message: string }, Error, string>({
    mutationFn: (sessionId) => deletePatientPhenotype(sessionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patient-phenotype', data.session_id] })
    },
  })
}
