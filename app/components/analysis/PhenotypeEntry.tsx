"use client"

/**
 * PhenotypeEntry Component - HPO Terms Entry Page
 *
 * Features:
 * - Search and add HPO terms with real API
 * - Debounced search for performance
 * - AI-assisted term suggestion from free text
 * - Additional clinical notes
 * - Summary panel
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
import { useHPOSearch, useDebounce } from '@/hooks'
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
  const [isProcessing, setIsProcessing] = useState(false)

  const { nextStep } = useJourney()

  // Debounce search query for API calls
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Fetch HPO suggestions from API
  const { data: searchResults, isLoading: isSearching } = useHPOSearch(debouncedQuery, {
    enabled: debouncedQuery.length >= 2,
    limit: 10,
  })

  // Filter out already selected terms
  const filteredSuggestions = searchResults?.terms.filter(
    (term) => !selectedTerms.find((t) => t.id === term.id)
  ) || []

  // Add term to selection
  const addTerm = useCallback((term: HPOTerm) => {
    setSelectedTerms(prev => [...prev, term])
    setSearchQuery('')
    toast.success(`Added: ${term.name}`)
  }, [])

  // Remove term from selection
  const removeTerm = useCallback((termId: string) => {
    setSelectedTerms(prev => prev.filter((t) => t.id !== termId))
  }, [])

  // AI-assisted term suggestion (mock for now)
  const handleAISuggest = useCallback(async () => {
    if (!aiInput.trim()) return

    setIsProcessing(true)
    
    // TODO: Call AI endpoint for term extraction
    // For now, search for keywords in the input
    const keywords = aiInput.toLowerCase().split(/\s+/)
    const searchPromises = keywords
      .filter(k => k.length >= 3)
      .slice(0, 3)
      .map(k => searchHPOTermsAPI(k))

    try {
      const results = await Promise.all(searchPromises)
      const allTerms = results.flatMap(r => r.terms || [])
      
      // Add unique terms that aren't already selected
      let added = 0
      const seen = new Set(selectedTerms.map(t => t.id))
      
      for (const term of allTerms) {
        if (!seen.has(term.id) && added < 5) {
          addTerm(term)
          seen.add(term.id)
          added++
        }
      }

      if (added > 0) {
        toast.success(`Added ${added} HPO term${added > 1 ? 's' : ''} from text`)
      } else {
        toast.info('No new matching HPO terms found')
      }
    } catch (error) {
      toast.error('Failed to extract HPO terms')
    } finally {
      setIsProcessing(false)
      setAiInput('')
      setShowAIAssist(false)
    }
  }, [aiInput, selectedTerms, addTerm])

  // Save and continue
  const handleSaveAndContinue = useCallback(async () => {
    setIsProcessing(true)

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
      setIsProcessing(false)
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

  return (
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Dna className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Enter Phenotype Data</h1>
            <p className="text-muted-foreground mt-1">
              Add patient clinical features (HPO terms)
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Adding phenotype data improves variant-phenotype matching and prioritization
            </p>
          </div>
        </div>

        {/* Search & Add */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Search Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search Phenotypes</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search phenotype or HPO term..."
                  className="pl-9"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Suggestions Dropdown */}
              {filteredSuggestions.length > 0 && (
                <div className="mt-2 p-2 bg-card border border-border rounded-lg max-h-64 overflow-y-auto">
                  {filteredSuggestions.map((term) => (
                    <button
                      key={term.id}
                      onClick={() => addTerm(term)}
                      className="w-full text-left p-3 hover:bg-accent rounded flex items-start justify-between group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{term.name}</span>
                          <span className="text-xs text-muted-foreground">({term.id})</span>
                        </div>
                        {term.definition && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
                <p className="mt-2 text-sm text-muted-foreground">
                  No matching phenotypes found for "{debouncedQuery}"
                </p>
              )}
            </div>

            {/* Selected Terms */}
            {selectedTerms.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Selected Phenotypes ({selectedTerms.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedTerms.map((term) => (
                    <Badge
                      key={term.id}
                      variant="secondary"
                      className="px-3 py-1.5 bg-primary/10 text-primary border-primary/20"
                    >
                      {term.name}
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
              </div>
            )}
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
                  <span className="font-medium">Suggest HPO terms from free text</span>
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
                  className="min-h-[80px] bg-background"
                />
                <Button
                  onClick={handleAISuggest}
                  disabled={!aiInput.trim() || isProcessing}
                  size="sm"
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
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

        {/* Additional Clinical Notes */}
        <Collapsible open={showClinicalNotes} onOpenChange={setShowClinicalNotes}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mb-2">
              {showClinicalNotes ? (
                <ChevronUp className="h-4 w-4 mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              Additional Clinical Notes
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="e.g. Patient has recurrent febrile seizures and delayed speech..."
              className="min-h-[100px]"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Summary Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Dna className="h-4 w-4" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">-</span>
                <span>
                  <strong>{selectedTerms.length}</strong> HPO term{selectedTerms.length !== 1 ? 's' : ''} added
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">-</span>
                <span>
                  <strong>{clinicalNotes.trim() ? '1' : '0'}</strong> clinical note{clinicalNotes.trim() ? '' : 's'}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button
            onClick={handleSaveAndContinue}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save & Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Helper function for AI suggest
async function searchHPOTermsAPI(query: string) {
  try {
    const baseURL = process.env.NEXT_PUBLIC_PHENOTYPE_API_URL || 'http://localhost:9004/api'
    const response = await fetch(`${baseURL}/hpo/search?q=${encodeURIComponent(query)}&limit=5`)
    if (!response.ok) return { terms: [] }
    return await response.json()
  } catch {
    return { terms: [] }
  }
}
