"use client"

/**
 * PhenotypeEntry Component - HPO Terms Entry Page
 *
 * Features:
 * - Search and add HPO terms
 * - AI-assisted term suggestion from free text
 * - Additional clinical notes
 * - Summary panel
 * - Advances to Analysis step on save
 */

import { useState, useCallback } from 'react'
import { Search, Plus, Sparkles, ChevronDown, ChevronUp, X, Dna, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useJourney } from '@/contexts/JourneyContext'
import { toast } from 'sonner'

interface HPOTerm {
  id: string
  label: string
  isCommon?: boolean
}

interface PhenotypeEntryProps {
  sessionId: string
  onComplete?: (data: { hpoTerms: HPOTerm[]; clinicalNotes: string }) => void
  onSkip?: () => void
}

// Mock HPO terms database - in production this would come from API
const HPO_SUGGESTIONS: HPOTerm[] = [
  { id: "HP:0001250", label: "Seizures", isCommon: true },
  { id: "HP:0001263", label: "Global developmental delay", isCommon: true },
  { id: "HP:0001249", label: "Intellectual disability", isCommon: true },
  { id: "HP:0001252", label: "Hypotonia", isCommon: true },
  { id: "HP:0001298", label: "Encephalopathy", isCommon: false },
  { id: "HP:0002133", label: "Status epilepticus", isCommon: false },
  { id: "HP:0001257", label: "Spasticity", isCommon: true },
  { id: "HP:0000707", label: "Abnormality of the nervous system", isCommon: true },
  { id: "HP:0001290", label: "Generalized hypotonia", isCommon: false },
  { id: "HP:0002376", label: "Developmental regression", isCommon: false },
  { id: "HP:0000252", label: "Microcephaly", isCommon: true },
  { id: "HP:0001156", label: "Brachydactyly", isCommon: false },
  { id: "HP:0000316", label: "Hypertelorism", isCommon: false },
  { id: "HP:0000347", label: "Micrognathia", isCommon: false },
  { id: "HP:0000369", label: "Low-set ears", isCommon: false },
]

export function PhenotypeEntry({ sessionId, onComplete, onSkip }: PhenotypeEntryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTerms, setSelectedTerms] = useState<HPOTerm[]>([])
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [showAIAssist, setShowAIAssist] = useState(false)
  const [showClinicalNotes, setShowClinicalNotes] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const { nextStep } = useJourney()

  // Filter suggestions based on search query
  const filteredSuggestions = searchQuery.length > 0
    ? HPO_SUGGESTIONS.filter(
        (term) =>
          (term.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            term.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
          !selectedTerms.find((t) => t.id === term.id)
      )
    : []

  // Add term to selection
  const addTerm = useCallback((term: HPOTerm) => {
    setSelectedTerms(prev => [...prev, term])
    setSearchQuery('')
  }, [])

  // Remove term from selection
  const removeTerm = useCallback((termId: string) => {
    setSelectedTerms(prev => prev.filter((t) => t.id !== termId))
  }, [])

  // AI-assisted term suggestion
  const handleAISuggest = useCallback(() => {
    const suggestions: HPOTerm[] = []
    const input = aiInput.toLowerCase()

    // Mock AI suggestion based on free text keywords
    if (input.includes('epilepsy') || input.includes('seizure')) {
      const term = HPO_SUGGESTIONS.find(t => t.id === 'HP:0001250')
      if (term) suggestions.push(term)
    }
    if (input.includes('delay') || input.includes('developmental')) {
      const term = HPO_SUGGESTIONS.find(t => t.id === 'HP:0001263')
      if (term) suggestions.push(term)
    }
    if (input.includes('hypotonia') || input.includes('low tone') || input.includes('floppy')) {
      const term = HPO_SUGGESTIONS.find(t => t.id === 'HP:0001252')
      if (term) suggestions.push(term)
    }
    if (input.includes('intellectual') || input.includes('cognitive') || input.includes('mental')) {
      const term = HPO_SUGGESTIONS.find(t => t.id === 'HP:0001249')
      if (term) suggestions.push(term)
    }
    if (input.includes('microcephaly') || input.includes('small head')) {
      const term = HPO_SUGGESTIONS.find(t => t.id === 'HP:0000252')
      if (term) suggestions.push(term)
    }
    if (input.includes('regression')) {
      const term = HPO_SUGGESTIONS.find(t => t.id === 'HP:0002376')
      if (term) suggestions.push(term)
    }

    // Add new suggestions that aren't already selected
    let added = 0
    suggestions.forEach((term) => {
      if (!selectedTerms.find((t) => t.id === term.id)) {
        addTerm(term)
        added++
      }
    })

    if (added > 0) {
      toast.success(`Added ${added} HPO term${added > 1 ? 's' : ''}`)
    } else if (suggestions.length === 0) {
      toast.info('No matching HPO terms found. Try different keywords.')
    } else {
      toast.info('All suggested terms are already added.')
    }

    setAiInput('')
    setShowAIAssist(false)
  }, [aiInput, selectedTerms, addTerm])

  // Save and continue
  const handleSaveAndContinue = useCallback(async () => {
    setIsProcessing(true)

    try {
      // TODO: Save phenotype data to backend
      // await savePhenotype(sessionId, { hpoTerms: selectedTerms, clinicalNotes })

      toast.success('Phenotype data saved', {
        description: `${selectedTerms.length} HPO terms added`,
      })

      onComplete?.({ hpoTerms: selectedTerms, clinicalNotes })
      nextStep() // phenotype -> analysis
    } catch (error) {
      toast.error('Failed to save phenotype data')
    } finally {
      setIsProcessing(false)
    }
  }, [sessionId, selectedTerms, clinicalNotes, nextStep, onComplete])

  // Skip phenotype entry
  const handleSkip = useCallback(() => {
    toast.info('Skipping phenotype entry', {
      description: 'You can add phenotype data later',
    })
    onSkip?.()
    nextStep() // phenotype -> analysis
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
              </div>

              {/* Suggestions Dropdown */}
              {filteredSuggestions.length > 0 && (
                <div className="mt-2 p-2 bg-card border border-border rounded-lg max-h-48 overflow-y-auto">
                  {filteredSuggestions.slice(0, 8).map((term) => (
                    <button
                      key={term.id}
                      onClick={() => addTerm(term)}
                      className="w-full text-left p-2 hover:bg-accent rounded flex items-center justify-between group"
                    >
                      <div>
                        <span className="text-sm font-medium">{term.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">({term.id})</span>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Terms */}
            {selectedTerms.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Selected Phenotypes</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTerms.map((term) => (
                    <Badge
                      key={term.id}
                      variant="secondary"
                      className={`px-3 py-1.5 ${
                        term.isCommon
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                          : ''
                      }`}
                    >
                      {term.label}
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
                  disabled={!aiInput.trim()}
                  size="sm"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Suggestions
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
              'Saving...'
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
