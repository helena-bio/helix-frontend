"use client"

/**
 * PhenotypeMatchingView Component - CLINICAL GRADE
 *
 * Displays clinical-grade phenotype matching results:
 * - Aggregated by gene
 * - Sorted by Clinical Priority Score (not just phenotype match)
 * - Tier visualization (Tier 1-4)
 * - Full variant quality data display
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Search, Plus, X, Play, Dna, Loader2, Sparkles, Info, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertCircle, ArrowUpDown, Shield, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePhenotypeContext } from '@/contexts/PhenotypeContext'
import { useHPOSearch, useDebounce } from '@/hooks'
import { usePhenotypeMatching } from '@/hooks/mutations/use-phenotype-matching'
import { useVariants } from '@/hooks/queries/use-variant-analysis-queries'
import { VariantMatchResult, MatchVariantPhenotypesResponse } from '@/lib/api/hpo'
import { VariantDetailPanel } from '@/components/analysis/VariantDetailPanel'
import { toast } from 'sonner'

interface PhenotypeMatchingViewProps {
  sessionId: string
}

interface GeneAggregatedResult {
  gene_symbol: string
  rank: number
  best_clinical_score: number
  best_phenotype_score: number
  best_tier: string
  variant_count: number
  matched_hpo_terms: string[]
  variants: VariantMatchResult[]
}

const PAGE_SIZE = 10

// Tier colors and styling
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

/**
 * Aggregate results by gene, using best clinical score
 */
function aggregateResultsByGene(results: VariantMatchResult[]): GeneAggregatedResult[] {
  const geneMap = new Map<string, {
    variants: VariantMatchResult[]
    bestClinicalScore: number
    bestPhenotypeScore: number
    bestTier: string
    matchedTerms: Set<string>
  }>()

  results.forEach((result) => {
    if (!geneMap.has(result.gene_symbol)) {
      geneMap.set(result.gene_symbol, {
        variants: [],
        bestClinicalScore: result.clinical_priority_score,
        bestPhenotypeScore: result.phenotype_match_score,
        bestTier: result.clinical_tier,
        matchedTerms: new Set(),
      })
    }

    const geneData = geneMap.get(result.gene_symbol)!
    geneData.variants.push(result)
    
    // Track best scores
    if (result.clinical_priority_score > geneData.bestClinicalScore) {
      geneData.bestClinicalScore = result.clinical_priority_score
      geneData.bestTier = result.clinical_tier
    }
    geneData.bestPhenotypeScore = Math.max(geneData.bestPhenotypeScore, result.phenotype_match_score)

    result.individual_matches.forEach(match => {
      if (match.similarity_score > 0.5) {
        geneData.matchedTerms.add(match.patient_hpo_name)
      }
    })
  })

  return Array.from(geneMap.entries())
    .map(([gene_symbol, data]) => ({
      gene_symbol,
      rank: 0,
      best_clinical_score: data.bestClinicalScore,
      best_phenotype_score: data.bestPhenotypeScore,
      best_tier: data.bestTier,
      variant_count: data.variants.length,
      matched_hpo_terms: Array.from(data.matchedTerms),
      variants: data.variants.sort((a, b) => b.clinical_priority_score - a.clinical_priority_score),
    }))
    .sort((a, b) => b.best_clinical_score - a.best_clinical_score)
    .map((item, idx) => ({ ...item, rank: idx + 1 }))
}

