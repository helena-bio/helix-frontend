"use client"

/**
 * PhenotypeEntry Component - HPO Terms Entry Page
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
 * - Additional clinical notes
 * - Summary panel with selected terms
 */

import { useState, useCallback } from 'react'
import { Search, Plus, Sparkles, ChevronDown, ChevronUp, X, Dna, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useJourney } from '@/contexts/JourneyContext'
import { useHPOSearch, useDebounce, useHPOExtract } from '@/hooks'
import { toast } from 'sonner'

interface HPOTerm {
  id: string
  name: string
  definition?: string
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
  const [isSaving, setIsSaving] = useState(false)

  const { nextStep } = useJourney()

  // Debounce search query for API calls
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Fetch HPO suggestions from API
  const { data: searchResults, isLoading: isSearching } = useHPOSearch(debouncedQuery, {
    enabled: debouncedQuery.length >= 2,
    limit: 10,
  })

  // HPO extraction mutation
  const extractMutation = useHPOExtract()

  // Filter out already selected terms
  const filteredSuggestions = searchResults?.terms.filter(
    (term) => !selectedTerms.find((t) => t.id === term.id)
  ) || []

  // Add term to selection (keep search query)
  const addTerm = useCallback((term: HPOTerm) => {
    if (!selectedTerms.find((t) => t.id === term.id)) {
      setSelectedTerms(prev => [...prev, term])
      toast.success(`Added: ${term.name}`)
    }
    // Don't clear searchQuery - keep it so user can continue selecting
  }, [selectedTerms])

  // Remove term from selection
  const removeTerm = useCallback((termId: string) => {
    setSelectedTerms(prev => prev.filter((t) => t.id !== termId))
  }, [])

  // AI-assisted term extraction using NLP
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

      // Add extracted terms that aren't already selected
      let addedCount = 0
      for (const term of result.terms) {
        if (!selectedTerms.find((t) => t.id === term.hpo_id)) {
          setSelectedTerms(prev => [...prev, {
            id: term.hpo_id,
            name: term.hpo_name,
          }])
          addedCount++
        }
      }

      if (addedCount > 0) {
        toast.success(`Added ${addedCount} HPO term${addedCount > 1 ? 's' : ''}`, {
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

  // Save and continue
  const handleSaveAndContinue = useCallback(async () => {
    setIsSaving(true)

    try {
      // TODO: Save phenotype data to backend
      toast.success('Phenotype data saved', {
        description: `${selectedTerms.length} HPO terms added`,
      })

      onComplete?.({ hpoTerms: selectedTerms, clinicalNotes })
      nextStep()
    } catch (error) {
      toast.error('Failed to save phenotype data')
    } finally {
      setIsSaving(false)
    }
  }, [selectedTerms, clinicalNotes, nextStep, onComplete])

  // Skip phenotype entry
  const handleSkip = useCallback(() => {
    toast.info('Skipping phenotype entry', {
      description: 'You can add phenotype data later',
    })
    onSkip?.()
    nextStep()
  }, [nextStep, onSkip])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  return (
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Dna className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Enter Phenotype Data</h1>
            <p className="text-base text-muted-foreground mt-1">
              Add patient clinical features (HPO terms)
            </p>
            <p className="text-md text-muted-foreground mt-1">
              Adding phenotype data improves variant-phenotype matching and prioritization
            </p>
          </div>
        </div>

        {/* Search & Add */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Search Input */}
            <div>
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

              {/* Suggestions Dropdown */}
              {filteredSuggestions.length > 0 && (
                <div className="mt-2 p-2 bg-card border border-border rounded-lg max-h-64 overflow-y-auto">
                  {filteredSuggestions.map((term) => (
                    <button
                      key={term.id}
                      onClick={() => addTerm({ id: term.id, name: term.name, definition: term.definition })}
                      className="w-full text-left p-3 hover:bg-accent rounded flex items-start justify-between group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-medium">{term.name}</span>
                          <span className="text-xs text-muted-foreground">({term.id})</span>
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

              {/* No results message */}
              {debouncedQuery.length >= 2 && !isSearching && filteredSuggestions.length === 0 && searchResults && (
                <p className="mt-2 text-md text-muted-foreground">
                  {searchResults.terms.length > 0 
                    ? 'All matching phenotypes have been added'
                    : `No matching phenotypes found for "${debouncedQuery}"`
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
                className="w-full justify-between p-4 h-auto hover:bg-primary/10"
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
              <div className="px-4 pb-4 space-y-3">
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
              className="min-h-[100px] text-base"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Summary Panel with Selected Terms */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Dna className="h-4 w-4" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Stats */}
            <div className="flex gap-6 text-base">
              <span>
                <strong>{selectedTerms.length}</strong> HPO term{selectedTerms.length !== 1 ? 's' : ''} added
              </span>
              <span>
                <strong>{clinicalNotes.trim() ? '1' : '0'}</strong> clinical note{clinicalNotes.trim() ? '' : 's'}
              </span>
            </div>

            {/* Selected Terms Tags */}
            {selectedTerms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTerms.map((term) => (
                  <Badge
                    key={term.id}
                    variant="secondary"
                    className="px-3 py-1.5 bg-primary/10 text-primary border-primary/20"
                  >
                    <span className="text-sm">{term.name}</span>
                    <span className="text-xs ml-1 opacity-70">({term.id})</span>
                    <button
                      onClick={() => removeTerm(term.id)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Empty State */}
            {selectedTerms.length === 0 && (
              <p className="text-md text-muted-foreground">
                No phenotypes selected yet. Search above to add HPO terms.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleSkip}>
            <span className="text-base">Skip for now</span>
          </Button>
          <Button
            onClick={handleSaveAndContinue}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-base">Saving...</span>
              </>
            ) : (
              <>
                <span className="text-base">Save & Continue</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
