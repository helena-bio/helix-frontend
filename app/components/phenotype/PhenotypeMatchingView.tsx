"use client"

/**
 * PhenotypeMatchingView Component - Summary-First Architecture
 *
 * Card-based layout with lazy gene expansion.
 * Gene summaries load instantly (~50KB), variants on-demand from DuckDB.
 *
 * Features:
 * - Card per gene (not table rows)
 * - Lazy loading with Intersection Observer
 * - On-demand variant loading on gene expand
 * - Clickable tier cards with filtering (uses summary counts)
 * - 5-tier system: T1, T2, IF (Incidental Findings), T3, T4
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
  Filter,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { usePhenotypeResults, type GeneAggregatedResult } from '@/contexts/PhenotypeResultsContext'
import { VariantDetailPanel } from '@/components/analysis/VariantDetailPanel'
import {
  getTierColor,
  getScoreColor,
  formatTierDisplay,
  SharedVariantCard,
  type SharedVariantData,
} from '@/components/shared'
import type { SessionMatchResult } from '@/lib/api/hpo'

interface PhenotypeMatchingViewProps {
  sessionId: string
}

const INITIAL_LOAD = 15
const LOAD_MORE_COUNT = 15

type TierFilter = 'all' | 'T1' | 'T2' | 'IF' | 'T3' | 'T4'

/**
 * Get short tier from best_tier string
 */
