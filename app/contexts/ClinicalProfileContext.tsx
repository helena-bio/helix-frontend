/**
 * Clinical Profile Context Provider
 *
 * Manages complete patient clinical profile including:
 * - Demographics (age, sex)
 * - Ethnicity & ancestry
 * - Family history
 * - Clinical context
 * - Phenotype data (HPO terms)
 * - Reproductive context
 * - Sample info
 * - Consent preferences
 */
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useClinicalProfile } from '@/hooks/queries/use-clinical-profile'
import {
  useSaveClinicalProfile,
  useUpdateDemographics,
  useUpdatePhenotype,
} from '@/hooks/mutations/use-clinical-profile-mutations'
import type {
  ClinicalProfile,
  SaveClinicalProfileRequest,
  Demographics,
  EthnicityData,
  ClinicalContext,
  PhenotypeData,
  ReproductiveContext,
  SampleInfo,
  ConsentPreferences,
} from '@/types/clinical-profile.types'

interface ClinicalProfileContextValue {
  // Data
  profile: ClinicalProfile | null
  isLoading: boolean
  error: Error | null

  // Actions - Full profile
  updateProfile: (data: SaveClinicalProfileRequest) => Promise<void>

  // Actions - Partial updates
  updateDemographicsOnly: (demographics: Demographics) => Promise<void>
  updateEthnicity: (ethnicity: EthnicityData) => Promise<void>
  updateClinicalContext: (context: ClinicalContext) => Promise<void>
  updatePhenotypeData: (phenotype: PhenotypeData) => Promise<void>
  updateReproductive: (reproductive: ReproductiveContext) => Promise<void>
  updateSampleInfo: (sampleInfo: SampleInfo) => Promise<void>
  updateConsent: (consent: ConsentPreferences) => Promise<void>

  // HPO-specific helpers (for backward compatibility with PhenotypeEntry)
  addHPOTerm: (term: { hpo_id: string; name: string; definition?: string }) => Promise<void>
  removeHPOTerm: (hpoId: string) => Promise<void>

  refetch: () => Promise<void>

  // Computed
  hpoTermIds: string[]
  termCount: number
  hasRequiredData: boolean
  hasRecommendedData: boolean
}

const ClinicalProfileContext = createContext<ClinicalProfileContextValue | undefined>(undefined)

interface ClinicalProfileProviderProps {
  sessionId: string | null
  children: ReactNode
}

