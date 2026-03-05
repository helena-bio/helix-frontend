"use client"

/**
 * ClinicalProfileEntry Component - Patient Clinical Profile
 *
 * Sidebar + content panel layout. Sidebar shows all sections with
 * completion indicators. Sections tied to disabled modules appear
 * grayed out and are not clickable.
 *
 * RECOVERY: If user navigates away during ClinicalAnalysis pipeline
 * and returns, session status will be 'profiling'. We detect this
 * on mount and show ClinicalAnalysis directly instead of the form.
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
  ArrowRight, Loader2, User, Microscope, ScanSearch, FileText, Info,
  Check,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@helix/shared/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HPOTermCard } from './HPOTermCard'
import { ClinicalAnalysis } from './ClinicalAnalysis'
import { invalidateSessionCaches } from '@/lib/cache/invalidate-session-caches'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { useSession as useSessionQuery } from '@/hooks/queries/use-variant-analysis-queries'
import { useHPOSearch, useDebounce, useHPOExtract } from '@/hooks'
import { fetchGenePanels, fetchPanelGenes, searchGenes, suggestPanels, deriveAgeGroup, type GenePanelGeneResponse, type GeneSearchResult, type PanelSuggestion, type AgeGroup } from '@/lib/api/screening'
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
  GenePanel,
  CustomGeneEntry,
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
  const queryClient = useQueryClient()

  // Check session status to recover from navigation during ClinicalAnalysis pipeline.
  // If status is 'profiling', the pipeline was started but user navigated away --
  // show ClinicalAnalysis directly instead of the form.
  const { data: sessionData } = useSessionQuery(sessionId, { staleTime: 0 })
  const [showAnalysis, setShowAnalysis] = useState(false)
  const recoveryCheckedRef = useRef(false)

  useEffect(() => {
    if (recoveryCheckedRef.current) return
    if (!sessionData || sessionData.id !== sessionId) return
    recoveryCheckedRef.current = true

    if (sessionData.status === 'profiling') {
      console.log('[ClinicalProfileEntry] Session is profiling -- showing ClinicalAnalysis directly')
      setShowAnalysis(true)
    }
  }, [sessionData, sessionId])

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
    selectedPanelIds,
    customGenes,
    setSelectedPanelIds,
    setCustomGenes,
  } = useClinicalProfileContext()

  // Active section
  const [activeSection, setActiveSection] = useState<SectionId>('patient')

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchPopover, setShowSearchPopover] = useState(false)
  const [showAIAssist, setShowAIAssist] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

  // LOCAL STATE - Gene Panels
  const [availablePanels, setAvailablePanels] = useState<GenePanel[]>([])
  const [panelsLoading, setPanelsLoading] = useState(false)
  const [customGeneSymbol, setCustomGeneSymbol] = useState('')
  const [expandedPanelIds, setExpandedPanelIds] = useState<Set<string>>(new Set())
  const [panelGenesCache, setPanelGenesCache] = useState<Record<string, GenePanelGeneResponse[]>>({})
  const [panelGenesLoading, setPanelGenesLoading] = useState(false)
  const [customGeneSearchResults, setCustomGeneSearchResults] = useState<GeneSearchResult[]>([])

  // Panel suggestions (FE-B: age-aware)
  const [panelSuggestions, setPanelSuggestions] = useState<PanelSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [lastSuggestedAgeGroup, setLastSuggestedAgeGroup] = useState<AgeGroup | null>(null)

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

  // Fetch available gene panels when screening is enabled
  useEffect(() => {
    if (!enableScreening) return
    if (availablePanels.length > 0) return

    setPanelsLoading(true)
    fetchGenePanels()
      .then((panels) => {
        setAvailablePanels(panels)
      })
      .catch((err) => {
        console.error('Failed to fetch gene panels:', err)
      })
      .finally(() => {
        setPanelsLoading(false)
      })
  }, [enableScreening, availablePanels.length])

  // Gene symbol autocomplete for custom genes
  useEffect(() => {
    const symbol = customGeneSymbol.trim()
    if (symbol.length < 2) {
      setCustomGeneSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      searchGenes(symbol, 8)
        .then(setCustomGeneSearchResults)
        .catch(() => setCustomGeneSearchResults([]))
    }, 150)
    return () => clearTimeout(timer)
  }, [customGeneSymbol])



  // FE-B: Fetch panel suggestions when age changes (debounced)
  useEffect(() => {
    if (!enableScreening) return

    const ageY = ageYears ? parseInt(ageYears, 10) : undefined
    const ageD = ageDays ? parseInt(ageDays, 10) : undefined
    const ageGroup = deriveAgeGroup(ageY, ageD)

    if (!ageGroup) {
      setPanelSuggestions([])
      setLastSuggestedAgeGroup(null)
      return
    }

    // Skip if same age group already fetched
    if (ageGroup === lastSuggestedAgeGroup) return

    const timer = setTimeout(() => {
      setSuggestionsLoading(true)
      suggestPanels(ageGroup)
        .then((suggestions) => {
          setPanelSuggestions(suggestions)
          setLastSuggestedAgeGroup(ageGroup)

          // Auto-select panels marked as auto_select (only on first fetch or age group change)
          const autoIds = suggestions
            .filter(s => s.auto_select)
            .map(s => s.panel_id)
          if (autoIds.length > 0) {
            setSelectedPanelIds([...new Set([...selectedPanelIds, ...autoIds])])
          }
        })
        .catch((err) => {
          console.error('Failed to fetch panel suggestions:', err)
        })
        .finally(() => {
          setSuggestionsLoading(false)
        })
    }, 400)

    return () => clearTimeout(timer)
  }, [ageYears, ageDays, enableScreening, lastSuggestedAgeGroup])

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
      label: 'Variant Analysis',
      icon: <Microscope className="h-5 w-5" />,
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
  // GENE PANEL HANDLERS
  // =========================================================================

  const handleTogglePanel = useCallback((panelId: string) => {
    setSelectedPanelIds(
      selectedPanelIds.includes(panelId)
        ? selectedPanelIds.filter(id => id !== panelId)
        : [...selectedPanelIds, panelId]
    )
  }, [selectedPanelIds, setSelectedPanelIds])

  const handleAddCustomGene = useCallback(() => {
    const symbol = customGeneSymbol.trim().toUpperCase()
    if (!symbol) return
    if (customGenes.some(g => g.gene_symbol === symbol)) {
      toast.info(symbol + ' is already added')
      return
    }
    setCustomGenes([...customGenes, { gene_symbol: symbol, priority_score: 1.0 }])
    setCustomGeneSymbol('')
  }, [customGeneSymbol, customGenes, setCustomGenes])

  const handleRemoveCustomGene = useCallback((symbol: string) => {
    setCustomGenes(customGenes.filter(g => g.gene_symbol !== symbol))
  }, [customGenes, setCustomGenes])

  const handleExpandPanel = useCallback((panelId: string) => {
    setExpandedPanelIds(prev => {
      const next = new Set(prev)
      if (next.has(panelId)) {
        next.delete(panelId)
      } else {
        next.add(panelId)
      }
      return next
    })
    if (panelGenesCache[panelId]) return
    setPanelGenesLoading(true)
    fetchPanelGenes(panelId)
      .then((genes) => {
        setPanelGenesCache(prev => ({ ...prev, [panelId]: genes }))
      })
      .catch((err) => {
        console.error('Failed to fetch panel genes:', err)
      })
      .finally(() => {
        setPanelGenesLoading(false)
      })
  }, [panelGenesCache])

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
        panel_ids: selectedPanelIds.length > 0 ? selectedPanelIds : undefined,
        custom_genes: customGenes.length > 0 ? customGenes : undefined,
      })

      // Invalidate all session caches so sidebar reflects profiling status
      invalidateSessionCaches(queryClient, sessionId)

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
    selectedPanelIds, customGenes,
    setDemographics, setEthnicity, setClinicalContext, setReproductive,
    setSampleInfo, setConsent, setClinicalNotes, saveProfile,
    queryClient,
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
    <div className="flex items-start justify-center min-h-[600px] px-8 pt-8 pb-8">
      <div className="w-full max-w-4xl">
          {/* Page title */}
          <h1 className="text-3xl font-semibold tracking-tight mb-6">Clinical Profile</h1>

          {/* Two-column layout */}
        <div className="flex gap-8">

          {/* =========================================================== */}
          {/* SIDEBAR                                                      */}
          {/* =========================================================== */}
          <div className="w-64 shrink-0 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">Modules</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-md">Select which modules to include in the analysis</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <nav className="space-y-1">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.hasPanel && !item.disabled) {
                          setActiveSection(item.id)
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
                              const newState = !item.checked
                              item.onToggle!(newState)
                              if (item.hasPanel) {
                                setActiveSection(newState ? item.id : 'patient')
                              }
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
            </div>

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
                  <CardHeader className="pt-4 pb-3">
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
                <CardHeader className="pt-4 pb-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ScanSearch className="h-4 w-4" />
                    Clinical Information
                    <Badge variant="outline" className="ml-2 text-md">For Screening</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 pb-5">
                  {/* Ethnicity */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Ethnicity</Label>
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
                  </div>

                  {/* Indication */}
                  <div className="border-t mt-5 pt-5 space-y-2">
                    <Label className="text-base font-medium">Indication</Label>
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
                      placeholder="Additional clinical details (optional)"
                      className="text-base"
                      rows={2}
                    />
                  </div>

                  {/* Gene Panels */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <button className="border-t mt-5 pt-4 w-full flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-medium cursor-pointer">Gene Panels</Label>
                          {(selectedPanelIds.length > 0 || customGenes.length > 0) && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {selectedPanelIds.length + customGenes.length}
                            </Badge>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-4">
                      <p className="text-md text-muted-foreground">
                        Select gene panels to boost matching variants during screening. Genes in selected panels receive higher priority scores.
                      </p>


                        {/* FE-B: Age-Aware Panel Suggestions */}
                        {suggestionsLoading && (
                          <div className="flex items-center gap-2 py-3">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="text-md text-muted-foreground">Loading recommendations...</span>
                          </div>
                        )}
                        {!suggestionsLoading && panelSuggestions.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-md font-medium">Recommended for {lastSuggestedAgeGroup} patients</p>
                              <button
                                onClick={() => {
                                  const autoIds = panelSuggestions.filter(s => s.auto_select).map(s => s.panel_id)
                                  if (autoIds.length > 0) {
                                    setSelectedPanelIds((prev: string[]) => {
                                      const combined = new Set([...prev, ...autoIds])
                                      return Array.from(combined)
                                    })
                                  }
                                }}
                                className="text-sm text-primary hover:underline font-medium"
                              >
                                Apply Recommendations
                              </button>
                            </div>
                            {panelSuggestions.map((suggestion) => {
                              const relevanceColor = suggestion.relevance === 'high'
                                ? 'bg-green-100 text-green-900 border-green-300'
                                : suggestion.relevance === 'medium'
                                  ? 'bg-yellow-100 text-yellow-900 border-yellow-300'
                                  : 'bg-gray-100 text-gray-700 border-gray-300'

                              return (
                                <div
                                  key={suggestion.panel_id}
                                  className="rounded-lg border p-3 transition-colors hover:bg-accent/50"
                                >
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedPanelIds.includes(suggestion.panel_id)}
                                      onChange={() => handleTogglePanel(suggestion.panel_id)}
                                      className="w-4 h-4 mt-0.5 cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-base font-semibold">{suggestion.name}</span>
                                        <Badge variant="secondary" className="text-xs">{suggestion.gene_count} genes</Badge>
                                        <Badge variant="outline" className={`text-xs ${relevanceColor}`}>
                                          {suggestion.relevance}
                                        </Badge>
                                      </div>
                                      <p className="text-md text-muted-foreground mt-1">{suggestion.reason}</p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {!suggestionsLoading && panelSuggestions.length === 0 && (ageYears || ageDays) && enableScreening && (
                          <p className="text-md text-muted-foreground py-2">No panel recommendations for this age group.</p>
                        )}
                        {!ageYears && !ageDays && (
                          <p className="text-md text-muted-foreground py-2">Enter patient age to see recommended panels.</p>
                        )}
                      {/* Available Panels */}
                      {panelsLoading ? (
                        <div className="flex items-center gap-2 py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="text-md text-muted-foreground">Loading panels...</span>
                        </div>
                      ) : availablePanels.length > 0 ? (
                        <div className="space-y-2">
                          {availablePanels.map((panel) => {
                            const isExpanded = expandedPanelIds.has(panel.id)
                            const cachedGenes = panelGenesCache[panel.id]

                            return (
                              <div
                                key={panel.id}
                                className="rounded-lg border transition-colors hover:bg-accent/50"
                              >
                                {/* Panel header row */}
                                <div className="flex items-start gap-3 p-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedPanelIds.includes(panel.id)}
                                    onChange={() => handleTogglePanel(panel.id)}
                                    className="w-4 h-4 mt-0.5 cursor-pointer"
                                  />
                                  <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => handleExpandPanel(panel.id)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-base font-medium">{panel.name}</span>
                                      {panel.is_builtin && (
                                        <Badge variant="outline" className="text-xs px-1.5 py-0">Built-in</Badge>
                                      )}
                                      {panel.gene_count !== undefined && (
                                        <span className="text-xs text-muted-foreground">{panel.gene_count} genes</span>
                                      )}
                                    </div>
                                    {panel.description && (
                                      <p className="text-md text-muted-foreground mt-0.5">{panel.description}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleExpandPanel(panel.id)}
                                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                </div>

                                {/* Expanded gene list */}
                                {isExpanded && (
                                  <div className="border-t px-3 pb-3 pt-2">
                                    {panelGenesLoading && !cachedGenes ? (
                                      <div className="flex items-center gap-2 py-2">
                                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Loading genes...</span>
                                      </div>
                                    ) : cachedGenes && cachedGenes.length > 0 ? (
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        {cachedGenes.map((gene) => (
                                          <Tooltip key={gene.gene_symbol}>
                                            <TooltipTrigger asChild>
                                              <Badge
                                                variant="outline"
                                                className="text-xs px-2 py-0.5 cursor-help"
                                              >
                                                {gene.gene_symbol}
                                              </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs">
                                              <div className="space-y-1">
                                                <p className="text-sm font-medium">{gene.gene_symbol}</p>
                                                {gene.disease_name && (
                                                  <p className="text-xs text-muted-foreground">{gene.disease_name}</p>
                                                )}
                                                <p className="text-xs">Priority: {gene.priority_score.toFixed(2)}</p>
                                                {gene.age_group_relevance && (
                                                  <p className="text-xs">Age group: {gene.age_group_relevance}</p>
                                                )}
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground py-1">No genes in this panel.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-md text-muted-foreground py-2">No gene panels available.</p>
                      )}

                      {/* Custom Genes */}
                      <div className="border-t pt-3 space-y-2">
                        <Label className="text-md font-medium">Custom Genes</Label>
                        <p className="text-md text-muted-foreground">
                          Add individual gene symbols to boost during screening.
                        </p>
                          <div className="relative">
                            <div className="flex gap-2">
                              <Input
                                value={customGeneSymbol}
                                onChange={(e) => setCustomGeneSymbol(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddCustomGene()
                                  }
                                  if (e.key === 'Escape') {
                                    setCustomGeneSearchResults([])
                                  }
                                }}
                                placeholder="Search gene symbol..."
                                className="text-base flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddCustomGene}
                                disabled={!customGeneSymbol.trim()}
                                className="px-3"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {customGeneSearchResults.length > 0 && (
                              <div className="absolute z-10 left-0 right-12 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {customGeneSearchResults.map((result) => (
                                  <button
                                    key={result.approved_symbol}
                                    onClick={() => {
                                      const symbol = result.approved_symbol
                                      setCustomGeneSearchResults([])
                                      setCustomGeneSymbol('')
                                      if (customGenes.some(g => g.gene_symbol === symbol)) {
                                        toast.info(symbol + ' is already added')
                                        return
                                      }
                                      setCustomGenes([...customGenes, { gene_symbol: symbol, priority_score: 1.0 }])
                                      toast.success('Added ' + symbol)
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between"
                                  >
                                    <span className="text-base font-medium">{result.approved_symbol}</span>
                                    {result.is_alias && (
                                      <span className="text-xs text-muted-foreground">alias: {result.symbol}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        {customGenes.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {customGenes.map((gene) => (
                              <Badge
                                key={gene.gene_symbol}
                                variant="secondary"
                                className="text-sm px-2.5 py-1 gap-1.5"
                              >
                                {gene.gene_symbol}
                                <button
                                  onClick={() => handleRemoveCustomGene(gene.gene_symbol)}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Family History */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <button className="border-t mt-5 pt-4 w-full flex items-center justify-between group">
                        <Label className="text-base font-medium cursor-pointer">Family History</Label>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-3">
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
                          rows={2}
                        />
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Sample */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <button className="border-t mt-5 pt-4 w-full flex items-center justify-between group">
                        <Label className="text-base font-medium cursor-pointer">Sample</Label>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-2">
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
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Reproductive (female only) */}
                  {sex === 'female' && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <button className="border-t mt-5 pt-4 w-full flex items-center justify-between group">
                          <Label className="text-base font-medium cursor-pointer">Reproductive</Label>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 space-y-2">
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
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Result Preferences */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <button className="border-t mt-5 pt-4 w-full flex items-center justify-between group">
                        <Label className="text-base font-medium cursor-pointer">Result Preferences</Label>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-2">
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
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            )}

            {/* ----- PHENOTYPE SECTION ----- */}
            {activeSection === 'phenotype' && enablePhenotypeMatching && (
              <Card>
                <CardHeader className="pt-4 pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Dna className="h-4 w-4" />
                    Phenotype Information
                    <Badge variant="outline" className="ml-2 text-md">For Phenotype Matching</Badge>
                  </CardTitle>
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
