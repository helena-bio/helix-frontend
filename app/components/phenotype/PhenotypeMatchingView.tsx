"use client"

/**
 * PhenotypeMatchingView Component - OPTIMIZED
 *
 * Displays phenotype matching results AGGREGATED BY GENE.
 * - One row per gene (not per variant)
 * - Expandable to show all variants for each gene
 * - Shows variant details from phenotype matching
 * - Compact button design
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

interface GeneAggregatedResult {
  gene_symbol: string
  rank: number
  best_phenotype_score: number
  variant_count: number
  total_variant_terms: number
  matched_terms: number
  total_patient_terms: number
  matched_hpo_terms: string[]
  match_percentage: number
  variants: VariantMatchResult[]
}

const PAGE_SIZE = 10

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

/**
 * Aggregate variant results by gene
 * Groups all variants for same gene, keeps best score
 */
function aggregateResultsByGene(results: VariantMatchResult[]): GeneAggregatedResult[] {
  const geneMap = new Map<string, {
    variants: VariantMatchResult[]
    bestScore: number
    matchedTerms: Set<string>
  }>()

  // Group variants by gene
  results.forEach((result) => {
    if (!geneMap.has(result.gene_symbol)) {
      geneMap.set(result.gene_symbol, {
        variants: [],
        bestScore: result.phenotype_match_score,
        matchedTerms: new Set(),
      })
    }

    const geneData = geneMap.get(result.gene_symbol)!
    geneData.variants.push(result)
    geneData.bestScore = Math.max(geneData.bestScore, result.phenotype_match_score)

    // Collect unique matched terms
    result.individual_matches.forEach(match => {
      geneData.matchedTerms.add(match.patient_hpo_name)
    })
  })

  // Convert to sorted array
  let rank = 1
  return Array.from(geneMap.entries())
    .map(([gene_symbol, data]) => ({
      gene_symbol,
      rank: rank++,
      best_phenotype_score: data.bestScore,
      variant_count: data.variants.length,
      total_variant_terms: data.variants[0]?.total_variant_terms || 0,
      matched_terms: Math.max(...data.variants.map(v => v.matched_terms)),
      total_patient_terms: data.variants[0]?.total_patient_terms || 0,
      matched_hpo_terms: Array.from(data.matchedTerms),
      match_percentage: Math.max(...data.variants.map(v => 
        Math.round((v.matched_terms / v.total_patient_terms) * 100)
      )),
      variants: data.variants.sort((a, b) => b.phenotype_match_score - a.phenotype_match_score),
    }))
    .sort((a, b) => b.best_phenotype_score - a.best_phenotype_score)
    .map((item, idx) => ({ ...item, rank: idx + 1 }))
}

/**
 * Variant row component - shows matching results for each variant
 */