export function ClinicalProfileProvider({ sessionId, children }: ClinicalProfileProviderProps) {
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useClinicalProfile(sessionId)

  const saveMutation = useSaveClinicalProfile()
  const updateDemographicsMutation = useUpdateDemographics()
  const updatePhenotypeMutation = useUpdatePhenotype()

  // Full profile update
  const updateProfile = async (data: SaveClinicalProfileRequest) => {
    if (!sessionId) throw new Error('No session ID')
    await saveMutation.mutateAsync({ sessionId, data })
    await refetch()
  }

  // Partial updates - merge with existing data
  const updateDemographicsOnly = async (demographics: Demographics) => {
    if (!sessionId) throw new Error('No session ID')
    await updateDemographicsMutation.mutateAsync({ sessionId, demographics })
    await refetch()
  }

  const updateEthnicity = async (ethnicity: EthnicityData) => {
    if (!sessionId) throw new Error('No session ID')
    const data: SaveClinicalProfileRequest = {
      demographics: profile?.demographics || { sex: 'female' },
      ethnicity,
      clinical_context: profile?.clinical_context,
      phenotype: profile?.phenotype,
      reproductive: profile?.reproductive,
      sample_info: profile?.sample_info,
      previous_tests: profile?.previous_tests,
      consent: profile?.consent,
    }
    await saveMutation.mutateAsync({ sessionId, data })
    await refetch()
  }

  const updateClinicalContext = async (clinical_context: ClinicalContext) => {
    if (!sessionId) throw new Error('No session ID')
    const data: SaveClinicalProfileRequest = {
      demographics: profile?.demographics || { sex: 'female' },
      ethnicity: profile?.ethnicity,
      clinical_context,
      phenotype: profile?.phenotype,
      reproductive: profile?.reproductive,
      sample_info: profile?.sample_info,
      previous_tests: profile?.previous_tests,
      consent: profile?.consent,
    }
    await saveMutation.mutateAsync({ sessionId, data })
    await refetch()
  }

  const updatePhenotypeData = async (phenotype: PhenotypeData) => {
    if (!sessionId) throw new Error('No session ID')
    await updatePhenotypeMutation.mutateAsync({ sessionId, phenotype })
    await refetch()
  }

  const updateReproductive = async (reproductive: ReproductiveContext) => {
    if (!sessionId) throw new Error('No session ID')
    const data: SaveClinicalProfileRequest = {
      demographics: profile?.demographics || { sex: 'female' },
      ethnicity: profile?.ethnicity,
      clinical_context: profile?.clinical_context,
      phenotype: profile?.phenotype,
      reproductive,
      sample_info: profile?.sample_info,
      previous_tests: profile?.previous_tests,
      consent: profile?.consent,
    }
    await saveMutation.mutateAsync({ sessionId, data })
    await refetch()
  }

  const updateSampleInfo = async (sample_info: SampleInfo) => {
    if (!sessionId) throw new Error('No session ID')
    const data: SaveClinicalProfileRequest = {
      demographics: profile?.demographics || { sex: 'female' },
      ethnicity: profile?.ethnicity,
      clinical_context: profile?.clinical_context,
      phenotype: profile?.phenotype,
      reproductive: profile?.reproductive,
      sample_info,
      previous_tests: profile?.previous_tests,
      consent: profile?.consent,
    }
    await saveMutation.mutateAsync({ sessionId, data })
    await refetch()
  }

  const updateConsent = async (consent: ConsentPreferences) => {
    if (!sessionId) throw new Error('No session ID')
    const data: SaveClinicalProfileRequest = {
      demographics: profile?.demographics || { sex: 'female' },
      ethnicity: profile?.ethnicity,
      clinical_context: profile?.clinical_context,
      phenotype: profile?.phenotype,
      reproductive: profile?.reproductive,
      sample_info: profile?.sample_info,
      previous_tests: profile?.previous_tests,
      consent,
    }
    await saveMutation.mutateAsync({ sessionId, data })
    await refetch()
  }

  // HPO-specific helpers
  const addHPOTerm = async (term: { hpo_id: string; name: string; definition?: string }) => {
    if (!sessionId) throw new Error('No session ID')

    const existingTerms = profile?.phenotype?.hpo_terms || []

    // Check if term already exists
    if (existingTerms.some(t => t.hpo_id === term.hpo_id)) {
      return
    }

    const updatedPhenotype: PhenotypeData = {
      hpo_terms: [...existingTerms, term],
      clinical_synopsis: profile?.phenotype?.clinical_synopsis,
      onset_age: profile?.phenotype?.onset_age,
      severity: profile?.phenotype?.severity,
      clinical_notes: profile?.phenotype?.clinical_notes,
    }

    await updatePhenotypeMutation.mutateAsync({ sessionId, phenotype: updatedPhenotype })
    await refetch()
  }

  const removeHPOTerm = async (hpoId: string) => {
    if (!sessionId) throw new Error('No session ID')

    const existingTerms = profile?.phenotype?.hpo_terms || []

    const updatedPhenotype: PhenotypeData = {
      hpo_terms: existingTerms.filter(t => t.hpo_id !== hpoId),
      clinical_synopsis: profile?.phenotype?.clinical_synopsis,
      onset_age: profile?.phenotype?.onset_age,
      severity: profile?.phenotype?.severity,
      clinical_notes: profile?.phenotype?.clinical_notes,
    }

    await updatePhenotypeMutation.mutateAsync({ sessionId, phenotype: updatedPhenotype })
    await refetch()
  }

  // Computed values
  const hpoTermIds = profile?.phenotype?.hpo_terms.map(t => t.hpo_id) || []
  const termCount = profile?.phenotype?.hpo_terms.length || 0

  // Check if required data is present
  const hasRequiredData = !!(
    profile?.demographics?.sex &&
    (profile?.demographics?.age_years !== undefined || profile?.demographics?.age_days !== undefined)
  )

  // Check if recommended data is present
  const hasRecommendedData = !!(
    profile?.ethnicity?.primary &&
    profile?.clinical_context?.indication
  )

  const value: ClinicalProfileContextValue = {
    profile: profile ?? null,
    isLoading,
    error: error as Error | null,
    updateProfile,
    updateDemographicsOnly,
    updateEthnicity,
    updateClinicalContext,
    updatePhenotypeData,
    updateReproductive,
    updateSampleInfo,
    updateConsent,
    addHPOTerm,
    removeHPOTerm,
    refetch: async () => {
      await refetch()
    },
    hpoTermIds,
    termCount,
    hasRequiredData,
    hasRecommendedData,
  }

  return <ClinicalProfileContext.Provider value={value}>{children}</ClinicalProfileContext.Provider>
}

export function useClinicalProfileContext(): ClinicalProfileContextValue {
  const context = useContext(ClinicalProfileContext)
  if (!context) {
    throw new Error('useClinicalProfileContext must be used within ClinicalProfileProvider')
  }
  return context
}
