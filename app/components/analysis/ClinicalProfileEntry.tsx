"use client"

/**
 * ClinicalProfileEntry Component - Patient Clinical Profile
 *
 * Sidebar + content panel layout. Sidebar shows all sections with
 * completion indicators. Sections tied to disabled modules appear
 * grayed out and are not clickable.
 *
 * SECTIONS:
 * 1. Patient (always) - demographics + module selection
 * 2. Clinical Info (requires screening) - ethnicity, context, family, sample
 * 3. Phenotype (requires phenotype matching) - HPO search, AI assist, notes
 * 4. Preferences (requires screening) - consent options
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Search, Plus, Sparkles, ChevronDown, ChevronUp, X, Dna,
  ArrowRight, Loader2, User, ScanSearch, FileText,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@helix/shared/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HPOTermCard } from './HPOTermCard'
import { HelixLoader } from '@/components/ui/helix-loader'
import { ClinicalAnalysis } from './ClinicalAnalysis'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { useHPOSearch, useDebounce, useHPOExtract } from '@/hooks'
import type {
  Sex,
  Ethnicity,
  Indication,
  SampleType,
  Demographics,
  EthnicityData,
  ClinicalContext,
  ReproductiveContext,
  SampleInfo,
  ConsentPreferences,
  FamilyHistory,
} from '@/types/clinical-profile.types'
import { ETHNICITY_LABELS, INDICATION_LABELS, SAMPLE_TYPE_LABELS } from '@/types/clinical-profile.types'
import { toast } from 'sonner'

// =========================================================================
// TYPES
// =========================================================================

type SectionId = 'patient' | 'clinical' | 'phenotype' | 'ai-report'

interface HPOTerm {
  hpo_id: string
  name: string
  definition?: string
}

interface SidebarItem {
  id: SectionId
  label: string
  icon: React.ReactNode
  badge?: React.ReactNode
  disabled: boolean
  checked?: boolean
  onToggle?: (checked: boolean) => void
  hasPanel?: boolean
}

interface ClinicalProfileEntryProps {
  sessionId: string
  onComplete?: () => void
}

// =========================================================================
// COMPONENT
// =========================================================================

export function ClinicalProfileEntry({ sessionId, onComplete }: ClinicalProfileEntryProps) {
  const {
    enableScreening,
    enablePhenotypeMatching,
    enableClinicalReport,
    setEnableScreening,
    setEnablePhenotypeMatching,
    setEnableClinicalReport,
    hpoTerms,
    clinicalNotes,
    addHPOTerm,
    removeHPOTerm,
    setClinicalNotes,
    saveProfile,
    setDemographics,
    setEthnicity,
    setClinicalContext,
    setReproductive,
    setSampleInfo,
    setConsent,
    demographics: loadedDemographics,
    ethnicity: loadedEthnicity,
    clinicalContext: loadedClinicalContext,
    reproductive: loadedReproductive,
    sampleInfo: loadedSampleInfo,
    consent: loadedConsent,
    isProfileLoaded,
  } = useClinicalProfileContext()

  // Active section
  const [activeSection, setActiveSection] = useState<SectionId>('patient')

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchPopover, setShowSearchPopover] = useState(false)
  const [showAIAssist, setShowAIAssist] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  // LOCAL STATE - Demographics
  const [ageYears, setAgeYears] = useState<string>('')
  const [ageDays, setAgeDays] = useState<string>('')
  const [sex, setSex] = useState<Sex>('female')

  // LOCAL STATE - Clinical Info (for screening)
  const [ethnicity, setEthnicityLocal] = useState<Ethnicity | undefined>(undefined)
  const [ethnicityNote, setEthnicityNote] = useState('')
  const [indication, setIndication] = useState<Indication | undefined>(undefined)
  const [indicationDetails, setIndicationDetails] = useState('')
  const [hasFamilyHistory, setHasFamilyHistory] = useState(false)
  const [hasConsanguinity, setHasConsanguinity] = useState(false)
  const [familyHistoryDetails, setFamilyHistoryDetails] = useState('')
  const [sampleType, setSampleTypeLocal] = useState<SampleType | undefined>(undefined)
  const [hasParentalSamples, setHasParentalSamples] = useState(false)
  const [hasAffectedSibling, setHasAffectedSibling] = useState(false)

  // LOCAL STATE - Reproductive
  const [isPregnant, setIsPregnant] = useState(false)
  const [gestationalAge, setGestationalAge] = useState<string>('')
  const [familyPlanning, setFamilyPlanning] = useState(false)

  // LOCAL STATE - Preferences
  const [consentSecondaryFindings, setConsentSecondaryFindings] = useState(true)
  const [consentCarrierResults, setConsentCarrierResults] = useState(true)
  const [consentPharmacogenomics, setConsentPharmacogenomics] = useState(false)

  // LOCAL STATE - Clinical notes
  const [localClinicalNotes, setLocalClinicalNotes] = useState(clinicalNotes)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const hasPrefilledRef = useRef(false)
  const debouncedQuery = useDebounce(searchQuery, 150)

  const { data: searchResults, isLoading: isSearching } = useHPOSearch(debouncedQuery, {
    enabled: debouncedQuery.length >= 2,
    limit: 10,
  })

  const extractMutation = useHPOExtract()

  // =========================================================================
  // EFFECTS
  // =========================================================================

  // Pre-fill form from saved profile
  useEffect(() => {
    if (!isProfileLoaded || hasPrefilledRef.current) return
    hasPrefilledRef.current = true

    if (loadedDemographics.age_years) setAgeYears(String(loadedDemographics.age_years))
    if (loadedDemographics.age_days) setAgeDays(String(loadedDemographics.age_days))
    if (loadedDemographics.sex) setSex(loadedDemographics.sex)

    if (loadedEthnicity?.primary) setEthnicityLocal(loadedEthnicity.primary as Ethnicity)
    if (loadedEthnicity?.note) setEthnicityNote(loadedEthnicity.note)

    if (loadedClinicalContext?.indication) setIndication(loadedClinicalContext.indication as Indication)
    if (loadedClinicalContext?.indication_details) setIndicationDetails(loadedClinicalContext.indication_details)
    if (loadedClinicalContext?.family_history?.has_affected_relatives) setHasFamilyHistory(true)
    if (loadedClinicalContext?.family_history?.consanguinity) setHasConsanguinity(true)
    if (loadedClinicalContext?.family_history?.details) setFamilyHistoryDetails(loadedClinicalContext.family_history.details)

    if (loadedSampleInfo?.sample_type) setSampleTypeLocal(loadedSampleInfo.sample_type as SampleType)
    if (loadedSampleInfo?.has_parental_samples) setHasParentalSamples(true)
    if (loadedSampleInfo?.has_affected_sibling) setHasAffectedSibling(true)

    if (loadedReproductive?.is_pregnant) setIsPregnant(true)
    if (loadedReproductive?.gestational_age_weeks) setGestationalAge(String(loadedReproductive.gestational_age_weeks))
    if (loadedReproductive?.family_planning) setFamilyPlanning(true)

    if (loadedConsent) {
      setConsentSecondaryFindings(loadedConsent.secondary_findings)
      setConsentCarrierResults(loadedConsent.carrier_results)
      setConsentPharmacogenomics(loadedConsent.pharmacogenomics)
    }
  }, [
    isProfileLoaded,
    loadedDemographics,
    loadedEthnicity,
    loadedClinicalContext,
    loadedSampleInfo,
    loadedReproductive,
    loadedConsent,
  ])

  useEffect(() => {
    setLocalClinicalNotes(clinicalNotes)
  }, [clinicalNotes])

  useEffect(() => {
    if (sex === 'male') {
      setIsPregnant(false)
      setGestationalAge('')
    }
  }, [sex])

  // When a module is disabled and active section depends on it, go back to patient
  useEffect(() => {
    if (activeSection === 'clinical' && !enableScreening) setActiveSection('patient')
    if (activeSection === 'phenotype' && !enablePhenotypeMatching) setActiveSection('patient')
    if (activeSection === 'ai-report') setActiveSection('patient')
  }, [enableScreening, enablePhenotypeMatching, activeSection])

  // Auto-open popover when search query has results
  const filteredSuggestions = searchResults?.terms.filter(
    (term) => !hpoTerms.find((t) => t.hpo_id === term.hpo_id)
  ) || []

  useEffect(() => {
    if (searchQuery.length >= 2 && filteredSuggestions.length > 0) {
      setShowSearchPopover(true)
    } else {
      setShowSearchPopover(false)
    }
  }, [searchQuery, filteredSuggestions.length])

  // =========================================================================
  // COMPUTED
  // =========================================================================

  const hasRequiredFormData = !!(sex && (ageYears || ageDays))

  const demographicsComplete = hasRequiredFormData
  const clinicalInfoFilled = !!(ethnicity || indication || hasFamilyHistory || hasConsanguinity)
  const phenotypeCount = hpoTerms.length

  // =========================================================================
  // SIDEBAR ITEMS -- always all visible, disabled when module is off
  // =========================================================================

  const sidebarItems: SidebarItem[] = [
    {
      id: 'patient',
      label: 'Patient',
      icon: <User className="h-5 w-5" />,
      badge: demographicsComplete
        ? <Check className="h-3.5 w-3.5 text-primary" />
        : <Badge variant="outline" className="text-xs px-1.5 py-0">Required</Badge>,
      disabled: false,
      hasPanel: true,
    },
    {
      id: 'clinical',
      label: 'Clinical Screening',
      icon: <ScanSearch className="h-5 w-5" />,
      badge: enableScreening && clinicalInfoFilled
        ? <Check className="h-3.5 w-3.5 text-primary" />
        : undefined,
      disabled: !enableScreening,
      checked: enableScreening,
      onToggle: (v) => setEnableScreening(v),
      hasPanel: true,
    },
    {
      id: 'phenotype',
      label: 'Phenotype Matching',
      icon: <Dna className="h-5 w-5" />,
      badge: enablePhenotypeMatching && phenotypeCount > 0
        ? <Badge variant="secondary" className="text-xs px-1.5 py-0">{phenotypeCount}</Badge>
        : undefined,
      disabled: !enablePhenotypeMatching,
      checked: enablePhenotypeMatching,
      onToggle: (v) => setEnablePhenotypeMatching(v),
      hasPanel: true,
    },
    {
      id: 'ai-report',
      label: 'Clinical Report',
      icon: <FileText className="h-5 w-5" />,
      disabled: false,
      checked: enableClinicalReport,
      onToggle: (v) => setEnableClinicalReport(v),
      hasPanel: false,
    },
  ]

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleAddTerm = useCallback(async (term: HPOTerm) => {
    if (!hpoTerms.find((t) => t.hpo_id === term.hpo_id)) {
      try {
        await addHPOTerm(term)
        toast.success('Added: ' + term.name)
        setSearchQuery("")
        setShowSearchPopover(false)
        searchInputRef.current?.focus()
      } catch (error) {
        console.error('Failed to add term:', error)
        toast.error('Failed to add term')
      }
    }
  }, [hpoTerms, addHPOTerm])

  const handleRemoveTerm = useCallback(async (termId: string) => {
    await removeHPOTerm(termId)
  }, [removeHPOTerm])

  const handleGenerateSuggestions = useCallback(async () => {
    if (!aiInput.trim()) return

    try {
      const result = await extractMutation.mutateAsync(aiInput)

      if (result.terms.length === 0) {
        toast.info('No HPO terms found in text')
        return
      }

      let addedCount = 0
      for (const term of result.terms) {
        if (!hpoTerms.find((t) => t.hpo_id === term.hpo_id)) {
          await addHPOTerm({
            hpo_id: term.hpo_id,
            name: term.hpo_name,
          })
          addedCount++
        }
      }

      if (addedCount > 0) {
        toast.success('Added ' + addedCount + ' HPO term' + (addedCount > 1 ? 's' : ''))
      } else {
        toast.info('All extracted terms are already added')
      }

      setAiInput('')
      setShowAIAssist(false)
    } catch (error) {
      toast.error('Failed to extract HPO terms')
    }
  }, [aiInput, extractMutation, hpoTerms, addHPOTerm])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setShowSearchPopover(false)
  }, [])

  const handleContinue = useCallback(async () => {
    const ageY = ageYears ? parseInt(ageYears, 10) : undefined
    const ageD = ageDays ? parseInt(ageDays, 10) : undefined

    if (!sex || (!ageY && !ageD)) {
      toast.error('Please fill required fields')
      setActiveSection('patient')
      return
    }

    setIsSaving(true)

    try {
      const demographics: Demographics = {
        sex,
        age_years: ageY,
        age_days: ageD,
      }
      setDemographics(demographics)

      if (enableScreening) {
        if (ethnicity) {
          const ethnicityData: EthnicityData = {
            primary: ethnicity,
            note: ethnicityNote || undefined,
          }
          setEthnicity(ethnicityData)
        }

        if (indication) {
          const familyHistory: FamilyHistory = {
            has_affected_relatives: hasFamilyHistory,
            consanguinity: hasConsanguinity,
            details: familyHistoryDetails || undefined,
          }

          const clinicalContextData: ClinicalContext = {
            indication,
            indication_details: indicationDetails || undefined,
            family_history: familyHistory,
          }
          setClinicalContext(clinicalContextData)
        }

        const reproductiveData: ReproductiveContext = {
          is_pregnant: isPregnant,
          gestational_age_weeks: gestationalAge ? parseInt(gestationalAge, 10) : undefined,
          family_planning: familyPlanning,
        }
        setReproductive(reproductiveData)

        if (sampleType) {
          const sampleInfoData: SampleInfo = {
            sample_type: sampleType,
            has_parental_samples: hasParentalSamples,
            has_affected_sibling: hasAffectedSibling,
          }
          setSampleInfo(sampleInfoData)
        }

        const consentData: ConsentPreferences = {
          secondary_findings: consentSecondaryFindings,
          carrier_results: consentCarrierResults,
          pharmacogenomics: consentPharmacogenomics,
        }
        setConsent(consentData)
      }

      setClinicalNotes(localClinicalNotes)

      await saveProfile({
        demographics,
        modules: {
          enable_screening: enableScreening,
          enable_phenotype_matching: enablePhenotypeMatching,
          enable_clinical_report: enableClinicalReport,
        },
        ethnicity: enableScreening && ethnicity ? {
          primary: ethnicity,
          note: ethnicityNote || undefined,
        } : undefined,
        clinical_context: enableScreening && indication ? {
          indication,
          indication_details: indicationDetails || undefined,
          family_history: {
            has_affected_relatives: hasFamilyHistory,
            consanguinity: hasConsanguinity,
            details: familyHistoryDetails || undefined,
          },
        } : undefined,
        reproductive: {
          is_pregnant: isPregnant,
          gestational_age_weeks: gestationalAge ? parseInt(gestationalAge, 10) : undefined,
          family_planning: familyPlanning,
        },
        sample_info: enableScreening && sampleType ? {
          sample_type: sampleType,
          has_parental_samples: hasParentalSamples,
          has_affected_sibling: hasAffectedSibling,
        } : undefined,
        consent: {
          secondary_findings: consentSecondaryFindings,
          carrier_results: consentCarrierResults,
          pharmacogenomics: consentPharmacogenomics,
        },
        phenotype: {
          hpo_terms: hpoTerms,
          clinical_notes: localClinicalNotes || undefined,
        },
      })

      toast.success('Clinical profile saved')
      setShowAnalysis(true)

    } catch (error) {
      console.error('Failed to save profile:', error)
      toast.error('Failed to save clinical profile')
    } finally {
      setIsSaving(false)
    }
  }, [
    sessionId, ageYears, ageDays, sex,
    enableScreening, enablePhenotypeMatching, enableClinicalReport,
    ethnicity, ethnicityNote, indication, indicationDetails,
    hasFamilyHistory, hasConsanguinity, familyHistoryDetails,
    isPregnant, gestationalAge, familyPlanning,
    sampleType, hasParentalSamples, hasAffectedSibling,
    consentSecondaryFindings, consentCarrierResults, consentPharmacogenomics,
    hpoTerms, localClinicalNotes,
    setDemographics, setEthnicity, setClinicalContext, setReproductive,
    setSampleInfo, setConsent, setClinicalNotes, saveProfile,
  ])

  // =========================================================================
  // POST-SAVE VIEW
  // =========================================================================

  if (showAnalysis) {
    return <ClinicalAnalysis sessionId={sessionId} onComplete={onComplete} />
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="flex items-start justify-center min-h-[600px] p-8">
      <div className="w-full max-w-4xl space-y-6">

        {/* Header -- restored above layout */}
        <div className="flex items-center justify-center gap-4">
          <HelixLoader size="xs" speed={3} animated={isSaving} />
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Clinical Profile</h1>
            <p className="text-base text-muted-foreground">
              Clinical data for variant analysis
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-8">

          {/* =========================================================== */}
          {/* SIDEBAR                                                      */}
          {/* =========================================================== */}
          <div className="w-64 shrink-0 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Modules</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <nav className="space-y-1">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.hasPanel && !item.disabled) {
                          setActiveSection(item.id)
                        } else if (!item.hasPanel && item.onToggle) {
                          item.onToggle(!item.checked)
                        }
                      }}
                      className={`
                        w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg
                        text-left text-base font-medium transition-colors
                        ${item.disabled
                          ? 'text-muted-foreground/40 cursor-not-allowed'
                          : activeSection === item.id && item.hasPanel
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <div className="shrink-0 flex items-center">
                        {item.onToggle !== undefined ? (
                          <div
                            role="switch"
                            aria-checked={item.checked}
                            onClick={(e) => {
                              e.stopPropagation()
                              item.onToggle!(!item.checked)
                            }}
                            className={`
                              relative inline-flex h-5 w-9 items-center rounded-full
                              transition-colors cursor-pointer
                              ${item.checked ? 'bg-primary' : 'bg-muted-foreground/30'}
                            `}
                          >
                            <span
                              className={`
                                inline-block h-3.5 w-3.5 rounded-full bg-white
                                transition-transform shadow-sm
                                ${item.checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}
                              `}
                            />
                          </div>
                        ) : item.badge && !item.disabled ? (
                          <span>{item.badge}</span>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Continue button */}
            <Button
              onClick={handleContinue}
              disabled={!hasRequiredFormData || isSaving}
              className="w-full"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-base">Saving...</span>
                </>
              ) : (
                <>
                  <span className="text-base">Continue to Analysis</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* =========================================================== */}
          {/* CONTENT PANEL                                                */}
          {/* =========================================================== */}
          <div className="flex-1 min-w-0">

            {/* ----- PATIENT SECTION ----- */}
            {activeSection === 'patient' && (
              <div className="space-y-6">
                {/* Demographics */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Patient Demographics
                      <Badge variant="outline" className="ml-2 text-md">Required</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base">Age *</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="age-years" className="text-md text-muted-foreground">Years</Label>
                          <Input
                            id="age-years"
                            type="number"
                            min="0"
                            max="150"
                            value={ageYears}
                            onChange={(e) => setAgeYears(e.target.value)}
                            placeholder="e.g. 35"
                            className="text-base"
                          />
                        </div>
                        <div>
                          <Label htmlFor="age-days" className="text-md text-muted-foreground">Days (for infants)</Label>
                          <Input
                            id="age-days"
                            type="number"
                            min="0"
                            max="365"
                            value={ageDays}
                            onChange={(e) => setAgeDays(e.target.value)}
                            placeholder="e.g. 90"
                            className="text-base"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base">Sex *</Label>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={sex === 'female' ? 'default' : 'outline'}
                          onClick={() => setSex('female')}
                          className="flex-1 text-base"
                        >
                          Female
                        </Button>
                        <Button
                          type="button"
                          variant={sex === 'male' ? 'default' : 'outline'}
                          onClick={() => setSex('male')}
                          className="flex-1 text-base"
                        >
                          Male
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}

            {/* ----- CLINICAL INFO SECTION ----- */}
            {activeSection === 'clinical' && enableScreening && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ScanSearch className="h-4 w-4" />
                    Clinical Information
                    <Badge variant="outline" className="ml-2 text-md">For Screening</Badge>
                  </CardTitle>
                  <p className="text-md text-muted-foreground">
                    Ethnicity, clinical context, and family history improve screening accuracy
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Ethnicity */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Ethnicity & Ancestry</Label>
                    <Select value={ethnicity} onValueChange={(val) => setEthnicityLocal(val as Ethnicity)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ethnicity (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ETHNICITY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={ethnicityNote}
                      onChange={(e) => setEthnicityNote(e.target.value)}
                      placeholder="Additional ancestry notes (optional)"
                      className="text-base"
                      rows={2}
                    />
                  </div>

                  {/* Clinical Context */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Clinical Context</Label>
                    <Select value={indication} onValueChange={(val) => setIndication(val as Indication)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Proactive Health Screening" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(INDICATION_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={indicationDetails}
                      onChange={(e) => setIndicationDetails(e.target.value)}
                      placeholder="Additional details (optional)"
                      className="text-base"
                      rows={2}
                    />
                  </div>

                  {/* Family History */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Family History</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasFamilyHistory}
                          onChange={(e) => setHasFamilyHistory(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-base">Known family history of genetic conditions</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasConsanguinity}
                          onChange={(e) => setHasConsanguinity(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-base">Consanguineous parents</span>
                      </label>
                    </div>
                    {(hasFamilyHistory || hasConsanguinity) && (
                      <Textarea
                        value={familyHistoryDetails}
                        onChange={(e) => setFamilyHistoryDetails(e.target.value)}
                        placeholder="Family history details..."
                        className="text-base"
                        rows={3}
                      />
                    )}
                  </div>

                  {/* Sample Information */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Sample Information</Label>
                    <Select value={sampleType} onValueChange={(val) => setSampleTypeLocal(val as SampleType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sample type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SAMPLE_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasParentalSamples}
                          onChange={(e) => setHasParentalSamples(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-base">Parental samples available</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasAffectedSibling}
                          onChange={(e) => setHasAffectedSibling(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-base">Affected sibling available</span>
                      </label>
                    </div>
                  </div>

                  {/* Reproductive Context (only if female) */}
                  {sex === 'female' && (
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Reproductive Context</Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPregnant}
                            onChange={(e) => setIsPregnant(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-base">Patient is pregnant</span>
                        </label>
                        {isPregnant && (
                          <Input
                            type="number"
                            min="0"
                            max="42"
                            value={gestationalAge}
                            onChange={(e) => setGestationalAge(e.target.value)}
                            placeholder="Gestational age (weeks)"
                            className="text-base ml-6"
                          />
                        )}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={familyPlanning}
                            onChange={(e) => setFamilyPlanning(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-base">Family planning considerations</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Result Preferences */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Result Preferences</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentSecondaryFindings}
                          onChange={(e) => setConsentSecondaryFindings(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-base">Report ACMG Secondary Findings</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentCarrierResults}
                          onChange={(e) => setConsentCarrierResults(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-base">Report carrier status for recessive conditions</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentPharmacogenomics}
                          onChange={(e) => setConsentPharmacogenomics(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-base">Include pharmacogenomics results</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ----- PHENOTYPE SECTION ----- */}
            {activeSection === 'phenotype' && enablePhenotypeMatching && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Dna className="h-4 w-4" />
                    Phenotype Information
                    <Badge variant="outline" className="ml-2 text-md">For Phenotype Matching</Badge>
                  </CardTitle>
                  <p className="text-md text-muted-foreground">
                    Add patient symptoms (HPO terms) for phenotype-based variant matching
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Phenotypes */}
                  <div>
                    <label className="text-base font-medium mb-2 block">Search Phenotypes</label>
                    <Popover open={showSearchPopover} onOpenChange={setShowSearchPopover} modal={false}>
                      <PopoverTrigger asChild>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            ref={searchInputRef}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search phenotype or HPO term..."
                            className="pl-9 pr-9 text-base"
                          />
                          {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          {searchQuery && !isSearching && (
                            <button
                              onClick={clearSearch}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </PopoverTrigger>
                      {filteredSuggestions.length > 0 && (
                        <PopoverContent
                          className="p-2 max-h-80 overflow-y-auto"
                          align="start"
                          style={{ width: 'var(--radix-popover-trigger-width)' }}
                          onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                          <div className="space-y-1">
                            {filteredSuggestions.map((term) => (
                              <button
                                key={term.hpo_id}
                                onClick={() => handleAddTerm({ hpo_id: term.hpo_id, name: term.name, definition: term.definition })}
                                className="w-full text-left p-3 hover:bg-accent rounded flex items-start justify-between group"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-medium">{term.name}</span>
                                    <span className="text-md text-muted-foreground">({term.hpo_id})</span>
                                  </div>
                                  {term.definition && (
                                    <p className="text-md text-muted-foreground mt-1 line-clamp-2">
                                      {term.definition.replace(/^"/, '').replace(/".*$/, '')}
                                    </p>
                                  )}
                                </div>
                                <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      )}
                    </Popover>
                  </div>

                  {/* AI Assist */}
                  <Card className="border-primary/20 bg-primary/5">
                    <Collapsible open={showAIAssist} onOpenChange={setShowAIAssist}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-3 h-auto hover:bg-primary/10"
                        >
                          <div className="flex items-center gap-2 text-primary">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-base font-medium">Suggest HPO terms from free text</span>
                          </div>
                          {showAIAssist ? (
                            <ChevronUp className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-3 pb-3 space-y-3">
                          <Textarea
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            placeholder="Example: Child with epilepsy, developmental delay and hypotonia"
                            className="min-h-[80px] bg-background text-base"
                          />
                          <Button
                            onClick={handleGenerateSuggestions}
                            disabled={!aiInput.trim() || extractMutation.isPending}
                            size="sm"
                            className="w-full text-base"
                          >
                            {extractMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Extracting...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Suggestions
                              </>
                            )}
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>

                  {/* Clinical Notes */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Additional Clinical Notes</Label>
                    <Textarea
                      value={localClinicalNotes}
                      onChange={(e) => setLocalClinicalNotes(e.target.value)}
                      placeholder="e.g. Patient has recurrent febrile seizures..."
                      className="min-h-[100px] text-base bg-background"
                    />
                  </div>

                  {/* Selected HPO Terms */}
                  {hpoTerms.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-md font-medium">Selected Phenotypes ({hpoTerms.length})</p>
                      {hpoTerms.map((term) => (
                        <HPOTermCard
                          key={term.hpo_id}
                          hpoId={term.hpo_id}
                          name={term.name}
                          definition={term.definition}
                          onRemove={handleRemoveTerm}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-md text-muted-foreground">No phenotypes selected</p>
                      <p className="text-sm text-muted-foreground mt-1">Search and add HPO terms above</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}


          </div>
        </div>
      </div>
    </div>
  )
}
