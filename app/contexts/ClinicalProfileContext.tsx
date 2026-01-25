/**
 * Clinical Profile Context Provider
 *
 * Manages patient clinical profile as LOCAL STATE:
 * - Demographics (age, sex) - LOCAL ONLY
 * - Ethnicity & ancestry - LOCAL ONLY  
 * - Family history - LOCAL ONLY
 * - Clinical context - LOCAL ONLY
 * - Reproductive context - LOCAL ONLY
 * - Sample info - LOCAL ONLY
 * - Consent preferences - LOCAL ONLY
 *
 * HPO terms stored in backend via /sessions/{id}/phenotype
 */
'use client'

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react'
import { usePatientPhenotype } from '@/hooks/queries/use-clinical-profile'
import {
  useSavePatientPhenotype,
} from '@/hooks/mutations/use-clinical-profile-mutations'
import type {
  ClinicalProfile,
  Demographics,
  EthnicityData,
  ClinicalContext,
  ReproductiveContext,
  SampleInfo,
  ConsentPreferences,
} from '@/types/clinical-profile.types'

interface ClinicalProfileContextValue {
  // Local state
  demographics: Demographics
  ethnicity?: EthnicityData
  clinicalContext?: ClinicalContext
  reproductive: ReproductiveContext
  sampleInfo?: SampleInfo
  consent: ConsentPreferences

  // Backend HPO terms
  hpoTerms: Array<{ hpo_id: string; name: string; definition?: string }>
  clinicalNotes: string
  isLoadingHPO: boolean

  // Actions - Local state updates (no API)
  setDemographics: (data: Demographics) => void
  setEthnicity: (data: EthnicityData | undefined) => void
  setClinicalContext: (data: ClinicalContext | undefined) => void
  setReproductive: (data: ReproductiveContext) => void
  setSampleInfo: (data: SampleInfo | undefined) => void
  setConsent: (data: ConsentPreferences) => void

  // Actions - HPO terms (backend API)
  addHPOTerm: (term: { hpo_id: string; name: string; definition?: string }) => Promise<void>
  removeHPOTerm: (hpoId: string) => Promise<void>
  setClinicalNotes: (notes: string) => void
  savePhenotype: () => Promise<void>

  // Computed
  hpoTermIds: string[]
  termCount: number
  hasRequiredData: boolean
  hasRecommendedData: boolean

  // Complete profile for submission
  getCompleteProfile: () => ClinicalProfile
}

const ClinicalProfileContext = createContext<ClinicalProfileContextValue | undefined>(undefined)

interface ClinicalProfileProviderProps {
  sessionId: string | null
  children: ReactNode
}

export function ClinicalProfileProvider({ sessionId, children }: ClinicalProfileProviderProps) {
  // Local state - NO backend storage
  const [demographics, setDemographics] = useState<Demographics>({ sex: 'female' })
  const [ethnicity, setEthnicity] = useState<EthnicityData | undefined>(undefined)
  const [clinicalContext, setClinicalContext] = useState<ClinicalContext | undefined>(undefined)
  const [reproductive, setReproductive] = useState<ReproductiveContext>({
    is_pregnant: false,
    family_planning: false,
  })
  const [sampleInfo, setSampleInfo] = useState<SampleInfo | undefined>(undefined)
  const [consent, setConsent] = useState<ConsentPreferences>({
    secondary_findings: true,
    carrier_results: true,
    pharmacogenomics: false,
  })

  // Backend HPO terms
  const {
    data: phenotypeData,
    isLoading: isLoadingHPO,
    refetch,
  } = usePatientPhenotype(sessionId)

  const savePhenotypeMutation = useSavePatientPhenotype()

  // Local HPO state (synced with backend on load)
  const [localHPOTerms, setLocalHPOTerms] = useState<Array<{ hpo_id: string; name: string; definition?: string }>>([])
  const [localClinicalNotes, setLocalClinicalNotes] = useState<string>('')

  // Sync backend data to local state when loaded
  const syncFromBackend = useCallback(() => {
    if (phenotypeData) {
      setLocalHPOTerms(phenotypeData.hpo_terms || [])
      setLocalClinicalNotes(phenotypeData.clinical_notes || '')
    }
  }, [phenotypeData])

  // Sync on data load
  React.useEffect(() => {
    syncFromBackend()
  }, [syncFromBackend])

  // HPO term management
  const addHPOTerm = useCallback(async (term: { hpo_id: string; name: string; definition?: string }) => {
    if (localHPOTerms.some(t => t.hpo_id === term.hpo_id)) {
      return
    }
    setLocalHPOTerms(prev => [...prev, term])
  }, [localHPOTerms])

  const removeHPOTerm = useCallback(async (hpoId: string) => {
    setLocalHPOTerms(prev => prev.filter(t => t.hpo_id !== hpoId))
  }, [])

  const setClinicalNotesLocal = useCallback((notes: string) => {
    setLocalClinicalNotes(notes)
  }, [])

  // Save phenotype to backend
  const savePhenotype = useCallback(async () => {
    if (!sessionId) throw new Error('No session ID')

    await savePhenotypeMutation.mutateAsync({
      sessionId,
      hpo_terms: localHPOTerms,
      clinical_notes: localClinicalNotes,
    })

    await refetch()
  }, [sessionId, localHPOTerms, localClinicalNotes, savePhenotypeMutation, refetch])

  // Computed values
  const hpoTermIds = localHPOTerms.map(t => t.hpo_id)
  const termCount = localHPOTerms.length

  const hasRequiredData = !!(
    demographics.sex &&
    (demographics.age_years !== undefined || demographics.age_days !== undefined)
  )

  const hasRecommendedData = !!(
    ethnicity?.primary &&
    clinicalContext?.indication
  )

  // Get complete profile for submission
  const getCompleteProfile = useCallback((): ClinicalProfile => {
    return {
      session_id: sessionId!,
      demographics,
      ethnicity,
      clinical_context: clinicalContext,
      phenotype: {
        hpo_terms: localHPOTerms,
        clinical_notes: localClinicalNotes,
      },
      reproductive,
      sample_info: sampleInfo,
      consent,
    }
  }, [sessionId, demographics, ethnicity, clinicalContext, localHPOTerms, localClinicalNotes, reproductive, sampleInfo, consent])

  const value: ClinicalProfileContextValue = {
    demographics,
    ethnicity,
    clinicalContext,
    reproductive,
    sampleInfo,
    consent,
    hpoTerms: localHPOTerms,
    clinicalNotes: localClinicalNotes,
    isLoadingHPO,
    setDemographics,
    setEthnicity,
    setClinicalContext,
    setReproductive,
    setSampleInfo,
    setConsent,
    addHPOTerm,
    removeHPOTerm,
    setClinicalNotes: setClinicalNotesLocal,
    savePhenotype,
    hpoTermIds,
    termCount,
    hasRequiredData,
    hasRecommendedData,
    getCompleteProfile,
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