const getShortTier = (tier: string): TierFilter => {
  const tierLower = tier.toLowerCase()
  if (tierLower.startsWith('if') || tierLower.includes('incidental')) return 'IF'
  if (/tier\s*1\b/.test(tierLower)) return 'T1'
  if (/tier\s*2\b/.test(tierLower) || tierLower.includes('potentially')) return 'T2'
  if (/tier\s*3\b/.test(tierLower) || tierLower.includes('uncertain')) return 'T3'
  if (/tier\s*4\b/.test(tierLower) || tierLower.includes('unlikely')) return 'T4'
  return 'T4'
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

/** Map SessionMatchResult to SharedVariantData */
function toSharedVariant(v: SessionMatchResult): SharedVariantData {
  return {
    variantIdx: v.variant_idx,
    hgvsProtein: v.hgvs_protein ?? null,
    hgvsCdna: v.hgvs_cdna ?? null,
    consequence: v.consequence ?? null,
    impact: v.impact ?? null,
    acmgClass: v.acmg_class ?? null,
    acmgCriteria: v.acmg_criteria ?? null,
    gnomadAf: v.gnomad_af ?? null,
    genotype: v.genotype ?? null,
    clinvarSignificance: v.clinvar_significance ?? null,
    depth: v.depth ?? null,
    quality: v.quality ?? null,
    alphamissenseScore: v.alphamissense_score ?? null,
    siftScore: v.sift_score ?? null,
    spliceaiMaxScore: v.spliceai_max_score ?? null,
    bayesdelNoafScore: v.bayesdel_noaf_score ?? null,
    bayesdelNoafPred: v.bayesdel_noaf_pred ?? null,
  }
}

interface VariantCardProps {
  variant: SessionMatchResult
  onViewDetails: (variantIdx: number) => void
}

function VariantCard({ variant, onViewDetails }: VariantCardProps) {
  return (
    <SharedVariantCard
      variant={toSharedVariant(variant)}
      onViewDetails={onViewDetails}
      collapsedRight={
        <>
          <Badge variant="outline" className={`text-tiny ${getTierColor(variant.clinical_tier)}`}>
            {formatTierDisplay(variant.clinical_tier)}
          </Badge>
          <Badge className={`text-tiny ${getScoreColor(variant.clinical_priority_score)}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {variant.clinical_priority_score.toFixed(1)}
          </Badge>
        </>
      }
      expandedChildren={
        variant.individual_matches && variant.individual_matches.length > 0 ? (
          <div>
            <p className="text-md text-muted-foreground mb-2">HPO Term Matches</p>
            <div className="space-y-1">
              {variant.individual_matches
                .filter(m => m.similarity_score > 0)
                .slice(0, 5)
                .map((match, idx) => (
                  <div key={idx} className="flex items-center justify-between text-md">
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
        ) : undefined
      }
    />
  )
}

interface GeneSectionProps {
  geneResult: GeneAggregatedResult
  rank: number
  sessionId: string
  onViewVariantDetails: (variantIdx: number) => void
  tierFilter: TierFilter
}

function GeneSection({ geneResult, rank, sessionId, onViewVariantDetails, tierFilter }: GeneSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoadingVariants, setIsLoadingVariants] = useState(false)
  const { loadPhenotypeGeneVariants } = usePhenotypeResults()

  const handleExpand = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    setIsExpanded(true)

    // Load variants on-demand if not already loaded
    if (!geneResult.variants || geneResult.variants.length === 0) {
      setIsLoadingVariants(true)
      try {
        await loadPhenotypeGeneVariants(sessionId, geneResult.gene_symbol)
      } catch (err) {
        console.error(`Failed to load variants for ${geneResult.gene_symbol}:`, err)
      } finally {
        setIsLoadingVariants(false)
      }
    }
  }, [isExpanded, geneResult.variants, geneResult.gene_symbol, sessionId, loadPhenotypeGeneVariants])

  // Filter loaded variants by tier
  const visibleVariants = useMemo(() => {
    if (!geneResult.variants) return []
    if (tierFilter === 'all') return geneResult.variants
    return geneResult.variants.filter(v => getShortTier(v.clinical_tier) === tierFilter)
  }, [geneResult.variants, tierFilter])

  return (
    <Card className="gap-0">
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
        onClick={handleExpand}
      >
          <div className="flex items-center justify-between">
            {/* Left: Rank + Gene + Tier + Score */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground w-8">#{rank}</span>
              <span className="text-base font-medium w-16">{geneResult.gene_symbol}</span>
              <Badge variant="outline" className={`text-sm w-10 justify-center ${getTierColor(geneResult.best_tier)}`}>
                {formatTierDisplay(geneResult.best_tier)}
              </Badge>
              <Badge className={`text-sm ${getScoreColor(geneResult.best_clinical_score)}`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {geneResult.best_clinical_score.toFixed(1)}
              </Badge>
            </div>

            {/* Right: Variant count + Chevron */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {geneResult.variant_count} variant{geneResult.variant_count !== 1 ? 's' : ''}
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {/* Loading state */}
          {isLoadingVariants && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Loading variants...</span>
            </div>
          )}
          {/* Variants */}
          {!isLoadingVariants && geneResult.variants && visibleVariants.map((variant) => (
            <VariantCard
              key={variant.variant_idx}
              variant={variant}
              onViewDetails={onViewVariantDetails}
            />
          ))}
        </CardContent>
      )}
    </Card>
  )
}

// ============================================================================
// TIER CARD COMPONENT
// ============================================================================

interface TierCardProps {
  count: number
  tier: TierFilter
  label: string
  tooltip: string
  isSelected: boolean
  onClick: () => void
  colorClasses: string
}

function TierCard({ count, tier, label, tooltip, isSelected, onClick, colorClasses }: TierCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all py-0 gap-0 ${colorClasses} ${
        isSelected ? 'ring-2 ring-gray-400 ring-offset-2' : 'hover:border-gray-400'
      }`}
      onClick={onClick}
    >
      <CardContent className="py-1.5 px-3 text-center relative group">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="absolute top-1 right-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Info: ${label}`}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-sm max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <p className="text-lg font-semibold">{count.toLocaleString()}</p>
        <p className="text-sm font-medium">{label}</p>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PhenotypeMatchingView({ sessionId }: PhenotypeMatchingViewProps) {
  const [geneFilter, setGeneFilter] = useState('')
  const [isPhenoOpen, setIsPhenoOpen] = useState(false)
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null)
  const [hpoFilter, setHpoFilter] = useState<string | null>(null)
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

  const { hpoTerms, isLoadingProfile, isProfileLoaded } = useClinicalProfileContext()
  const {
    status,
    isLoading,
    aggregatedResults,
    loadAllPhenotypeResults,
    tier1Count,
    tier2Count,
    incidentalFindingsCount,
    tier3Count,
    tier4Count,
    variantsAnalyzed,
    totalGenes,
  } = usePhenotypeResults()

  const selectedTerms = hpoTerms

  // Auto-load existing results when opening a saved case
  useEffect(() => {
    if (status === 'idle') {
      loadAllPhenotypeResults(sessionId).catch(() => {})
    }
  }, [sessionId])

  const handleTierClick = (tier: TierFilter) => {
    setTierFilter(prev => prev === tier ? 'all' : tier)
    setHpoFilter(null)
    setVisibleCount(INITIAL_LOAD)
  }

  // Filter by gene name and tier (using summary counts, no variant iteration)
  const filteredResults = useMemo(() => {
    if (!aggregatedResults) return []

    let filtered = aggregatedResults

    // Filter by tier using summary counts (no variant iteration needed)
    if (tierFilter !== 'all') {
      filtered = filtered.filter(g => {
        switch (tierFilter) {
          case 'T1': return g.tier_1_count > 0
          case 'T2': return g.tier_2_count > 0
          case 'IF': return g.incidental_count > 0
          case 'T3': return g.tier_3_count > 0
          case 'T4': return g.tier_4_count > 0
          default: return true
        }
      })
    }

    if (hpoFilter) {
      filtered = filtered.filter(g => g.matched_hpo_ids?.includes(hpoFilter))
    }

    if (geneFilter) {
      const filter = geneFilter.toLowerCase()
      filtered = filtered.filter(g => g.gene_symbol.toLowerCase().includes(filter))
    }

    return filtered
  }, [aggregatedResults, geneFilter, tierFilter, hpoFilter])

  const visibleResults = useMemo(() => {
    return filteredResults.slice(0, visibleCount)
  }, [filteredResults, visibleCount])

  const hasMore = visibleCount < filteredResults.length

  useEffect(() => {
    setVisibleCount(INITIAL_LOAD)
  }, [geneFilter, tierFilter])

  const hasResults = status === 'success' && aggregatedResults && aggregatedResults.length > 0


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
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Dna className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Clinical Phenotype Matching</h1>
        </div>

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
        <div className="grid grid-cols-6 gap-4">
          <TierCard
            count={variantsAnalyzed}
            tier="all"
            label="Variants"
            tooltip="Show all variants"
            isSelected={tierFilter === 'all'}
            onClick={() => handleTierClick('all')}
            colorClasses=""
          />
          <TierCard
            count={tier1Count}
            tier="T1"
            label="Tier 1"
            tooltip="Tier 1 - Actionable: P/LP variants WITH phenotype match - confirmed relevant to this patient"
            isSelected={tierFilter === 'T1'}
            onClick={() => handleTierClick('T1')}
            colorClasses="border-red-200 bg-red-50 text-red-900"
          />
          <TierCard
            count={tier2Count}
            tier="T2"
            label="Tier 2"
            tooltip="Tier 2 - Potentially Actionable: VUS with strong evidence (high impact, phenotype match, rare)"
            isSelected={tierFilter === 'T2'}
            onClick={() => handleTierClick('T2')}
            colorClasses="border-orange-200 bg-orange-50 text-orange-900"
          />
          <TierCard
            count={incidentalFindingsCount}
            tier="IF"
            label="IF"
            tooltip="Incidental Findings: P/LP variants WITHOUT phenotype match - pathogenic for other conditions (ACMG secondary findings)"
            isSelected={tierFilter === 'IF'}
            onClick={() => handleTierClick('IF')}
            colorClasses="border-purple-200 bg-purple-50 text-purple-900"
          />
          <TierCard
            count={tier3Count}
            tier="T3"
            label="Tier 3"
            tooltip="Tier 3 - Uncertain Significance: Limited evidence, requires further investigation"
            isSelected={tierFilter === 'T3'}
            onClick={() => handleTierClick('T3')}
            colorClasses="border-yellow-200 bg-yellow-50 text-yellow-900"
          />
          <TierCard
            count={tier4Count}
            tier="T4"
            label="Tier 4"
            tooltip="Tier 4 - Unlikely Pathogenic: Benign or likely benign variants"
            isSelected={tierFilter === 'T4'}
            onClick={() => handleTierClick('T4')}
            colorClasses="border-gray-200 bg-gray-50 text-gray-700"
          />
        </div>
      )}

      {/* Patient Phenotypes - Collapsible */}
          <Card className="gap-0">
            <CardHeader
              className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
              onClick={() => setIsPhenoOpen(!isPhenoOpen)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-base font-medium">Patient Phenotypes</span>
                  <Badge variant="secondary" className="text-sm">
                    {selectedTerms.length} term{selectedTerms.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                {isPhenoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
            {isPhenoOpen && (
              <CardContent>
                {isLoadingProfile || (!isProfileLoaded && selectedTerms.length === 0) ? (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading phenotypes...</span>
                  </div>
                ) : selectedTerms.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No phenotypes defined for this case.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedTerms.map((term) => (
                      <Badge
                        key={term.hpo_id}
                        variant="secondary"
                        className={`px-3 py-1.5 text-primary text-sm cursor-pointer transition-colors ${hpoFilter === term.hpo_id ? 'bg-primary/25 ring-2 ring-primary/40 ring-offset-1' : 'bg-primary/10 hover:bg-primary/20'}`}
                        onClick={() => setHpoFilter(prev => prev === term.hpo_id ? null : term.hpo_id)}
                      >
                        {term.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
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
        <div className="space-y-2">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Filter by gene..."
              value={geneFilter}
              onChange={(e) => setGeneFilter(e.target.value)}
              className="max-w-xs text-md"
            />
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground cursor-default inline-flex items-center gap-1">
                      Showing {visibleResults.length} of {filteredResults.length} genes
                      {tierFilter !== 'all' && ` (filtered by ${tierFilter})`}
                      <Info className="h-3.5 w-3.5 opacity-50" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="text-sm max-w-xs">
                    <p>Sorted by Clinical Priority Score. Higher scores indicate stronger clinical relevance.
                    {tierFilter !== 'all' && ' Showing only variants matching selected tier.'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

          {/* Gene Cards */}
          {visibleResults.map((geneResult, idx) => (
            <GeneSection
              key={geneResult.gene_symbol}
              geneResult={geneResult}
              rank={idx + 1}
              sessionId={sessionId}
              onViewVariantDetails={setSelectedVariantIdx}
              tierFilter={tierFilter}
            />
          ))}

          {/* No results for filter */}
          {filteredResults.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium mb-2">No Genes Match Filter</p>
                <p className="text-sm text-muted-foreground">
                  {tierFilter !== 'all'
                    ? `No genes with ${tierFilter} variants found.`
                    : 'Try a different gene name filter.'}
                </p>
              </CardContent>
            </Card>
          )}

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

      {/* Idle/Not Found State */}
      {(status === 'idle' || status === 'not_found') && (
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
