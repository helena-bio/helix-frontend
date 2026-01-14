"use client"

/**
 * PhenotypeMatchingView Component
 *
 * Displays phenotype matching results between patient HPO terms and variant HPO annotations.
 * Reuses VariantsList component for consistent variant display.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Search, Plus, X, Play, Dna, Loader2, Sparkles, Info, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertCircle, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePhenotypeContext } from '@/contexts/PhenotypeContext'
import { useHPOSearch, useDebounce } from '@/hooks'
import { usePhenotypeMatching } from '@/hooks/mutations/use-phenotype-matching'
import { useVariants } from '@/hooks/queries/use-variant-analysis-queries'
import { VariantMatchResult } from '@/lib/api/hpo'
import { toast } from 'sonner'

interface PhenotypeMatchingViewProps {
  sessionId: string
}

const PAGE_SIZE = 25

const getScoreColor = (score: number) => {
  if (score >= 70) return 'bg-green-100 text-green-900 border-green-300'
  if (score >= 50) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  if (score >= 30) return 'bg-orange-100 text-orange-900 border-orange-300'
  return 'bg-red-100 text-red-900 border-red-300'
}

const getScoreLabel = (score: number) => {
  if (score >= 70) return 'Strong'
  if (score >= 50) return 'Moderate'
  if (score >= 30) return 'Weak'
  return 'Poor'
}

export function PhenotypeMatchingView({ sessionId }: PhenotypeMatchingViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [matchResults, setMatchResults] = useState<VariantMatchResult[] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const { phenotype, addHPOTerm, removeHPOTerm } = usePhenotypeContext()
  const matchingMutation = usePhenotypeMatching()

  // Debounced search
  const debouncedQuery = useDebounce(searchQuery, 300)
  const { data: searchResults, isLoading: isSearching } = useHPOSearch(debouncedQuery, {
    enabled: debouncedQuery.length >= 2,
    limit: 8,
  })

  // Get variants with HPO data for matching
  const { data: variantsData, isLoading: variantsLoading, error: variantsError } = useVariants(sessionId, {
    page: 1,
    page_size: 5000,
  })

  // DEBUG LOGGING
  useEffect(() => {
    console.log('=== PHENOTYPE MATCHING DEBUG ===')
    console.log('sessionId:', sessionId)
    console.log('variantsLoading:', variantsLoading)
    console.log('variantsError:', variantsError)
    console.log('variantsData:', variantsData)
    console.log('variants count:', variantsData?.variants?.length)
    if (variantsData?.variants?.length) {
      const withHPO = variantsData.variants.filter((v: any) => v.hpo_phenotypes).length
      console.log('variants with HPO:', withHPO)
    }
  }, [sessionId, variantsData, variantsLoading, variantsError])

  const selectedTerms = phenotype?.hpo_terms || []

  // Filter suggestions
  const filteredSuggestions = searchResults?.terms.filter(
    (term) => !selectedTerms.find((t) => t.hpo_id === term.hpo_id)
  ) || []

  // Pagination
  const totalResults = matchResults?.length || 0
  const totalPages = Math.ceil(totalResults / PAGE_SIZE)
  const paginatedResults = useMemo(() => {
    if (!matchResults) return []
    const start = (currentPage - 1) * PAGE_SIZE
    return matchResults.slice(start, start + PAGE_SIZE)
  }, [matchResults, currentPage])

  // Toggle row expansion
  const toggleRow = useCallback((variantIdx: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(variantIdx)) {
        next.delete(variantIdx)
      } else {
        next.add(variantIdx)
      }
      return next
    })
  }, [])

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
    console.log('=== RUN MATCHING DEBUG ===')
    console.log('selectedTerms:', selectedTerms)
    console.log('variantsData:', variantsData)
    console.log('variantsData?.variants?.length:', variantsData?.variants?.length)

    if (!selectedTerms.length) {
      toast.error('No phenotypes selected', {
        description: 'Add at least one HPO term to run matching',
      })
      return
    }

    if (!variantsData?.variants?.length) {
      console.log('ERROR: No variants available')
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

    console.log('variantsWithHPO count:', variantsWithHPO.length)

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
      setCurrentPage(1)
      setExpandedRows(new Set())
      toast.success('Matching complete', {
        description: `Analyzed ${result.variants_analyzed} variants`,
      })
    } catch (error) {
      console.error('Matching error:', error)
      toast.error('Matching failed', {
        description: 'Please try again',
      })
    }
  }, [selectedTerms, variantsData, matchingMutation])

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

      {/* Patient Phenotypes Card */}
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
            disabled={selectedTerms.length === 0 || matchingMutation.isPending || variantsLoading}
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

          {/* Info text */}
          <div className="flex gap-3 pt-2">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Phenotype matching uses semantic similarity (Lin score) to compare patient HPO terms
              against gene-phenotype associations from OMIM/HPO databases.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Match Results
            </CardTitle>
            {matchResults && (
              <span className="text-sm text-muted-foreground">
                {totalResults} variants with phenotype data
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!matchResults ? (
            <div className="text-center py-16 text-muted-foreground">
              <Dna className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-base">No results yet</p>
              <p className="text-sm mt-1">Add phenotypes and run matching to see results</p>
            </div>
          ) : matchResults.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-base font-medium mb-2">No variants with HPO annotations</p>
              <p className="text-sm text-muted-foreground">Variants need gene-phenotype associations for matching</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="text-base">Rank</TableHead>
                      <TableHead className="text-base">Gene</TableHead>
                      <TableHead className="text-base">Phenotype Score</TableHead>
                      <TableHead className="text-base">Matched Terms</TableHead>
                      <TableHead className="text-base">Gene HPOs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedResults.map((result, idx) => {
                      const globalIdx = (currentPage - 1) * PAGE_SIZE + idx + 1
                      return (
                        <>
                          <TableRow
                            key={result.variant_idx}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleRow(result.variant_idx)}
                          >
                            <TableCell>
                              {expandedRows.has(result.variant_idx) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              #{globalIdx}
                            </TableCell>
                            <TableCell className="text-base font-medium">
                              {result.gene_symbol}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getScoreColor(result.phenotype_match_score)}>
                                {result.phenotype_match_score.toFixed(1)} - {getScoreLabel(result.phenotype_match_score)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {result.matched_terms}/{result.total_patient_terms}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {result.total_variant_terms}
                            </TableCell>
                          </TableRow>

                          {/* Expanded Row */}
                          {expandedRows.has(result.variant_idx) && (
                            <TableRow key={`${result.variant_idx}-expanded`}>
                              <TableCell colSpan={6} className="bg-muted/30">
                                <div className="p-4">
                                  <p className="text-sm font-medium mb-3">Individual Term Matches</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {result.individual_matches.map((match, mIdx) => (
                                      <div
                                        key={mIdx}
                                        className="flex items-center justify-between p-2 bg-background rounded border"
                                      >
                                        <div className="flex items-center gap-2 text-sm">
                                          <span className="font-medium">{match.patient_hpo_name}</span>
                                          <span className="text-muted-foreground">-</span>
                                          <span className={match.similarity_score > 0.5 ? 'text-green-600' : 'text-muted-foreground'}>
                                            {match.best_match_hpo_name || 'No match'}
                                          </span>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className={match.similarity_score > 0.5 ? 'bg-green-50 text-green-700' : ''}
                                        >
                                          {(match.similarity_score * 100).toFixed(0)}%
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
