"use client"

/**
 * PhenotypeMatchingView Component - CLINICAL GRADE
 *
 * Card-based layout matching LiteratureMatchingView design.
 * Uses lazy loading with Intersection Observer for smooth scrolling.
 *
 * Features:
 * - Card per gene (not table rows)
 * - Lazy loading (no pagination)
 * - Consistent typography with LiteratureMatchingView
 * - Auto-expand top 3 genes
 * - Filter by gene name
 * - Aligned columns across all gene cards
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  Dna,
  Loader2,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Shield,
  ExternalLink,
  Filter,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { usePhenotypeContext } from '@/contexts/PhenotypeContext'
import { useMatchedPhenotype, type GeneAggregatedResult } from '@/contexts/MatchedPhenotypeContext'
import { VariantDetailPanel } from '@/components/analysis/VariantDetailPanel'
import type { SessionMatchResult } from '@/lib/api/hpo'

interface PhenotypeMatchingViewProps {
  sessionId: string
}

const INITIAL_LOAD = 15
const LOAD_MORE_COUNT = 15

// ============================================================================
// STYLING HELPERS (matching LiteratureMatchingView exactly)
// ============================================================================

const getTierColor = (tier: string) => {
  const tierLower = tier.toLowerCase()
  if (tierLower.includes('1')) {
    return 'bg-red-100 text-red-900 border-red-300'
  }
  if (tierLower.includes('2') || tierLower.includes('potentially')) {
    return 'bg-orange-100 text-orange-900 border-orange-300'
  }
  if (tierLower.includes('3') || tierLower.includes('uncertain')) {
    return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  }
  if (tierLower.includes('4') || tierLower.includes('unlikely')) {
    return 'bg-gray-100 text-gray-600 border-gray-300'
  }
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

/**
 * Format tier for display - always use short format T1, T2, T3, T4
 */
const formatTierDisplay = (tier: string): string => {
  const tierLower = tier.toLowerCase()
  if (tierLower.includes('1')) return 'T1'
  if (tierLower.includes('2') || tierLower.includes('potentially')) return 'T2'
  if (tierLower.includes('3') || tierLower.includes('uncertain')) return 'T3'
  if (tierLower.includes('4') || tierLower.includes('unlikely')) return 'T4'
  return tier
}

