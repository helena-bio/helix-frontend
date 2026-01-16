"use client"

/**
 * PhenotypeMatchingView Component - CLINICAL GRADE
 *
 * Uses MatchedPhenotypeContext for cached results.
 * Results are pre-computed after analysis completes.
 *
 * Features:
 * - Instant load (data already cached)
 * - Aggregated by gene
 * - Sorted by Clinical Priority Score
 * - Tier visualization (Tier 1-4)
 * - Manual re-run option
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Search,
  Plus,
  X,
  Play,
  Dna,
  Loader2,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Shield,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePhenotypeContext } from '@/contexts/PhenotypeContext'
import { useMatchedPhenotype, type GeneAggregatedResult } from '@/contexts/MatchedPhenotypeContext'
import { useHPOSearch, useDebounce } from '@/hooks'
import { VariantDetailPanel } from '@/components/analysis/VariantDetailPanel'
import { toast } from 'sonner'

interface PhenotypeMatchingViewProps {
  sessionId: string
}

const PAGE_SIZE = 10

// ============================================================================
// STYLING HELPERS
// ============================================================================

const getTierColor = (tier: string) => {
  if (tier.includes('Tier 1')) return 'bg-red-100 text-red-900 border-red-300'
  if (tier.includes('Tier 2')) return 'bg-orange-100 text-orange-900 border-orange-300'
  if (tier.includes('Tier 3')) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

const getTierShortName = (tier: string) => {
  if (tier.includes('Tier 1')) return 'T1'
  if (tier.includes('Tier 2')) return 'T2'
  if (tier.includes('Tier 3')) return 'T3'
  return 'T4'
}

const getScoreColor = (score: number) => {
  if (score >= 70) return 'bg-green-100 text-green-900 border-green-300'
  if (score >= 50) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  if (score >= 30) return 'bg-orange-100 text-orange-900 border-orange-300'
  return 'bg-red-100 text-red-900 border-red-300'
}

const getACMGColor = (acmg: string | null | undefined) => {
  if (!acmg) return 'bg-gray-100 text-gray-600'
  if (acmg === 'Pathogenic') return 'bg-red-100 text-red-900'
  if (acmg === 'Likely Pathogenic') return 'bg-orange-100 text-orange-900'
  if (acmg === 'Uncertain Significance' || acmg === 'VUS') return 'bg-yellow-100 text-yellow-900'
  if (acmg === 'Likely Benign') return 'bg-blue-100 text-blue-900'
  if (acmg === 'Benign') return 'bg-green-100 text-green-900'
  return 'bg-gray-100 text-gray-600'
}

const getImpactColor = (impact: string | null | undefined) => {
  if (!impact) return 'bg-gray-100 text-gray-600'
  if (impact === 'HIGH') return 'bg-red-100 text-red-900'
  if (impact === 'MODERATE') return 'bg-orange-100 text-orange-900'
  if (impact === 'LOW') return 'bg-yellow-100 text-yellow-900'
  return 'bg-gray-100 text-gray-600'
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PhenotypeMatchingView({ sessionId }: PhenotypeMatchingViewProps) {
  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedGenes, setExpandedGenes] = useState<Set<string>>(new Set())
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null)

  // Contexts
  const { phenotype, addHPOTerm, removeHPOTerm } = usePhenotypeContext()
  const {
    status,
    isLoading,
    matchResponse,
    aggregatedResults,
    runMatching,
    tier1Count,
    tier2Count,
    tier3Count,
    tier4Count,
    variantsAnalyzed,
    totalGenes,
  } = useMatchedPhenotype()

  // HPO search
  const debouncedQuery = useDebounce(searchQuery, 300)
  const { data: searchResults, isLoading: isSearching } = useHPOSearch(debouncedQuery, {
    enabled: debouncedQuery.length >= 2,
    limit: 8,
  })

  const selectedTerms = phenotype?.hpo_terms || []

  // Filter suggestions
  const filteredSuggestions = searchResults?.terms.filter(
    (term) => !selectedTerms.find((t) => t.hpo_id === term.hpo_id)
  ) || []

  // Pagination
  const totalPages = Math.ceil(totalGenes / PAGE_SIZE)
  const paginatedResults = useMemo(() => {
    if (!aggregatedResults) return []
    const start = (currentPage - 1) * PAGE_SIZE
    return aggregatedResults.slice(start, start + PAGE_SIZE)
  }, [aggregatedResults, currentPage])

  // Handlers
  const toggleGene = useCallback((geneSymbol: string) => {
    setExpandedGenes(prev => {
      const next = new Set(prev)
      if (next.has(geneSymbol)) next.delete(geneSymbol)
      else next.add(geneSymbol)
      return next
    })
  }, [])

  const handleAddTerm = useCallback(async (term: { hpo_id: string; name: string; definition?: string }) => {
    try {
      await addHPOTerm(term)
      setSearchQuery('')
      toast.success('Added: ' + term.name)
    } catch (error) {
      toast.error('Failed to add term')
    }
  }, [addHPOTerm])

  const handleRemoveTerm = useCallback(async (hpoId: string) => {
    try {
      await removeHPOTerm(hpoId)
    } catch (error) {
      toast.error('Failed to remove term')
    }
  }, [removeHPOTerm])

  const handleRunMatching = useCallback(async () => {
    if (!selectedTerms.length) {
      toast.error('No phenotypes selected')
      return
    }
    await runMatching()
    toast.success('Matching complete')
  }, [selectedTerms, runMatching])

  // Check if we already have results loaded
  const hasExistingResults = status === 'success' && aggregatedResults && aggregatedResults.length > 0

  // Show success toast only on initial load if results exist
  useEffect(() => {
    if (hasExistingResults && selectedTerms.length > 0) {
      // Results already loaded from context - no need to show toast
    }
  }, []) // Run only once on mount

  // View variant detail
  if (selectedVariantIdx !== null) {
    return (
      <VariantDetailPanel
        sessionId={sessionId}
        variantIdx={selectedVariantIdx}
        onBack={() => setSelectedVariantIdx(null)}
      />
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Dna className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Clinical Phenotype Matching</h1>
          <p className="text-base text-muted-foreground mt-1">
            Prioritize variants by combined clinical evidence: pathogenicity, impact, phenotype match, and frequency.
          </p>
        </div>

        {/* Status Badge */}
        {status === 'success' && hasExistingResults && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            Results Ready
          </Badge>
        )}
        {(status === 'pending' || status === 'loading_variants') && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            {status === 'loading_variants' ? 'Loading variants...' : 'Matching...'}
          </Badge>
        )}
      </div>

      {/* Tier Summary - show when we have results */}
      {hasExistingResults && matchResponse && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-900">{tier1Count}</p>
              <p className="text-sm text-red-700">Tier 1 - Actionable</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-900">{tier2Count}</p>
              <p className="text-sm text-orange-700">Tier 2 - Potentially</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-900">{tier3Count}</p>
              <p className="text-sm text-yellow-700">Tier 3 - Uncertain</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{tier4Count}</p>
              <p className="text-sm text-gray-600">Tier 4 - Unlikely</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patient Phenotypes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Patient Phenotypes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search HPO terms..."
              className="pl-9"
            />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
          </div>

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

          <div className="space-y-2">
            <p className="text-sm font-medium">Selected Terms ({selectedTerms.length})</p>
            {selectedTerms.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No phenotypes selected.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedTerms.map((term) => (
                  <Badge key={term.hpo_id} variant="secondary" className="px-3 py-1.5 bg-primary/10 text-primary">
                    <span className="text-sm">{term.name}</span>
                    <button onClick={() => handleRemoveTerm(term.hpo_id)} className="ml-2 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Only show Run button if no results yet or want to re-run */}
          {!hasExistingResults && (
            <div className="flex gap-2">
              <Button
                onClick={handleRunMatching}
                disabled={selectedTerms.length === 0 || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Matching...</>
                ) : (
                  <><Play className="h-4 w-4 mr-2" />Run Clinical Matching</>
                )}
              </Button>
            </div>
          )}

          {/* Show refresh button if we have results */}
          {hasExistingResults && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRunMatching}
                disabled={isLoading || selectedTerms.length === 0}
                className="w-full"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Re-matching...</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-2" />Re-run Matching</>
                )}
              </Button>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Clinical Priority Score = ACMG (35%) + Impact (25%) + Phenotype (25%) + Frequency (15%).
              Results are cached and update automatically when phenotypes change.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Clinical Results (by Gene)
            </CardTitle>
            {aggregatedResults && (
              <span className="text-sm text-muted-foreground">
                {totalGenes} genes, {variantsAnalyzed} variants
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Loading State */}
          {(status === 'loading_variants' || (isLoading && !aggregatedResults)) && (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-base font-medium">
                {status === 'loading_variants' ? 'Loading variants...' : 'Running phenotype matching...'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
            </div>
          )}

          {/* No Phenotypes State */}
          {status === 'no_phenotypes' && (
            <div className="text-center py-16 text-muted-foreground">
              <Dna className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-base font-medium">No phenotypes defined</p>
              <p className="text-sm mt-1">Add patient HPO terms above to run matching</p>
            </div>
          )}

          {/* Idle State - waiting for user to run matching */}
          {status === 'idle' && selectedTerms.length > 0 && (
            <div className="text-center py-16">
              <Play className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
              <p className="text-base font-medium mb-2">Ready to run matching</p>
              <p className="text-sm text-muted-foreground">
                Click "Run Clinical Matching" above to analyze variants
              </p>
            </div>
          )}

          {/* Empty Results */}
          {status === 'success' && (!aggregatedResults || aggregatedResults.length === 0) && (
            <div className="text-center py-16">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-base font-medium mb-2">No variants with HPO annotations</p>
              <p className="text-sm text-muted-foreground">
                Variants need HPO phenotype data for matching
              </p>
            </div>
          )}

          {/* Results Table */}
          {aggregatedResults && aggregatedResults.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="w-[60px]">Rank</TableHead>
                      <TableHead>Gene</TableHead>
                      <TableHead>Clinical Score</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-center">Variants</TableHead>
                      <TableHead>HPO Match</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedResults.map((geneResult) => (
                      <>
                        <TableRow
                          key={geneResult.gene_symbol}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleGene(geneResult.gene_symbol)}
                        >
                          <TableCell>
                            {expandedGenes.has(geneResult.gene_symbol) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-medium">#{geneResult.rank}</TableCell>
                          <TableCell className="font-semibold">{geneResult.gene_symbol}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getScoreColor(geneResult.best_clinical_score)}>
                              {geneResult.best_clinical_score.toFixed(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getTierColor(geneResult.best_tier)}>
                              {getTierShortName(geneResult.best_tier)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{geneResult.variant_count}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {geneResult.best_phenotype_score.toFixed(0)}%
                            </Badge>
                          </TableCell>
                        </TableRow>

                        {expandedGenes.has(geneResult.gene_symbol) && (
                          <TableRow key={`${geneResult.gene_symbol}-expanded`}>
                            <TableCell colSpan={7} className="bg-muted/30 p-4">
                              <div className="space-y-4">
                                {geneResult.matched_hpo_terms.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-2">Matched HPO Terms</p>
                                    <div className="flex flex-wrap gap-2">
                                      {geneResult.matched_hpo_terms.map((term, idx) => (
                                        <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary">{term}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <p className="text-sm font-medium mb-3">Variants ({geneResult.variant_count})</p>
                                  <div className="space-y-2">
                                    {geneResult.variants.map((variant) => (
                                      <div
                                        key={variant.variant_idx}
                                        className="p-3 border rounded bg-background hover:bg-accent/50 cursor-pointer transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedVariantIdx(variant.variant_idx)
                                        }}
                                      >
                                        <div className="flex items-center justify-between gap-4">
                                          <div className="flex items-center gap-3 flex-wrap">
                                            <Badge variant="outline" className={getTierColor(variant.clinical_tier)}>
                                              {getTierShortName(variant.clinical_tier)}
                                            </Badge>
                                            <Badge variant="outline" className={getACMGColor(variant.acmg_class)}>
                                              {variant.acmg_class === 'Uncertain Significance' ? 'VUS' : variant.acmg_class || 'Unknown'}
                                            </Badge>
                                            <Badge variant="outline" className={getImpactColor(variant.impact)}>
                                              {variant.impact || 'Unknown'}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                              {variant.consequence || 'unknown'}
                                            </span>
                                            {variant.gnomad_af && (
                                              <span className="text-xs font-mono text-muted-foreground">
                                                AF: {variant.gnomad_af.toExponential(2)}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <div className="text-right">
                                              <p className="text-sm font-medium">{variant.clinical_priority_score.toFixed(1)}</p>
                                              <p className="text-xs text-muted-foreground">Clinical</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm">{variant.phenotype_match_score.toFixed(0)}%</p>
                                              <p className="text-xs text-muted-foreground">HPO</p>
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                        </div>
                                      </div>
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4 mr-1" />Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                      Next<ChevronRight className="h-4 w-4 ml-1" />
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
