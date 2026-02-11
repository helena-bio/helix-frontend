"use client"

/**
 * ClinicalScreeningView Component
 *
 * Summary-first gene cards with lazy-loaded variants on expand.
 * Visual layout aligned 1:1 with PhenotypeMatchingView.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Filter,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  Sparkles,
  Info,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import type { ScreeningGeneResult, ScreeningVariantResult } from '@/contexts/ScreeningResultsContext'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { VariantDetailPanel } from '@/components/analysis/VariantDetailPanel'
import {
  getTierColor,
  getACMGColor,
  getScoreColor,
  formatACMGDisplay,
  formatTierDisplay,
  ConsequenceBadges,
} from '@/components/shared'

interface ClinicalScreeningViewProps {
  sessionId: string
}

type TierFilter = 'all' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4'

const INITIAL_LOAD = 15
const LOAD_MORE_COUNT = 15

// ============================================================================
// ACTIONABILITY HELPERS
// ============================================================================

const getActionabilityColor = (actionability: string | null | undefined) => {
  if (!actionability) return 'bg-gray-100 text-gray-700 border-gray-300'
  switch (actionability.toLowerCase()) {
    case 'immediate': return 'bg-red-100 text-red-900 border-red-300'
    case 'monitoring': return 'bg-orange-100 text-orange-900 border-orange-300'
    case 'future': return 'bg-yellow-100 text-yellow-900 border-yellow-300'
    default: return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

const formatActionability = (actionability: string | null | undefined): string => {
  if (!actionability) return 'Unknown'
  return actionability.charAt(0).toUpperCase() + actionability.slice(1)
}

// ============================================================================
// VARIANT CARD (inside expanded gene card) - aligned with PhenotypeMatchingView
// ============================================================================

interface VariantCardProps {
  variant: ScreeningVariantResult
  onViewDetails: () => void
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
            <Badge variant="outline" className={`text-sm ${getTierColor(variant.tier)}`}>
              {formatTierDisplay(variant.tier)}
            </Badge>
            <Badge variant="outline" className={`text-sm ${getACMGColor(variant.acmg_class)}`}>
              {formatACMGDisplay(variant.acmg_class)}
            </Badge>
            <Badge variant="outline" className={`text-sm ${getActionabilityColor(variant.clinical_actionability)}`}>
              {formatActionability(variant.clinical_actionability)}
            </Badge>
            <Badge variant="outline" className={`text-sm ${getScoreColor(variant.total_score * 100)}`}>
              {variant.total_score.toFixed(3)}
            </Badge>
          </div>
          <ConsequenceBadges consequence={variant.consequence} className="mt-1" />
          {variant.gnomad_af != null && variant.gnomad_af > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-mono">AF: {variant.gnomad_af.toExponential(2)}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-mono text-muted-foreground">
              {variant.hgvs_protein || variant.hgvs_cdna || 'No annotation'}
            </p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-md">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Constraint</span>
                <span>{variant.constraint_score?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deleteriousness</span>
                <span>{variant.deleteriousness_score?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phenotype</span>
                <span>{variant.phenotype_score?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age Relevance</span>
                <span>{variant.age_relevance_score?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Boosts */}
          {(variant.acmg_boost > 0 || variant.ethnicity_boost > 0 || variant.family_history_boost > 0 || variant.de_novo_boost > 0) && (
            <div>
              <p className="text-base font-semibold mb-2">Applied Boosts</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-md">
                {variant.acmg_boost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ACMG Boost</span>
                    <span>{variant.acmg_boost.toFixed(2)}</span>
                  </div>
                )}
                {variant.ethnicity_boost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ethnicity</span>
                    <span>{variant.ethnicity_boost.toFixed(2)}</span>
                  </div>
                )}
                {variant.family_history_boost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Family History</span>
                    <span>{variant.family_history_boost.toFixed(2)}</span>
                  </div>
                )}
                {variant.de_novo_boost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">De Novo</span>
                    <span>{variant.de_novo_boost.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Justification */}
          {variant.justification && (
            <p className="text-sm text-muted-foreground italic">{variant.justification}</p>
          )}

          {/* View Details Button */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails()
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

// ============================================================================
// GENE SECTION (aligned with PhenotypeMatchingView GeneSection)
// ============================================================================

interface GeneSectionProps {
  gene: ScreeningGeneResult
  rank: number
  sessionId: string
  onViewVariantDetails: (variantId: string) => void
  tierFilter: TierFilter
}

function GeneSection({ gene, rank, sessionId, onViewVariantDetails, tierFilter }: GeneSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoadingVariants, setIsLoadingVariants] = useState(false)
  const { loadScreeningGeneVariants } = useScreeningResults()

  const handleExpand = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    setIsExpanded(true)

    if (!gene.variants || gene.variants.length === 0) {
      setIsLoadingVariants(true)
      try {
        await loadScreeningGeneVariants(sessionId, gene.gene_symbol)
      } catch (err) {
        console.error(`Failed to load variants for ${gene.gene_symbol}:`, err)
      } finally {
        setIsLoadingVariants(false)
      }
    }
  }, [isExpanded, gene.variants, gene.gene_symbol, sessionId, loadScreeningGeneVariants])

  // Filter loaded variants by tier
  const visibleVariants = useMemo(() => {
    if (!gene.variants) return []
    if (tierFilter === 'all') return gene.variants
    return gene.variants.filter(v => v.tier === tierFilter)
  }, [gene.variants, tierFilter])

  return (
    <Card className="gap-0">
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
        onClick={handleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Left: Rank + Gene + Tier + Variants + ACMG */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-muted-foreground w-8">#{rank}</span>
            <span className="text-lg font-semibold w-16">{gene.gene_symbol}</span>
            <Badge variant="outline" className={`text-sm w-10 justify-center ${getTierColor(gene.best_tier)}`}>
              {formatTierDisplay(gene.best_tier)}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {gene.variant_count} variant{gene.variant_count !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className={`text-sm ${getACMGColor(gene.best_acmg_class)}`}>
              {formatACMGDisplay(gene.best_acmg_class)}
            </Badge>
          </div>

          {/* Right: Score + Actionability + Chevron */}
          <div className="flex items-center gap-2">
            <Badge className={`text-sm ${getScoreColor(gene.best_score * 100)}`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {gene.best_score.toFixed(3)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatActionability(gene.best_actionability)}
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
          {!isLoadingVariants && gene.variants && (
            <div>
              <p className="text-base font-semibold mb-3">
                Variants ({visibleVariants.length})
                {tierFilter !== 'all' && (
                  <span className="text-sm text-muted-foreground font-normal ml-2">
                    - Showing only {formatTierDisplay(tierFilter)} variants
                  </span>
                )}
              </p>
              <div className="space-y-3">
                {visibleVariants.map((variant) => (
                  <VariantCard
                    key={variant.variant_id}
                    variant={variant}
                    onViewDetails={() => onViewVariantDetails(variant.variant_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No variants */}
          {!isLoadingVariants && (!gene.variants || gene.variants.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No variant details available
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ============================================================================
// TIER CARD COMPONENT (same as PhenotypeMatchingView)
// ============================================================================

interface TierCardProps {
  count: number
  label: string
  tooltip: string
  isSelected: boolean
  onClick: () => void
  colorClasses: string
}

function TierCard({ count, label, tooltip, isSelected, onClick, colorClasses }: TierCardProps) {
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
        <p className="text-ml font-bold">{count.toLocaleString()}</p>
        <p className="text-base font-semibold">{label}</p>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ClinicalScreeningView({ sessionId }: ClinicalScreeningViewProps) {
  const {
    geneResults,
    tier1Count,
    tier2Count,
    tier3Count,
    tier4Count,
    totalVariantsAnalyzed,
    ageGroup,
    screeningMode,
  } = useScreeningResults()
  const { hpoTerms } = useClinicalProfileContext()
  const [geneFilter, setGeneFilter] = useState('')
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  // Intersection Observer for lazy loading
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

  // Reset visible count on filter change
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD)
  }, [geneFilter, tierFilter])

  const handleTierClick = (filter: TierFilter) => {
    setTierFilter(prev => prev === filter ? 'all' : filter)
  }

  // Apply filters
  const filteredGenes = useMemo(() => {
    if (!geneResults) return []
    let genes = geneResults

    if (tierFilter !== 'all') {
      genes = genes.filter(g => {
        switch (tierFilter) {
          case 'TIER_1': return g.tier_1_count > 0
          case 'TIER_2': return g.tier_2_count > 0
          case 'TIER_3': return g.tier_3_count > 0
          case 'TIER_4': return g.tier_4_count > 0
          default: return true
        }
      })
    }

    if (geneFilter.trim()) {
      const search = geneFilter.toLowerCase()
      genes = genes.filter(g => g.gene_symbol.toLowerCase().includes(search))
    }

    return genes
  }, [geneResults, tierFilter, geneFilter])

  const visibleResults = useMemo(() => {
    return filteredGenes.slice(0, visibleCount)
  }, [filteredGenes, visibleCount])

  const hasMore = visibleCount < filteredGenes.length
  const hasResults = geneResults && geneResults.length > 0

  // View variant detail
  if (selectedVariantId !== null) {
    return (
      <VariantDetailPanel
        sessionId={sessionId}
        variantIdx={parseInt(selectedVariantId)}
        onBack={() => setSelectedVariantId(null)}
      />
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Clinical Screening</h1>
          <p className="text-base text-muted-foreground mt-1">
            Age-aware variant prioritization with clinical actionability tiers.
          </p>
        </div>

        {hasResults && (
          <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-300">
            {totalVariantsAnalyzed.toLocaleString()} Variants Screened
          </Badge>
        )}
      </div>

      {/* Tier Cards */}
      {hasResults && (
        <div className="grid grid-cols-5 gap-4">
          <TierCard
            count={geneResults.length}
            label="All Genes"
            tooltip="Show all genes across all tiers"
            isSelected={tierFilter === 'all'}
            onClick={() => handleTierClick('all')}
            colorClasses=""
          />
          <TierCard
            count={tier1Count}
            label="Tier 1"
            tooltip="Highest priority - immediate clinical action recommended"
            isSelected={tierFilter === 'TIER_1'}
            onClick={() => handleTierClick('TIER_1')}
            colorClasses="border-red-200 bg-red-50 text-red-900"
          />
          <TierCard
            count={tier2Count}
            label="Tier 2"
            tooltip="High priority - monitoring and follow-up recommended"
            isSelected={tierFilter === 'TIER_2'}
            onClick={() => handleTierClick('TIER_2')}
            colorClasses="border-orange-200 bg-orange-50 text-orange-900"
          />
          <TierCard
            count={tier3Count}
            label="Tier 3"
            tooltip="Moderate priority - future clinical relevance possible"
            isSelected={tierFilter === 'TIER_3'}
            onClick={() => handleTierClick('TIER_3')}
            colorClasses="border-yellow-200 bg-yellow-50 text-yellow-900"
          />
          <TierCard
            count={tier4Count}
            label="Tier 4"
            tooltip="Lower priority - research or uncertain significance"
            isSelected={tierFilter === 'TIER_4'}
            onClick={() => handleTierClick('TIER_4')}
            colorClasses="border-gray-200 bg-gray-50 text-gray-700"
          />
        </div>
      )}

      {/* Patient Clinical Context */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Patient Phenotypes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Demographics inline */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Age Group</p>
              <p className="text-base font-semibold">{ageGroup || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Screening Mode</p>
              <p className="text-base font-semibold">{screeningMode?.replace(/_/g, ' ') || 'Unknown'}</p>
            </div>
            {hasResults && (
              <div>
                <p className="text-sm text-muted-foreground">Genes with Variants</p>
                <p className="text-base font-semibold">{geneResults.length.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* HPO Terms */}
          <div className="space-y-2">
            {hpoTerms.length === 0 ? (
              <p className="text-base text-muted-foreground py-4 text-center">
                No phenotypes defined for this case.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hpoTerms.map((term) => (
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
              Screening prioritizes variants based on age-specific disease onset, phenotype relevance,
              ethnicity-specific prevalence, and clinical actionability. Click a gene to see individual variants.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {!geneResults && (
        <div className="text-center py-16">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-base font-medium mb-2">Ready for Analysis</p>
          <p className="text-sm text-muted-foreground">
            Screening results will appear here after processing.
          </p>
        </div>
      )}

      {/* Empty Results */}
      {geneResults && geneResults.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">No Screening Results</p>
            <p className="text-sm text-muted-foreground">
              No variants matched the screening criteria.
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
              Showing {visibleResults.length} of {filteredGenes.length} genes
              {tierFilter !== 'all' && ` (filtered by ${formatTierDisplay(tierFilter)})`}
            </span>
          </div>

          <p className="text-md text-muted-foreground">
            Sorted by tier priority (Tier 1 first), then by best score.
            {tierFilter !== 'all' && ' Click the tier card again to show all.'}
          </p>

          {/* Gene Cards */}
          {visibleResults.map((gene, idx) => (
            <GeneSection
              key={gene.gene_symbol}
              gene={gene}
              rank={idx + 1}
              sessionId={sessionId}
              onViewVariantDetails={(variantId) => setSelectedVariantId(variantId)}
              tierFilter={tierFilter}
            />
          ))}

          {/* No results for filter */}
          {filteredGenes.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium mb-2">No Genes Match Filter</p>
                <p className="text-sm text-muted-foreground">
                  {tierFilter !== 'all'
                    ? `No genes with ${formatTierDisplay(tierFilter)} variants found.`
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
          {!hasMore && filteredGenes.length > INITIAL_LOAD && (
            <p className="text-sm text-muted-foreground text-center py-4">
              All {filteredGenes.length} genes loaded
            </p>
          )}
        </div>
      )}
    </div>
  )
}
