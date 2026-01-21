"use client"

/**
 * PhenotypeEntry Component - HPO Terms Entry & Phenotype Matching
 *
 * Typography Scale:
 * - text-3xl: Page titles
 * - text-lg: Section headers, card titles
 * - text-base: Primary content, instructions
 * - text-md: Secondary descriptions
 * - text-sm: Helper text, file info
 * - text-xs: Technical metadata (HPO IDs)
 *
 * Features:
 * - Search and add HPO terms with real API
 * - AI-assisted term suggestion from free text (NLP extraction)
 * - Simplified action buttons: Skip or Match Phenotypes
 * - Show matching results summary with tier counts
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Search, Plus, Sparkles, ChevronDown, ChevronUp, X, Dna,
  ArrowRight, Loader2, CheckCircle2, BarChart3, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { HPOTermCard } from './HPOTermCard'
import { HelixLoader } from '@/components/ui/helix-loader'
import { useJourney } from '@/contexts/JourneyContext'
import { useHPOSearch, useDebounce, useHPOExtract, useSavePhenotype } from '@/hooks'
import { useRunPhenotypeMatching } from '@/hooks/mutations/use-phenotype-matching'
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

interface PhenotypeEntryProps {
  sessionId: string
  onComplete?: (data: { hpoTerms: HPOTerm[]; clinicalNotes: string }) => void
  onSkip?: () => void
}

export function PhenotypeEntry({ sessionId, onComplete, onSkip }: PhenotypeEntryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTerms, setSelectedTerms] = useState<HPOTerm[]>([])
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [showAIAssist, setShowAIAssist] = useState(false)
  const [showClinicalNotes, setShowClinicalNotes] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null)
  const [isMatching, setIsMatching] = useState(false)

  const searchContainerRef = useRef<HTMLDivElement>(null)

  const { nextStep, skipToAnalysis } = useJourney()

  const debouncedQuery = useDebounce(searchQuery, 300)

  const { data: searchResults, isLoading: isSearching } = useHPOSearch(debouncedQuery, {
    enabled: debouncedQuery.length >= 2,
    limit: 10,
  })

  const extractMutation = useHPOExtract()
  const saveMutation = useSavePhenotype()
  const matchingMutation = useRunPhenotypeMatching()

  const filteredSuggestions = searchResults?.terms.filter(
    (term) => !selectedTerms.find((t) => t.hpo_id === term.hpo_id)
  ) || []

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

  const addTerm = useCallback((term: HPOTerm) => {
    if (!selectedTerms.find((t) => t.hpo_id === term.hpo_id)) {
      setSelectedTerms(prev => [...prev, term])
      setMatchingResult(null) // Reset matching when terms change
      toast.success('Added: ' + term.name)
    }
  }, [selectedTerms])

  const removeTerm = useCallback((termId: string) => {
    setSelectedTerms(prev => prev.filter((t) => t.hpo_id !== termId))
    setMatchingResult(null) // Reset matching when terms change
  }, [])

  const handleGenerateSuggestions = useCallback(async () => {
    if (!aiInput.trim()) return

    try {
      const result = await extractMutation.mutateAsync(aiInput)

      if (result.terms.length === 0) {
        toast.info('No HPO terms found in text', {
          description: 'Try using more specific clinical terminology',
        })
        return
      }

      let addedCount = 0
      for (const term of result.terms) {
        if (!selectedTerms.find((t) => t.hpo_id === term.hpo_id)) {
          setSelectedTerms(prev => [...prev, {
            hpo_id: term.hpo_id,
            name: term.hpo_name,
          }])
          addedCount++
        }
      }

      if (addedCount > 0) {
        setMatchingResult(null) // Reset matching when terms change
        toast.success('Added ' + addedCount + ' HPO term' + (addedCount > 1 ? 's' : ''), {
          description: result.terms.map(t => t.hpo_name).join(', '),
        })
      } else {
        toast.info('All extracted terms are already added')
      }

      setAiInput('')
      setShowAIAssist(false)
    } catch (error) {
      toast.error('Failed to extract HPO terms', {
        description: 'Please try again or add terms manually',
      })
    }
  }, [aiInput, extractMutation, selectedTerms])

  // Run phenotype matching
  const handleRunMatching = useCallback(async () => {
    if (selectedTerms.length === 0) {
      toast.error('Please add at least one HPO term')
      return
    }

    setIsMatching(true)

    try {
      // First save phenotype data
      const hpoTermsForApi = selectedTerms.map(term => ({
        hpo_id: term.hpo_id,
        name: term.name,
        definition: term.definition,
      }))

      await saveMutation.mutateAsync({
        sessionId,
        data: {
          hpo_terms: hpoTermsForApi,
          clinical_notes: clinicalNotes,
        },
      })

      // Then run matching
      const result = await matchingMutation.mutateAsync({
        sessionId,
        patientHpoIds: selectedTerms.map(t => t.hpo_id),
      })

      setMatchingResult(result)

      toast.success('Phenotype matching complete', {
        description: `${result.tier_1_count + result.tier_2_count} high-priority variants found`,
      })
    } catch (error) {
      toast.error('Matching failed', {
        description: 'Please try again',
      })
    } finally {
      setIsMatching(false)
    }
  }, [selectedTerms, clinicalNotes, sessionId, saveMutation, matchingMutation])

  // Handle match and continue - single action button
  const handleMatchAndContinue = useCallback(async () => {
    // If we have terms but haven't matched yet, run matching first
    if (selectedTerms.length > 0 && !matchingResult) {
      await handleRunMatching()
    }

    // Then continue to analysis
    onComplete?.({ hpoTerms: selectedTerms, clinicalNotes })
    nextStep()
  }, [selectedTerms, clinicalNotes, matchingResult, handleRunMatching, nextStep, onComplete])

  // Skip phenotype entry
  const handleSkip = useCallback(() => {
    onSkip?.()
    skipToAnalysis()
  }, [skipToAnalysis, onSkip])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const showSuggestions = searchQuery.length >= 2 && filteredSuggestions.length > 0

  // Calculate tier percentages for progress bars
  const getTierPercentage = (count: number) => {
    if (!matchingResult || matchingResult.variants_with_hpo === 0) return 0
    return (count / matchingResult.variants_with_hpo) * 100
  }

  return (
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header - HelixLoader + Title side by side */}
        <div className="flex items-center justify-center gap-4">
          <HelixLoader size="xs" speed={3} animated={isMatching} />
          <div>
            <h1 className="text-3xl font-bold">Phenotype Matching</h1>
            <p className="text-base text-muted-foreground">
              Add patient phenotypes to prioritize variants
            </p>
          </div>
        </div>

        {/* Search & Add */}
        <Card>
          <CardContent className="p-4 space-y-3">
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
                      onClick={() => addTerm({ hpo_id: term.hpo_id, name: term.name, definition: term.definition })}
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

              {searchQuery.length >= 2 && !isSearching && filteredSuggestions.length === 0 && searchResults && (
                <p className="mt-2 text-md text-muted-foreground">
                  {searchResults.terms.length > 0
                    ? 'All matching phenotypes have been added'
                    : 'No matching phenotypes found for "' + searchQuery + '"'
                  }
                </p>
              )}
            </div>
          </CardContent>
        </Card>

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

        {/* Additional Clinical Notes */}
        <Collapsible open={showClinicalNotes} onOpenChange={setShowClinicalNotes}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mb-2">
              {showClinicalNotes ? (
                <ChevronUp className="h-4 w-4 mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              <span className="text-base">Additional Clinical Notes</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="e.g. Patient has recurrent febrile seizures and delayed speech..."
              className="min-h-[100px] text-base bg-background"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Selected Terms Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Dna className="h-4 w-4" />
              Selected Phenotypes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {selectedTerms.length > 0 ? (
              <div className="space-y-2">
                {selectedTerms.map((term) => (
                  <HPOTermCard
                    key={term.hpo_id}
                    hpoId={term.hpo_id}
                    name={term.name}
                    definition={term.definition}
                    onRemove={removeTerm}
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
        </Card>

        {/* Matching Results */}
        {matchingResult && (
          <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                Matching Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* Stats */}
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

              {/* Tier Breakdown */}
              <div className="space-y-3">
                <p className="text-base font-medium">Clinical Priority Tiers</p>

                {/* Tier 1 */}
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

                {/* Tier 2 */}
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

                {/* Tier 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      Tier 3 - Uncertain
                    </span>
                    <span className="font-medium">{matchingResult.tier_3_count}</span>
                  </div>
                  <Progress value={getTierPercentage(matchingResult.tier_3_count)} className="h-2 bg-yellow-100" />
                </div>

                {/* Tier 4 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                      Tier 4 - Unlikely
                    </span>
                    <span className="font-medium">{matchingResult.tier_4_count}</span>
                  </div>
                  <Progress value={getTierPercentage(matchingResult.tier_4_count)} className="h-2 bg-gray-100" />
                </div>
              </div>

              {/* High Priority Summary */}
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

        {/* Actions - Simplified to 2 buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleSkip}>
            <span className="text-base">Skip to Analysis</span>
          </Button>
          <Button
            onClick={handleMatchAndContinue}
            disabled={isMatching || selectedTerms.length === 0}
          >
            {isMatching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-base">Matching...</span>
              </>
            ) : selectedTerms.length > 0 && !matchingResult ? (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="text-base">Match Phenotypes</span>
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
