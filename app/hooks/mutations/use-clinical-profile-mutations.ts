/**
 * Mutation hooks for clinical profile operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  saveClinicalProfile,
  deleteClinicalProfile,
  updateDemographics,
  updatePhenotype,
} from '@/lib/api/clinical-profile'
import type {
  SaveClinicalProfileRequest,
  SaveClinicalProfileResponse,
} from '@/types/clinical-profile.types'

interface SaveClinicalProfileParams {
  sessionId: string
  data: SaveClinicalProfileRequest
}

export function useSaveClinicalProfile() {
  const queryClient = useQueryClient()

  return useMutation<SaveClinicalProfileResponse, Error, SaveClinicalProfileParams>({
    mutationFn: ({ sessionId, data }) => saveClinicalProfile(sessionId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clinical-profile', data.session_id] })
    },
  })
}

export function useDeleteClinicalProfile() {
  const queryClient = useQueryClient()

  return useMutation<{ deleted: boolean; message: string }, Error, string>({
    mutationFn: (sessionId) => deleteClinicalProfile(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['clinical-profile', sessionId] })
    },
  })
}

interface UpdateDemographicsParams {
  sessionId: string
  demographics: SaveClinicalProfileRequest['demographics']
}

export function useUpdateDemographics() {
  const queryClient = useQueryClient()

  return useMutation<SaveClinicalProfileResponse, Error, UpdateDemographicsParams>({
    mutationFn: ({ sessionId, demographics }) => updateDemographics(sessionId, demographics),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clinical-profile', data.session_id] })
    },
  })
}

interface UpdatePhenotypeParams {
  sessionId: string
  phenotype: SaveClinicalProfileRequest['phenotype']
}

export function useUpdatePhenotype() {
  const queryClient = useQueryClient()

  return useMutation<SaveClinicalProfileResponse, Error, UpdatePhenotypeParams>({
    mutationFn: ({ sessionId, phenotype }) => updatePhenotype(sessionId, phenotype),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clinical-profile', data.session_id] })
    },
  })
}
