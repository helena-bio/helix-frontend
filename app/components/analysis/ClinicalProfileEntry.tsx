"use client"

/**
 * ClinicalProfileEntry Component - Patient Clinical Profile
 *
 * Collects comprehensive patient information and runs:
 * 1. Screening analysis (age-aware variant prioritization)
 * 2. Phenotype matching (if HPO terms provided)
 * 3. Literature analysis (automated)
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Search, Plus, Sparkles, ChevronDown, ChevronUp, X, Dna,
  ArrowRight, Loader2, CheckCircle2, User,
  Globe, Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HPOTermCard } from './HPOTermCard'
import { HelixLoader } from '@/components/ui/helix-loader'
import { useJourney } from '@/contexts/JourneyContext'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { useHPOSearch, useDebounce, useHPOExtract } from '@/hooks'
import { useRunPhenotypeMatching } from '@/hooks/mutations/use-phenotype-matching'
import { useRunScreening } from '@/hooks/mutations/use-screening'
import type {
  Demographics,
  Sex,
  Ethnicity,
  EthnicityData,
  ClinicalContext,
  Indication,
  FamilyHistory,
  ReproductiveContext,
  SampleInfo,
  SampleType,
  ConsentPreferences,
} from '@/types/clinical-profile.types'
import { ETHNICITY_LABELS, INDICATION_LABELS, SAMPLE_TYPE_LABELS } from '@/types/clinical-profile.types'
import { toast } from 'sonner'

interface HPOTerm {
  hpo_id: string
  name: string
  definition?: string
}

interface MatchingResult {
  session_id: string
  patient_hpo_count: number
  variants_analyzed: number
  variants_with_hpo: number
  tier_1_count: number
  tier_2_count: number
  tier_3_count: number
  tier_4_count: number
  saved_to_duckdb: boolean
  message: string
}

interface ClinicalProfileEntryProps {
  sessionId: string
  onComplete?: () => void
}

export function ClinicalProfileEntry({ sessionId, onComplete }: ClinicalProfileEntryProps) {
  const {
    profile,
    updateProfile,
    addHPOTerm,
    removeHPOTerm,
  } = useClinicalProfileContext()

  // UI state - всички collapsed по подразбиране
  const [searchQuery, setSearchQuery] = useState('')
  const [showAIAssist, setShowAIAssist] = useState(false)
  const [showRecommended, setShowRecommended] = useState(false)
  const [showPhenotype, setShowPhenotype] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<string>('')

  // Demographics state
  const [ageYears, setAgeYears] = useState<string>(profile?.demographics?.age_years?.toString() || '')
  const [ageDays, setAgeDays] = useState<string>(profile?.demographics?.age_days?.toString() || '')
  const [sex, setSex] = useState<Sex>(profile?.demographics?.sex || 'female')

  // Ethnicity state - undefined по подразбиране
  const [ethnicity, setEthnicity] = useState<Ethnicity | undefined>(profile?.ethnicity?.primary)
  const [ethnicityNote, setEthnicityNote] = useState(profile?.ethnicity?.note || '')

  // Clinical context state - undefined по подразбиране
  const [indication, setIndication] = useState<Indication | undefined>(profile?.clinical_context?.indication)
  const [indicationDetails, setIndicationDetails] = useState(profile?.clinical_context?.indication_details || '')
  const [hasFamilyHistory, setHasFamilyHistory] = useState(profile?.clinical_context?.family_history?.has_affected_relatives || false)
  const [hasConsanguinity, setHasConsanguinity] = useState(profile?.clinical_context?.family_history?.consanguinity || false)
  const [familyHistoryDetails, setFamilyHistoryDetails] = useState(profile?.clinical_context?.family_history?.details || '')

  // Phenotype state
  const [clinicalNotes, setClinicalNotes] = useState(profile?.phenotype?.clinical_notes || '')

  // Advanced - Reproductive state
  const [isPregnant, setIsPregnant] = useState(profile?.reproductive?.is_pregnant || false)
  const [gestationalAge, setGestationalAge] = useState<string>(profile?.reproductive?.gestational_age_weeks?.toString() || '')
  const [familyPlanning, setFamilyPlanning] = useState(profile?.reproductive?.family_planning || false)

  // Advanced - Sample info state - undefined по подразбиране
  const [sampleType, setSampleType] = useState<SampleType | undefined>(profile?.sample_info?.sample_type)
  const [hasParentalSamples, setHasParentalSamples] = useState(profile?.sample_info?.has_parental_samples || false)
  const [hasAffectedSibling, setHasAffectedSibling] = useState(profile?.sample_info?.has_affected_sibling || false)

  // Advanced - Consent state
  const [consentSecondaryFindings, setConsentSecondaryFindings] = useState(profile?.consent?.secondary_findings ?? true)
  const [consentCarrierResults, setConsentCarrierResults] = useState(profile?.consent?.carrier_results ?? true)
  const [consentPharmacogenomics, setConsentPharmacogenomics] = useState(profile?.consent?.pharmacogenomics ?? false)

  const searchContainerRef = useRef<HTMLDivElement>(null)

  const { nextStep } = useJourney()

  const debouncedQuery = useDebounce(searchQuery, 300)

  const { data: searchResults, isLoading: isSearching } = useHPOSearch(debouncedQuery, {
    enabled: debouncedQuery.length >= 2,
    limit: 10,
  })

  const extractMutation = useHPOExtract()
  const matchingMutation = useRunPhenotypeMatching()
  const screeningMutation = useRunScreening()

  const selectedTerms = profile?.phenotype?.hpo_terms || []

  const filteredSuggestions = searchResults?.terms.filter(
    (term) => !selectedTerms.find((t) => t.hpo_id === term.hpo_id)
  ) || []

  // Local validation - check form data directly, not saved profile
  const hasRequiredFormData = !!(
    sex &&
    (ageYears || ageDays)
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        searchQuery.length > 0
      ) {
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [searchQuery])

  const handleAddTerm = useCallback(async (term: HPOTerm) => {
    if (!selectedTerms.find((t) => t.hpo_id === term.hpo_id)) {
      await addHPOTerm(term)
      setMatchingResult(null)
      toast.success('Added: ' + term.name)
    }
  }, [selectedTerms, addHPOTerm])

  const handleRemoveTerm = useCallback(async (termId: string) => {
    await removeHPOTerm(termId)
    setMatchingResult(null)
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
        if (!selectedTerms.find((t) => t.hpo_id === term.hpo_id)) {
          await addHPOTerm({
            hpo_id: term.hpo_id,
            name: term.hpo_name,
          })
          addedCount++
        }
      }

      if (addedCount > 0) {
        setMatchingResult(null)
        toast.success('Added ' + addedCount + ' HPO term' + (addedCount > 1 ? 's' : ''))
      } else {
        toast.info('All extracted terms are already added')
      }

      setAiInput('')
      setShowAIAssist(false)
    } catch (error) {
      toast.error('Failed to extract HPO terms')
    }
  }, [aiInput, extractMutation, selectedTerms, addHPOTerm])

  // Save complete profile
  const handleSaveProfile = useCallback(async () => {
    const ageY = ageYears ? parseInt(ageYears, 10) : undefined
    const ageD = ageDays ? parseInt(ageDays, 10) : undefined

    if (!sex || (!ageY && !ageD)) {
      toast.error('Please fill required fields')
      return false
    }

    const demographics: Demographics = {
      sex,
      age_years: ageY,
      age_days: ageD,
    }

    const ethnicityData: EthnicityData | undefined = ethnicity ? {
      primary: ethnicity,
      note: ethnicityNote || undefined,
    } : undefined

    const familyHistory: FamilyHistory = {
      has_affected_relatives: hasFamilyHistory,
      consanguinity: hasConsanguinity,
      details: familyHistoryDetails || undefined,
    }

    const clinicalContext: ClinicalContext | undefined = indication ? {
      indication,
      indication_details: indicationDetails || undefined,
      family_history: familyHistory,
    } : undefined

    const reproductive: ReproductiveContext = {
      is_pregnant: isPregnant,
      gestational_age_weeks: gestationalAge ? parseInt(gestationalAge, 10) : undefined,
      family_planning: familyPlanning,
    }

    const sampleInfo: SampleInfo | undefined = sampleType ? {
      sample_type: sampleType,
      has_parental_samples: hasParentalSamples,
      has_affected_sibling: hasAffectedSibling,
    } : undefined

    const consent: ConsentPreferences = {
      secondary_findings: consentSecondaryFindings,
      carrier_results: consentCarrierResults,
      pharmacogenomics: consentPharmacogenomics,
    }

    try {
      await updateProfile({
        demographics,
        ethnicity: ethnicityData,
        clinical_context: clinicalContext,
        phenotype: profile?.phenotype,
        reproductive,
        sample_info: sampleInfo,
        consent,
      })
      
      // Save clinical notes if changed
      if (clinicalNotes !== profile?.phenotype?.clinical_notes) {
        await updateProfile({
          demographics,
          ethnicity: ethnicityData,
          clinical_context: clinicalContext,
          phenotype: {
            hpo_terms: selectedTerms,
            clinical_notes: clinicalNotes,
          },
          reproductive,
          sample_info: sampleInfo,
          consent,
        })
      }
      
      return true
    } catch (error) {
      toast.error('Failed to save profile')
      return false
    }
  }, [
    ageYears,
    ageDays,
    sex,
    ethnicity,
    ethnicityNote,
    indication,
    indicationDetails,
    hasFamilyHistory,
    hasConsanguinity,
    familyHistoryDetails,
    isPregnant,
    gestationalAge,
    familyPlanning,
    sampleType,
    hasParentalSamples,
    hasAffectedSibling,
    consentSecondaryFindings,
    consentCarrierResults,
    consentPharmacogenomics,
    clinicalNotes,
    selectedTerms,
    profile,
    updateProfile,
  ])

  // Continue to analysis - orchestrates all analyses
  const handleContinue = useCallback(async () => {
    setIsProcessing(true)
    
    try {
      // Step 1: Save clinical profile
      setProcessingStep('Saving clinical profile...')
      const saved = await handleSaveProfile()
      if (!saved) {
        setIsProcessing(false)
        return
      }

      // Step 2: Run screening (REQUIRED - age-aware variant prioritization)
      setProcessingStep('Running screening analysis...')
      try {
        const ageY = ageYears ? parseInt(ageYears, 10) : undefined
        const ageD = ageDays ? parseInt(ageDays, 10) : undefined
        
        await screeningMutation.mutateAsync({
          session_id: sessionId,
          age_years: ageY,
          age_days: ageD,
          sex,
          ethnicity: ethnicity || undefined,
          has_family_history: hasFamilyHistory,
          indication: indication || undefined,
          consanguinity: hasConsanguinity,
          screening_mode: 'proactive_adult',
          patient_hpo_terms: selectedTerms.map(t => t.hpo_id),
          sample_type: sampleType || undefined,
          is_pregnant: isPregnant,
          has_parental_samples: hasParentalSamples,
          has_affected_sibling: hasAffectedSibling,
        })
        
        toast.success('Screening analysis complete')
      } catch (error) {
        console.error('Screening failed:', error)
        toast.error('Screening analysis failed')
        // Continue anyway - screening is not blocking
      }

      // Step 3: Run phenotype matching (OPTIONAL - only if HPO terms provided)
      if (selectedTerms.length > 0) {
        setProcessingStep('Running phenotype matching...')
        try {
          const result = await matchingMutation.mutateAsync({
            sessionId,
            patientHpoIds: selectedTerms.map(t => t.hpo_id),
          })
          
          setMatchingResult(result)
          toast.success('Phenotype matching complete')
        } catch (error) {
          console.error('Phenotype matching failed:', error)
          toast.error('Phenotype matching failed')
          // Continue anyway - phenotype matching is optional
        }
      }

      // Step 4: Literature analysis would run automatically in background
      // (handled by literature service via event bus)

      setProcessingStep('Complete!')
      toast.success('Analysis pipeline complete')
      
      // Navigate to analysis view
      onComplete?.()
      nextStep()
      
    } catch (error) {
      console.error('Analysis pipeline error:', error)
      toast.error('Analysis pipeline failed')
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }, [
    handleSaveProfile,
    screeningMutation,
    matchingMutation,
    sessionId,
    ageYears,
    ageDays,
    sex,
    ethnicity,
    hasFamilyHistory,
    indication,
    hasConsanguinity,
    selectedTerms,
    sampleType,
    isPregnant,
    hasParentalSamples,
    hasAffectedSibling,
    nextStep,
    onComplete,
  ])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const showSuggestions = searchQuery.length >= 2 && filteredSuggestions.length > 0

  const getTierPercentage = (count: number) => {
    if (!matchingResult || matchingResult.variants_with_hpo === 0) return 0
    return (count / matchingResult.variants_with_hpo) * 100
  }

  return (
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center gap-4">
          <HelixLoader size="xs" speed={3} animated={isProcessing} />
          <div>
            <h1 className="text-3xl font-bold">Clinical Profile</h1>
            <p className="text-base text-muted-foreground">
              Patient demographics, clinical context, and phenotype data for enhanced variant analysis
            </p>
          </div>
        </div>

        {/* REQUIRED: Demographics */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Demographics
              <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Age */}
            <div className="space-y-2">
              <Label className="text-base">Age *</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age-years" className="text-sm text-muted-foreground">Years</Label>
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
                  <Label htmlFor="age-days" className="text-sm text-muted-foreground">Days (for infants)</Label>
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

            {/* Sex */}
            <div className="space-y-2">
              <Label className="text-base">Sex *</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={sex === 'female' ? 'default' : 'outline'}
                  onClick={() => setSex('female')}
                  className="flex-1"
                >
                  Female
                </Button>
                <Button
                  type="button"
                  variant={sex === 'male' ? 'default' : 'outline'}
                  onClick={() => setSex('male')}
                  className="flex-1"
                >
                  Male
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RECOMMENDED: Ethnicity & Clinical Context - Single Card */}
        <Card>
          <Collapsible open={showRecommended} onOpenChange={setShowRecommended}>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Additional Information</span>
                    <Badge variant="secondary" className="ml-2 text-xs">Recommended</Badge>
                  </div>
                  {showRecommended ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CardTitle>
                {!showRecommended && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Ethnicity improves variant frequency filtering. Family history boosts relevant gene prioritization.
                  </p>
                )}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-6">
                {/* Ethnicity */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Ethnicity & Ancestry
                  </Label>
                  <Select value={ethnicity} onValueChange={(val) => setEthnicity(val as Ethnicity)}>
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
                  <Label className="text-base font-medium">
                    Clinical Context
                  </Label>
                  <Select value={indication} onValueChange={(val) => setIndication(val as Indication)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select indication (optional)" />
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
                  <Label className="text-base font-medium">
                    Family History
                  </Label>
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
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* OPTIONAL: Phenotype Section - Single Card with Collapse */}
        <Card>
          <Collapsible open={showPhenotype} onOpenChange={setShowPhenotype}>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dna className="h-4 w-4" />
                    <span>Phenotype Information</span>
                    <Badge variant="secondary" className="ml-2 text-xs">Optional</Badge>
                  </div>
                  {showPhenotype ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CardTitle>
                {!showPhenotype && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Adding patient symptoms (HPO terms) enables phenotype-based variant matching and prioritization.
                  </p>
                )}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {/* Search */}
                <div ref={searchContainerRef}>
                  <label className="text-base font-medium mb-2 block">Search Phenotypes</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
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

                  {showSuggestions && (
                    <div className="mt-2 p-2 bg-card border border-border rounded-lg max-h-64 overflow-y-auto">
                      {filteredSuggestions.map((term) => (
                        <button
                          key={term.hpo_id}
                          onClick={() => handleAddTerm({ hpo_id: term.hpo_id, name: term.name, definition: term.definition })}
                          className="w-full text-left p-3 hover:bg-accent rounded flex items-start justify-between group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-medium">{term.name}</span>
                              <span className="text-xs text-muted-foreground">({term.hpo_id})</span>
                            </div>
                            {term.definition && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {term.definition.replace(/^"/, '').replace(/".*$/, '')}
                              </p>
                            )}
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Assistant */}
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
                          className="w-full"
                        >
                          {extractMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              <span className="text-base">Extracting...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              <span className="text-base">Generate Suggestions</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* Clinical Notes - Always visible */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Additional Clinical Notes</Label>
                  <Textarea
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="e.g. Patient has recurrent febrile seizures..."
                    className="min-h-[100px] text-base bg-background"
                  />
                </div>

                {/* Selected Terms */}
                {selectedTerms.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected Phenotypes ({selectedTerms.length})</p>
                    {selectedTerms.map((term) => (
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
                    <p className="text-sm text-muted-foreground">No phenotypes selected</p>
                    <p className="text-xs text-muted-foreground mt-1">Search and add HPO terms above</p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* ADVANCED OPTIONS - Single Card */}
        <Card>
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Advanced Options</span>
                    <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
                  </div>
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CardTitle>
                {!showAdvanced && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Reproductive context, sample information, and result reporting preferences.
                  </p>
                )}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-6">
                {/* Reproductive Context */}
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

                {/* Sample Information */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Sample Information</Label>
                  <Select value={sampleType} onValueChange={(val) => setSampleType(val as SampleType)}>
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

                {/* Consent Preferences */}
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
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Matching Results */}
        {matchingResult && (
          <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                Phenotype Matching Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-base">
                <div>
                  <span className="text-muted-foreground">Variants Analyzed</span>
                  <p className="text-xl font-semibold">{matchingResult.variants_analyzed.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">With HPO Data</span>
                  <p className="text-xl font-semibold">{matchingResult.variants_with_hpo.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-base font-medium">Clinical Priority Tiers</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      Tier 1 - Actionable
                    </span>
                    <span className="font-medium">{matchingResult.tier_1_count}</span>
                  </div>
                  <Progress value={getTierPercentage(matchingResult.tier_1_count)} className="h-2 bg-red-100" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                      Tier 2 - Potentially Actionable
                    </span>
                    <span className="font-medium">{matchingResult.tier_2_count}</span>
                  </div>
                  <Progress value={getTierPercentage(matchingResult.tier_2_count)} className="h-2 bg-orange-100" />
                </div>
              </div>

              {(matchingResult.tier_1_count + matchingResult.tier_2_count) > 0 && (
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <p className="text-base font-medium text-green-800 dark:text-green-300">
                    {matchingResult.tier_1_count + matchingResult.tier_2_count} high-priority variants
                    match the patient's phenotype
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <p className="text-base font-medium text-blue-900 dark:text-blue-300">
                  {processingStep}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions - Only Continue button, disabled until required data filled */}
        <div className="flex justify-end">
          <Button
            onClick={handleContinue}
            disabled={!hasRequiredFormData || isProcessing}
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-base">{processingStep || 'Processing...'}</span>
              </>
            ) : (
              <>
                <span className="text-base">Continue to Analysis</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
