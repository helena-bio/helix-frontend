"use client"

/**
 * PhenotypeMatchingView Component
 * 
 * Displays phenotype matching results between patient HPO terms and variant HPO annotations.
 * Allows user to:
 * - View current patient phenotypes
 * - Add/remove HPO terms
 * - Run phenotype matching against variants
 * - View ranked results by phenotype match score
 */

import { useState, useCallback } from 'react'
import { Search, Plus, X, Play, Dna, ArrowUpDown, Loader2, Sparkles, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { usePhenotypeContext } from '@/contexts/PhenotypeContext'
import { useHPOSearch, useDebounce } from '@/hooks'
import { usePhenotypeMatching } from '@/hooks/mutations/use-phenotype-matching'
import { useVariants } from '@/hooks/queries/use-variant-analysis-queries'
import { VariantMatchResult } from '@/lib/api/hpo'
import { toast } from 'sonner'

interface PhenotypeMatchingViewProps {
  sessionId: string
}

export function PhenotypeMatchingView({ sessionId }: PhenotypeMatchingViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [matchResults, setMatchResults] = useState<VariantMatchResult[] | null>(null)
  
  const { phenotype, addHPOTerm, removeHPOTerm, isLoading: phenotypeLoading } = usePhenotypeContext()
  const matchingMutation = usePhenotypeMatching()
  
  // Debounced search
  const debouncedQuery = useDebounce(searchQuery, 300)
  const { data: searchResults, isLoading: isSearching } = useHPOSearch(debouncedQuery, {
    enabled: debouncedQuery.length >= 2,
    limit: 8,
  })

  // Get variants with HPO data for matching
  const { data: variantsData } = useVariants(sessionId, {
    page: 1,
    page_size: 1000, // Get all variants for matching
  })

  const selectedTerms = phenotype?.hpo_terms || []
  
  // Filter suggestions
  const filteredSuggestions = searchResults?.terms.filter(
    (term) => !selectedTerms.find((t) => t.hpo_id === term.hpo_id)
  ) || []

  // Add term handler
  const handleAddTerm = useCallback(async (term: { hpo_id: string; name: string; definition?: string }) => {
    try {
      await addHPOTerm(term)
      setSearchQuery('')
      toast.success('Added: ' + term.name)
    } catch (error) {
      toast.error('Failed to add term')
    }
  }, [addHPOTerm])

  // Remove term handler
  const handleRemoveTerm = useCallback(async (hpoId: string) => {
    try {
      await removeHPOTerm(hpoId)
    } catch (error) {
      toast.error('Failed to remove term')
    }
  }, [removeHPOTerm])

  // Run matching
  const handleRunMatching = useCallback(async () => {
    if (!selectedTerms.length) {
      toast.error('No phenotypes selected', {
        description: 'Add at least one HPO term to run matching',
      })
      return
    }

    if (!variantsData?.variants?.length) {
      toast.error('No variants available', {
        description: 'Upload and process a VCF file first',
      })
      return
    }

    // Prepare variants with HPO data
    const variantsWithHPO = variantsData.variants
      .filter((v: any) => v.hpo_phenotypes)
      .map((v: any, idx: number) => ({
        variant_idx: v.variant_idx || idx,
        gene_symbol: v.gene_symbol || 'Unknown',
        hpo_ids: v.hpo_phenotypes?.split('; ').filter(Boolean) || [],
      }))

    if (!variantsWithHPO.length) {
      toast.error('No variants with HPO annotations', {
        description: 'Variants need gene-phenotype associations for matching',
      })
      return
    }

    try {
      const result = await matchingMutation.mutateAsync({
        patient_hpo_ids: selectedTerms.map(t => t.hpo_id),
        variants: variantsWithHPO,
      })
      
      setMatchResults(result.results)
      toast.success('Matching complete', {
        description: `Analyzed ${result.variants_analyzed} variants`,
      })
    } catch (error) {
      toast.error('Matching failed', {
        description: 'Please try again',
      })
    }
  }, [selectedTerms, variantsData, matchingMutation])

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50'
    if (score >= 50) return 'text-yellow-600 bg-yellow-50'
    if (score >= 30) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Strong'
    if (score >= 50) return 'Moderate'
    if (score >= 30) return 'Weak'
    return 'Poor'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Dna className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Phenotype Matching</h1>
          <p className="text-base text-muted-foreground mt-1">
            Match variants to patient phenotypes using HPO terms and semantic similarity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Patient Phenotypes */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Patient Phenotypes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search HPO terms..."
                  className="pl-9"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>

              {/* Search Suggestions */}
              {searchQuery.length >= 2 && filteredSuggestions.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((term) => (
                    <button
                      key={term.hpo_id}
                      onClick={() => handleAddTerm(term)}
                      className="w-full text-left p-3 hover:bg-accent flex items-center justify-between group border-b last:border-b-0"
                    >
                      <div>
                        <span className="text-sm font-medium">{term.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">({term.hpo_id})</span>
                      </div>
                      <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Terms */}
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Selected Terms ({selectedTerms.length})
                </p>
                {selectedTerms.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No phenotypes selected. Search and add HPO terms above.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedTerms.map((term) => (
                      <Badge
                        key={term.hpo_id}
                        variant="secondary"
                        className="px-3 py-1.5 bg-primary/10 text-primary"
                      >
                        <span className="text-sm">{term.name}</span>
                        <button
                          onClick={() => handleRemoveTerm(term.hpo_id)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Run Matching Button */}
              <Button
                onClick={handleRunMatching}
                disabled={selectedTerms.length === 0 || matchingMutation.isPending}
                className="w-full"
              >
                {matchingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Matching...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Phenotype Matching
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">How it works</p>
                  <p>
                    Phenotype matching uses semantic similarity (Lin score) to compare 
                    patient HPO terms against gene-phenotype associations from OMIM/HPO databases.
                    Higher scores indicate stronger phenotype-genotype correlation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Results */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Match Results
                {matchResults && (
                  <Badge variant="outline" className="ml-2">
                    {matchResults.length} variants
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!matchResults ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Dna className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No results yet</p>
                  <p className="text-xs mt-1">Add phenotypes and run matching</p>
                </div>
              ) : matchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No variants with HPO annotations found
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {matchResults.slice(0, 50).map((result, idx) => (
                    <div
                      key={result.variant_idx}
                      className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                          <span className="font-medium">{result.gene_symbol}</span>
                        </div>
                        <Badge className={getScoreColor(result.phenotype_match_score)}>
                          {result.phenotype_match_score.toFixed(1)} - {getScoreLabel(result.phenotype_match_score)}
                        </Badge>
                      </div>
                      
                      <Progress 
                        value={result.phenotype_match_score} 
                        className="h-2 mb-2"
                      />
                      
                      <div className="text-xs text-muted-foreground">
                        {result.matched_terms}/{result.total_patient_terms} terms matched | 
                        {result.total_variant_terms} gene phenotypes
                      </div>

                      {/* Individual matches */}
                      {result.individual_matches.length > 0 && (
                        <div className="mt-2 pt-2 border-t space-y-1">
                          {result.individual_matches.map((match, mIdx) => (
                            <div key={mIdx} className="flex items-center text-xs gap-2">
                              <span className="text-muted-foreground">{match.patient_hpo_name}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className={match.similarity_score > 0.5 ? 'text-green-600' : 'text-muted-foreground'}>
                                {match.best_match_hpo_name || 'No match'}
                              </span>
                              <span className="ml-auto font-mono">
                                {(match.similarity_score * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