const getScoreColor = (score: number) => {
  if (score >= 70) return 'bg-green-100 text-green-900 border-green-300'
  if (score >= 50) return 'bg-blue-100 text-blue-900 border-blue-300'
  if (score >= 30) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

const getACMGColor = (acmg: string | null | undefined) => {
  if (!acmg) return 'bg-gray-100 text-gray-600 border-gray-300'
  const acmgLower = acmg.toLowerCase()
  if (acmgLower === 'pathogenic') return 'bg-red-100 text-red-900 border-red-300'
  if (acmgLower === 'likely pathogenic') return 'bg-orange-100 text-orange-900 border-orange-300'
  if (acmgLower.includes('uncertain') || acmgLower === 'vus') return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  if (acmgLower === 'likely benign') return 'bg-blue-100 text-blue-900 border-blue-300'
  if (acmgLower === 'benign') return 'bg-green-100 text-green-900 border-green-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

const getImpactColor = (impact: string | null | undefined) => {
  if (!impact) return 'bg-gray-100 text-gray-600 border-gray-300'
  const impactUpper = impact.toUpperCase()
  if (impactUpper === 'HIGH') return 'bg-red-100 text-red-900 border-red-300'
  if (impactUpper === 'MODERATE') return 'bg-orange-100 text-orange-900 border-orange-300'
  if (impactUpper === 'LOW') return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

const formatACMGDisplay = (acmg: string | null | undefined): string => {
  if (!acmg) return 'Unknown'
  if (acmg.toLowerCase().includes('uncertain')) return 'VUS'
  return acmg
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface VariantCardProps {
  variant: SessionMatchResult
  onViewDetails: (variantIdx: number) => void
}

function VariantCard({ variant, onViewDetails }: VariantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={`text-sm ${getTierColor(variant.clinical_tier)}`}>
              {formatTierDisplay(variant.clinical_tier)}
            </Badge>
            <Badge variant="outline" className={`text-sm ${getACMGColor(variant.acmg_class)}`}>
              {formatACMGDisplay(variant.acmg_class)}
            </Badge>
            <Badge variant="outline" className={`text-sm ${getImpactColor(variant.impact)}`}>
              {variant.impact || 'Unknown'}
            </Badge>
            <Badge variant="outline" className={`text-sm ${getScoreColor(variant.clinical_priority_score)}`}>
              {variant.clinical_priority_score.toFixed(1)}
            </Badge>
          </div>
          <p className="text-base text-muted-foreground">
            {variant.consequence || 'unknown consequence'}
            {variant.gnomad_af && (
              <span className="ml-2 font-mono text-sm">
                AF: {variant.gnomad_af.toExponential(2)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-base font-medium">{variant.phenotype_match_score.toFixed(0)}%</p>
            <p className="text-sm text-muted-foreground">HPO Match</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Score Breakdown */}
          <div>
            <p className="text-base font-semibold mb-2">Score Breakdown</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ACMG Weight</span>
                <span>35%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impact Weight</span>
                <span>25%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phenotype Weight</span>
                <span>25%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequency Weight</span>
                <span>15%</span>
              </div>
            </div>
          </div>

          {/* Individual HPO Matches */}
          {variant.individual_matches && variant.individual_matches.length > 0 && (
            <div>
              <p className="text-base font-semibold mb-2">HPO Term Matches</p>
              <div className="space-y-1">
                {variant.individual_matches
                  .filter(m => m.similarity_score > 0)
                  .slice(0, 5)
                  .map((match, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate flex-1">
                        {match.patient_hpo_name}
                      </span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {(match.similarity_score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* View Details Button */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails(variant.variant_idx)
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Full Details
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface GeneSectionProps {
  geneResult: GeneAggregatedResult
  rank: number
  onViewVariantDetails: (variantIdx: number) => void
}

function GeneSection({ geneResult, rank, onViewVariantDetails }: GeneSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Grid layout for consistent alignment */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
          {/* Left: Rank + Gene + Tier + Variants */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-muted-foreground w-8">#{rank}</span>
            <span className="text-lg font-semibold w-16">{geneResult.gene_symbol}</span>
            <Badge variant="outline" className={`text-sm w-10 justify-center ${getTierColor(geneResult.best_tier)}`}>
              {formatTierDisplay(geneResult.best_tier)}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {geneResult.variant_count} variant{geneResult.variant_count !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Center: Matched HPO Terms Preview */}
          <div className="flex flex-wrap gap-1">
            {geneResult.matched_hpo_terms.slice(0, 2).map((term, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs bg-primary/10 text-primary">
                {term}
              </Badge>
            ))}
            {geneResult.matched_hpo_terms.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{geneResult.matched_hpo_terms.length - 2} more
              </Badge>
            )}
          </div>

          {/* Right: Score + HPO + Chevron - Grid aligned */}
          <div className="grid grid-cols-[60px_80px_20px] items-center gap-1">
            {/* Clinical Score - fixed width */}
            <Badge className={`text-sm justify-center ${getScoreColor(geneResult.best_clinical_score)}`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {geneResult.best_clinical_score.toFixed(1)}
            </Badge>
            {/* HPO Match - fixed width */}
            <span className="text-sm text-muted-foreground text-right">
              HPO: {geneResult.best_phenotype_score.toFixed(0)}%
            </span>
            {/* Chevron */}
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {/* All Matched HPO Terms */}
          {geneResult.matched_hpo_terms.length > 0 && (
            <div className="mb-4">
              <p className="text-base font-semibold mb-2">Matched HPO Terms</p>
              <div className="flex flex-wrap gap-2">
                {geneResult.matched_hpo_terms.map((term, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm bg-primary/10 text-primary">
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Variants */}
          <div>
            <p className="text-base font-semibold mb-3">
              Variants ({geneResult.variant_count})
            </p>
            <div className="space-y-3">
              {geneResult.variants.map((variant) => (
                <VariantCard
                  key={variant.variant_idx}
                  variant={variant}
                  onViewDetails={onViewVariantDetails}
                />
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PhenotypeMatchingView({ sessionId }: PhenotypeMatchingViewProps) {
  // Local state
  const [geneFilter, setGeneFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + LOAD_MORE_COUNT)
        }
      },
      { threshold: 0, rootMargin: '200px' }
    )

    if (node) observerRef.current.observe(node)
  }, [])

  // Contexts
  const { phenotype } = usePhenotypeContext()
  const {
    status,
    isLoading,
    aggregatedResults,
    tier1Count,
    tier2Count,
    tier3Count,
    tier4Count,
    variantsAnalyzed,
    totalGenes,
  } = useMatchedPhenotype()

  const selectedTerms = phenotype?.hpo_terms || []

  // Filter and slice results
  const filteredResults = useMemo(() => {
    if (!aggregatedResults) return []
    if (!geneFilter) return aggregatedResults
    const filter = geneFilter.toLowerCase()
    return aggregatedResults.filter(g => g.gene_symbol.toLowerCase().includes(filter))
  }, [aggregatedResults, geneFilter])

  const visibleResults = useMemo(() => {
    return filteredResults.slice(0, visibleCount)
  }, [filteredResults, visibleCount])

  const hasMore = visibleCount < filteredResults.length

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD)
  }, [geneFilter])

  // Check if we have results
  const hasResults = status === 'success' && aggregatedResults && aggregatedResults.length > 0

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
        {status === 'success' && hasResults && (
          <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-300">
            {totalGenes} Genes Analyzed
          </Badge>
        )}
        {(status === 'pending' || status === 'loading') && (
          <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-300">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            {status === 'loading' ? 'Loading...' : 'Matching...'}
          </Badge>
        )}
      </div>

      {/* Tier Summary Cards */}
      {hasResults && (
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="py-1.5 px-3 text-center">
              <p className="text-ml font-bold">{variantsAnalyzed}</p>
              <p className="text-base font-semibold text-muted-foreground">Variants</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-1.5 px-3 text-center">
              <p className="text-ml font-bold text-red-900">{tier1Count}</p>
              <p className="text-base font-semibold text-red-700">Tier 1</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-1.5 px-3 text-center">
              <p className="text-ml font-bold text-orange-900">{tier2Count}</p>
              <p className="text-base font-semibold text-orange-700">Tier 2</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="py-1.5 px-3 text-center">
              <p className="text-ml font-bold text-yellow-900">{tier3Count}</p>
              <p className="text-base font-semibold text-yellow-700">Tier 3</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="py-1.5 px-3 text-center">
              <p className="text-ml font-bold text-gray-700">{tier4Count}</p>
              <p className="text-base font-semibold text-gray-600">Tier 4</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patient Phenotypes - Read Only */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Patient Phenotypes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-base font-medium">Selected Terms ({selectedTerms.length})</p>
            {selectedTerms.length === 0 ? (
              <p className="text-base text-muted-foreground py-4 text-center">
                No phenotypes defined for this case.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedTerms.map((term) => (
                  <Badge
                    key={term.hpo_id}
                    variant="secondary"
                    className="px-3 py-1.5 bg-primary/10 text-primary text-sm"
                  >
                    {term.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Clinical Priority Score = ACMG (35%) + Impact (25%) + Phenotype (25%) + Frequency (15%).
              Results are saved to DuckDB and loaded automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {(status === 'loading' || (isLoading && !aggregatedResults)) && (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-base font-medium">
            {status === 'loading' ? 'Loading results...' : 'Running phenotype matching...'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
        </div>
      )}

      {/* No Phenotypes State */}
      {status === 'no_phenotypes' && (
        <Card>
          <CardContent className="p-6 text-center">
            <Dna className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">No Phenotypes Defined</p>
            <p className="text-sm text-muted-foreground">
              Phenotypes are set during case upload.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty Results */}
      {status === 'success' && (!aggregatedResults || aggregatedResults.length === 0) && (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">No Variants with HPO Annotations</p>
            <p className="text-sm text-muted-foreground">
              Variants need HPO phenotype data for matching.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {hasResults && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Filter by gene..."
              value={geneFilter}
              onChange={(e) => setGeneFilter(e.target.value)}
              className="max-w-xs text-md"
            />
            <span className="text-md text-muted-foreground">
              Showing {visibleResults.length} of {filteredResults.length} genes
            </span>
          </div>

          {/* Scoring explanation */}
          <p className="text-md text-muted-foreground">
            Sorted by Clinical Priority Score. Higher scores indicate stronger clinical relevance.
          </p>

          {/* Gene Cards */}
          {visibleResults.map((geneResult) => (
            <GeneSection
              key={geneResult.gene_symbol}
              geneResult={geneResult}
              rank={geneResult.rank}
              onViewVariantDetails={setSelectedVariantIdx}
            />
          ))}

          {/* Load More Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Loading more genes...</p>
            </div>
          )}

          {/* End of List */}
          {!hasMore && filteredResults.length > INITIAL_LOAD && (
            <p className="text-sm text-muted-foreground text-center py-4">
              All {filteredResults.length} genes loaded
            </p>
          )}
        </div>
      )}

      {/* Idle State */}
      {status === 'idle' && (
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">Ready for Analysis</p>
            <p className="text-sm text-muted-foreground">
              Phenotype matching results will appear here after processing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