export function PhenotypeMatchingView({ sessionId }: PhenotypeMatchingViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [matchResponse, setMatchResponse] = useState<MatchVariantPhenotypesResponse | null>(null)
  const [aggregatedResults, setAggregatedResults] = useState<GeneAggregatedResult[] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedGenes, setExpandedGenes] = useState<Set<string>>(new Set())
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null)

  const { phenotype, addHPOTerm, removeHPOTerm } = usePhenotypeContext()
  const matchingMutation = usePhenotypeMatching()

  const debouncedQuery = useDebounce(searchQuery, 300)
  const { data: searchResults, isLoading: isSearching } = useHPOSearch(debouncedQuery, {
    enabled: debouncedQuery.length >= 2,
    limit: 8,
  })

  const { data: variantsData, isLoading: variantsLoading } = useVariants(sessionId, {
    page: 1,
    page_size: 1000,
  })

  const selectedTerms = phenotype?.hpo_terms || []

  // Aggregate when results change
  useEffect(() => {
    if (matchResponse?.results && matchResponse.results.length > 0) {
      const aggregated = aggregateResultsByGene(matchResponse.results)
      setAggregatedResults(aggregated)
    }
  }, [matchResponse])

  // Auto-run matching if phenotypes exist
  useEffect(() => {
    if (selectedTerms.length > 0 && !matchResponse && variantsData?.variants?.length && !matchingMutation.isPending) {
      runMatching()
    }
  }, [selectedTerms, variantsData])

  const runMatching = async () => {
    if (!selectedTerms.length || !variantsData?.variants?.length) return

    const variantsWithData = variantsData.variants
      .filter((v: any) => v.hpo_phenotypes)
      .map((v: any) => ({
        variant_idx: v.variant_idx,
        gene_symbol: v.gene_symbol || 'Unknown',
        hpo_ids: v.hpo_phenotypes?.split('; ').filter(Boolean) || [],
        // Include variant quality data for clinical prioritization
        acmg_class: v.acmg_class || null,
        impact: v.impact || null,
        gnomad_af: v.global_af || null,
        consequence: v.consequence || null,
      }))

    if (!variantsWithData.length) return

    try {
      const result = await matchingMutation.mutateAsync({
        patient_hpo_ids: selectedTerms.map(t => t.hpo_id),
        variants: variantsWithData,
      })
      setMatchResponse(result)
      setCurrentPage(1)
      setExpandedGenes(new Set())
    } catch (error) {
      console.error('Matching failed:', error)
    }
  }

  const filteredSuggestions = searchResults?.terms.filter(
    (term) => !selectedTerms.find((t) => t.hpo_id === term.hpo_id)
  ) || []

  const totalResults = aggregatedResults?.length || 0
  const totalPages = Math.ceil(totalResults / PAGE_SIZE)
  const paginatedResults = useMemo(() => {
    if (!aggregatedResults) return []
    const start = (currentPage - 1) * PAGE_SIZE
    return aggregatedResults.slice(start, start + PAGE_SIZE)
  }, [aggregatedResults, currentPage])

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
      setMatchResponse(null) // Clear results to trigger re-run
      toast.success('Added: ' + term.name)
    } catch (error) {
      toast.error('Failed to add term')
    }
  }, [addHPOTerm])

  const handleRemoveTerm = useCallback(async (hpoId: string) => {
    try {
      await removeHPOTerm(hpoId)
      setMatchResponse(null) // Clear results to trigger re-run
    } catch (error) {
      toast.error('Failed to remove term')
    }
  }, [removeHPOTerm])

  const handleRunMatching = useCallback(async () => {
    if (!selectedTerms.length) {
      toast.error('No phenotypes selected')
      return
    }
    if (!variantsData?.variants?.length) {
      toast.error('No variants available')
      return
    }
    await runMatching()
    toast.success('Matching complete')
  }, [selectedTerms, variantsData])

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
      </div>

      {/* Tier Summary */}
      {matchResponse && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-900">{matchResponse.tier_1_count}</p>
              <p className="text-sm text-red-700">Tier 1 - Actionable</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-900">{matchResponse.tier_2_count}</p>
              <p className="text-sm text-orange-700">Tier 2 - Potentially</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-900">{matchResponse.tier_3_count}</p>
              <p className="text-sm text-yellow-700">Tier 3 - Uncertain</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{matchResponse.tier_4_count}</p>
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

          <Button
            onClick={handleRunMatching}
            disabled={selectedTerms.length === 0 || matchingMutation.isPending || variantsLoading}
            className="w-auto"
          >
            {matchingMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Matching...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" />Run Clinical Matching</>
            )}
          </Button>

          <div className="flex gap-3 pt-2">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Clinical Priority Score = ACMG (35%) + Impact (25%) + Phenotype (25%) + Frequency (15%).
              Sorted by clinical relevance, not just phenotype match.
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
                {totalResults} genes, {matchResponse?.variants_analyzed || 0} variants
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!aggregatedResults ? (
            <div className="text-center py-16 text-muted-foreground">
              <Dna className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-base">No results yet</p>
              <p className="text-sm mt-1">Add phenotypes and run matching</p>
            </div>
          ) : aggregatedResults.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-base font-medium mb-2">No variants with HPO annotations</p>
            </div>
          ) : (
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