function VariantDetailRow({ variant }: { variant: VariantMatchResult }) {
  return (
    <div className="p-3 border rounded bg-background/50 hover:bg-background transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Variant Index */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm font-mono">
              Variant #{variant.variant_idx}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {variant.total_variant_terms} HPO terms
            </Badge>
          </div>

          {/* HPO Matches for this variant */}
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Matched:</span> {variant.matched_terms}/{variant.total_patient_terms} patient phenotypes
          </div>
        </div>

        {/* Right side - Phenotype Score */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <Badge variant="outline" className={`${getScoreColor(variant.phenotype_match_score)}`}>
              {variant.phenotype_match_score.toFixed(1)}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {getScoreLabel(variant.phenotype_match_score)}
            </p>
          </div>
        </div>
      </div>

      {/* Matched HPO terms */}
      {variant.individual_matches.length > 0 && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">HPO Term Matches:</p>
          <div className="flex flex-wrap gap-1">
            {variant.individual_matches
              .filter(m => m.similarity_score > 0.5)
              .slice(0, 8)
              .map((match, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs bg-green-50 text-green-700"
                  title={`${(match.similarity_score * 100).toFixed(0)}% similarity`}
                >
                  {match.patient_hpo_name}
                </Badge>
              ))}
            {variant.individual_matches.filter(m => m.similarity_score > 0.5).length > 8 && (
              <Badge variant="outline" className="text-xs">
                +{variant.individual_matches.filter(m => m.similarity_score > 0.5).length - 8} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function PhenotypeMatchingView({ sessionId }: PhenotypeMatchingViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [matchResults, setMatchResults] = useState<VariantMatchResult[] | null>(null)
  const [aggregatedResults, setAggregatedResults] = useState<GeneAggregatedResult[] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedGenes, setExpandedGenes] = useState<Set<string>>(new Set())

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
    page_size: 1000,
  })

  const selectedTerms = phenotype?.hpo_terms || []

  // Aggregate results when they change
  useEffect(() => {
    if (matchResults && matchResults.length > 0) {
      const aggregated = aggregateResultsByGene(matchResults)
      setAggregatedResults(aggregated)
    }
  }, [matchResults])

  // Filter suggestions
  const filteredSuggestions = searchResults?.terms.filter(
    (term) => !selectedTerms.find((t) => t.hpo_id === term.hpo_id)
  ) || []

  // Pagination
  const totalResults = aggregatedResults?.length || 0
  const totalPages = Math.ceil(totalResults / PAGE_SIZE)
  const paginatedResults = useMemo(() => {
    if (!aggregatedResults) return []
    const start = (currentPage - 1) * PAGE_SIZE
    return aggregatedResults.slice(start, start + PAGE_SIZE)
  }, [aggregatedResults, currentPage])

  // Toggle row expansion
  const toggleGene = useCallback((geneSymbol: string) => {
    setExpandedGenes(prev => {
      const next = new Set(prev)
      if (next.has(geneSymbol)) {
        next.delete(geneSymbol)
      } else {
        next.add(geneSymbol)
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
      setCurrentPage(1)
      setExpandedGenes(new Set())
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

          {/* Run Matching Button - COMPACT */}
          <Button
            onClick={handleRunMatching}
            disabled={selectedTerms.length === 0 || matchingMutation.isPending || variantsLoading}
            className="w-auto"
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
              Match Results (Aggregated by Gene)
            </CardTitle>
            {aggregatedResults && (
              <span className="text-sm text-muted-foreground">
                {totalResults} genes, {matchResults?.length || 0} variants
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!aggregatedResults ? (
            <div className="text-center py-16 text-muted-foreground">
              <Dna className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-base">No results yet</p>
              <p className="text-sm mt-1">Add phenotypes and run matching to see results</p>
            </div>
          ) : aggregatedResults.length === 0 ? (
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
                      <TableHead className="text-base w-[60px]">Rank</TableHead>
                      <TableHead className="text-base">Gene</TableHead>
                      <TableHead className="text-base">Best Score</TableHead>
                      <TableHead className="text-base text-center">Variants</TableHead>
                      <TableHead className="text-base text-center">HPO Match %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedResults.map((geneResult) => (
                      <>
                        {/* Gene Row - AGGREGATED */}
                        <TableRow
                          key={geneResult.gene_symbol}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleGene(geneResult.gene_symbol)}
                        >
                          <TableCell>
                            {expandedGenes.has(geneResult.gene_symbol) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-medium">
                            #{geneResult.rank}
                          </TableCell>
                          <TableCell className="text-base font-semibold">
                            {geneResult.gene_symbol}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getScoreColor(geneResult.best_phenotype_score)}
                            >
                              {geneResult.best_phenotype_score.toFixed(1)} - {getScoreLabel(geneResult.best_phenotype_score)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm font-medium">
                            {geneResult.variant_count}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">
                              {geneResult.match_percentage}%
                            </Badge>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Gene Row - Show all variants */}
                        {expandedGenes.has(geneResult.gene_symbol) && (
                          <TableRow key={`${geneResult.gene_symbol}-expanded`}>
                            <TableCell colSpan={6} className="bg-muted/30 p-4">
                              <div className="space-y-4">
                                {/* Matched HPO terms for this gene */}
                                <div>
                                  <p className="text-sm font-medium mb-2">Matched HPO Terms</p>
                                  <div className="flex flex-wrap gap-2">
                                    {geneResult.matched_hpo_terms.map((term, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="bg-primary/10 text-primary"
                                      >
                                        {term}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* List of variants for this gene */}
                                <div>
                                  <p className="text-sm font-medium mb-3">
                                    Variants ({geneResult.variant_count})
                                  </p>
                                  <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {geneResult.variants.map((variant, vIdx) => (
                                      <VariantDetailRow
                                        key={`${geneResult.gene_symbol}-${vIdx}`}
                                        variant={variant}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
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
