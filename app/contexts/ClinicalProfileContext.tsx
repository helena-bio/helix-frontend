/**
 * Clinical Profile Context Provider
 *
 * Manages patient clinical profile with DISK PERSISTENCE (NDJSON).
 * All data saved/loaded via /sessions/{id}/clinical-profile endpoint.
 *
 * On mount: loads saved profile from disk (if exists) -> populates state
 * On save: writes ALL data to disk as single NDJSON file
 *
 * No PostgreSQL dependency. Everything on disk.
 */
'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { useClinicalProfile } from '@/hooks/queries/use-clinical-profile'
import { useSaveClinicalProfile } from '@/hooks/mutations/use-clinical-profile-mutations'
import type {
  ClinicalProfile,
  Demographics,
  EthnicityData,
  ClinicalContext,
  ReproductiveContext,
  SampleInfo,
  ConsentPreferences,
} from '@/types/clinical-profile.types'

interface HPOTerm {
  hpo_id: string
  name: string
  definition?: string
}

interface ClinicalProfileContextValue {
  // Loading state
  isLoadingProfile: boolean
  isProfileLoaded: boolean

  // Module enablement
  enableScreening: boolean
  enablePhenotypeMatching: boolean
  enableClinicalReport: boolean
  setEnableScreening: (enabled: boolean) => void
  setEnablePhenotypeMatching: (enabled: boolean) => void
  setEnableClinicalReport: (enabled: boolean) => void

  // Local state
  demographics: Demographics
  ethnicity?: EthnicityData
  clinicalContext?: ClinicalContext
  reproductive: ReproductiveContext
  sampleInfo?: SampleInfo
  consent: ConsentPreferences

  // HPO terms
  hpoTerms: HPOTerm[]
  clinicalNotes: string

  // Actions - state updates
  setDemographics: (data: Demographics) => void
  setEthnicity: (data: EthnicityData | undefined) => void
  setClinicalContext: (data: ClinicalContext | undefined) => void
  setReproductive: (data: ReproductiveContext) => void
  setSampleInfo: (data: SampleInfo | undefined) => void
  setConsent: (data: ConsentPreferences) => void

  // Actions - HPO terms
  addHPOTerm: (term: HPOTerm) => Promise<void>
  removeHPOTerm: (hpoId: string) => Promise<void>
  setClinicalNotes: (notes: string) => void

  // Actions - disk persistence
  saveProfile: (overrideData?: any) => Promise<void>

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
  // Module enablement (default: all disabled)
  const [enableScreening, setEnableScreening] = useState(false)
  const [enablePhenotypeMatching, setEnablePhenotypeMatching] = useState(false)
  const [enableClinicalReport, setEnableClinicalReport] = useState(true)

  // Local state
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

  // HPO terms
  const [localHPOTerms, setLocalHPOTerms] = useState<HPOTerm[]>([])
  const [localClinicalNotes, setLocalClinicalNotes] = useState<string>('')

  // Load from disk
  const { data: savedProfile, isLoading: isLoadingProfile } = useClinicalProfile(sessionId)
  const [isProfileLoaded, setIsProfileLoaded] = useState(false)
  const initializedForSessionRef = useRef<string | null>(null)

  // Populate state from disk data (once per session)
  useEffect(() => {
    if (!savedProfile || !sessionId) return
    if (initializedForSessionRef.current === sessionId) return

    if (savedProfile.demographics) {
      setDemographics(savedProfile.demographics)
    }

    if (savedProfile.modules) {
      setEnableScreening(savedProfile.modules.enable_screening)
      setEnablePhenotypeMatching(savedProfile.modules.enable_phenotype_matching)
      setEnableClinicalReport(savedProfile.modules.enable_clinical_report ?? false)
    }

    if (savedProfile.ethnicity) setEthnicity(savedProfile.ethnicity)
    if (savedProfile.clinical_context) setClinicalContext(savedProfile.clinical_context)

    if (savedProfile.reproductive) {
      setReproductive(savedProfile.reproductive)
    }

    if (savedProfile.sample_info) setSampleInfo(savedProfile.sample_info)

    if (savedProfile.consent) {
      setConsent(savedProfile.consent)
    }

    if (savedProfile.phenotype) {
      setLocalHPOTerms(savedProfile.phenotype.hpo_terms || [])
      setLocalClinicalNotes(savedProfile.phenotype.clinical_notes || '')
    }

    initializedForSessionRef.current = sessionId
    setIsProfileLoaded(true)
  }, [savedProfile, sessionId])

  // Reset when session changes
  useEffect(() => {
    if (sessionId && initializedForSessionRef.current !== sessionId) {
      setIsProfileLoaded(false)
    }
  }, [sessionId])

  // Mark as loaded even if no saved profile exists (404)
  useEffect(() => {
    if (!isLoadingProfile && !savedProfile && sessionId && !isProfileLoaded) {
      initializedForSessionRef.current = sessionId
      setIsProfileLoaded(true)
    }
  }, [isLoadingProfile, savedProfile, sessionId, isProfileLoaded])

  // Save mutation
  const saveMutation = useSaveClinicalProfile()

  // HPO term management
  const addHPOTerm = useCallback(async (term: HPOTerm) => {
    if (localHPOTerms.some(t => t.hpo_id === term.hpo_id)) return
    setLocalHPOTerms(prev => [...prev, term])
  }, [localHPOTerms])

  const removeHPOTerm = useCallback(async (hpoId: string) => {
    setLocalHPOTerms(prev => prev.filter(t => t.hpo_id !== hpoId))
  }, [])

  const setClinicalNotesLocal = useCallback((notes: string) => {
    setLocalClinicalNotes(notes)
  }, [])

  // Save entire profile to disk
  const saveProfile = useCallback(async (overrideData?: any) => {
    if (!sessionId) throw new Error('No session ID')

    const data = overrideData || {
      demographics,
      modules: {
        enable_screening: enableScreening,
        enable_phenotype_matching: enablePhenotypeMatching,
        enable_clinical_report: enableClinicalReport,
      },
      ethnicity: ethnicity || undefined,
      clinical_context: clinicalContext || undefined,
      reproductive,
      sample_info: sampleInfo || undefined,
      consent,
      phenotype: {
        hpo_terms: localHPOTerms,
        clinical_notes: localClinicalNotes || undefined,
      },
    }

    await saveMutation.mutateAsync({ sessionId, data })
  }, [
    sessionId, saveMutation,
    demographics, enableScreening, enablePhenotypeMatching, enableClinicalReport,
    ethnicity, clinicalContext, reproductive, sampleInfo, consent,
    localHPOTerms, localClinicalNotes,
  ])

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
  }, [
    sessionId, demographics, ethnicity, clinicalContext,
    localHPOTerms, localClinicalNotes, reproductive, sampleInfo, consent,
  ])

  const value: ClinicalProfileContextValue = {
    isLoadingProfile,
    isProfileLoaded,
    enableScreening,
    enablePhenotypeMatching,
    enableClinicalReport,
    setEnableScreening,
    setEnablePhenotypeMatching,
    setEnableClinicalReport,
    demographics,
    ethnicity,
    clinicalContext,
    reproductive,
    sampleInfo,
    consent,
    hpoTerms: localHPOTerms,
    clinicalNotes: localClinicalNotes,
    setDemographics,
    setEthnicity,
    setClinicalContext,
    setReproductive,
    setSampleInfo,
    setConsent,
    addHPOTerm,
    removeHPOTerm,
    setClinicalNotes: setClinicalNotesLocal,
    saveProfile,
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
