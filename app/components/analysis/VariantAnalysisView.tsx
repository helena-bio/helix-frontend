"use client"

/**
 * VariantAnalysisView Component - CLINICAL GRADE
 *
 * Card-based layout with LOCAL filtering (from context).
 * Data is pre-loaded in VariantsResultsContext via streaming in ClinicalAnalysis.
 *
 * Summary-first architecture:
 * - Gene cards render instantly from summaries (~50-100KB)
 * - Variants loaded on-demand when user expands a gene (<50ms)
 * - Impact counts from pre-computed cross-matrix (no variant iteration)
 *
 * Features:
 * - Card per gene (not table rows)
 * - Lazy loading for VISUALIZATION only (not data fetching)
 * - Instant local filtering by gene name
 * - Consistent with PhenotypeMatchingView architecture
 * - Clickable ACMG cards with local filtering
 * - Clickable Impact cards with local filtering
 * - Sorted by ACMG classification priority (backend)
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Microscope,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
  Info,
  ArrowRightLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useVariantsResults } from '@/contexts/VariantsResultsContext'
import { VariantDetailPanel } from './VariantDetailPanel'
import {
  getACMGColor,
  getImpactColor,
  formatImpactDisplay,
  formatACMGDisplay,
  SharedVariantCard,
  type SharedVariantData,
} from '@/components/shared'
import type { GeneAggregated, VariantInGene } from '@/types/variant.types'
import { formatCount } from '@helix/shared/lib/utils'

interface VariantAnalysisViewProps {
  sessionId: string
}

// Impact sort priority (lower = more severe)
const IMPACT_PRIORITY: Record<string, number> = { HIGH: 0, MODERATE: 1, LOW: 2, MODIFIER: 3 }

// Lazy loading config (for visualization, not data fetching)
const INITIAL_LOAD = 15
const LOAD_MORE_COUNT = 15

// ACMG filter type
type ACMGFilter = 'all' | 'P' | 'LP' | 'VUS' | 'LB' | 'B'

// Impact filter type
type ImpactFilter = 'all' | 'HIGH' | 'MODERATE' | 'LOW' | 'MODIFIER'

// Zero impact counts constant
const ZERO_IMPACT = { HIGH: 0, MODERATE: 0, LOW: 0, MODIFIER: 0 }

// Check if gene matches filters using SUMMARY COUNTS (no variant iteration)
const geneMatchesFilters = (
  gene: GeneAggregated,
  acmgFilter: ACMGFilter,
  impactFilter: ImpactFilter
): boolean => {
  // ACMG filter check using summary counts
  if (acmgFilter !== 'all') {
    let hasAcmg = false
    if (acmgFilter === 'P') hasAcmg = gene.pathogenic_count > 0
    else if (acmgFilter === 'LP') hasAcmg = gene.likely_pathogenic_count > 0
    else if (acmgFilter === 'VUS') hasAcmg = gene.vus_count > 0
    else if (acmgFilter === 'LB') hasAcmg = gene.likely_benign_count > 0
    else if (acmgFilter === 'B') hasAcmg = gene.benign_count > 0
    if (!hasAcmg) return false
  }

  // Impact filter check using summary counts
  if (impactFilter !== 'all') {
    let hasImpact = false
    if (impactFilter === 'HIGH') hasImpact = gene.high_impact_count > 0
    else if (impactFilter === 'MODERATE') hasImpact = gene.moderate_impact_count > 0
    else if (impactFilter === 'LOW') hasImpact = gene.low_impact_count > 0
    else if (impactFilter === 'MODIFIER') hasImpact = gene.modifier_impact_count > 0
    if (!hasImpact) return false
  }

  return true
}

// Check if variant matches ACMG filter (used for visible variants in expanded gene)
const variantMatchesACMG = (variant: VariantInGene, filter: ACMGFilter): boolean => {
  if (filter === 'all') return true
  return variant.acmg_class === filter
}

// Check if variant matches Impact filter (used for visible variants in expanded gene)
const variantMatchesImpact = (variant: VariantInGene, filter: ImpactFilter): boolean => {
  if (filter === 'all') return true
  return variant.impact === filter
}

// ============================================================================
// EXPANDED CARD HELPERS
// ============================================================================

/** Map VariantInGene to SharedVariantData */
function toSharedVariant(v: VariantInGene): SharedVariantData {
  return {
    variantIdx: v.variant_idx,
    hgvsProtein: v.hgvs_protein,
    hgvsCdna: v.hgvs_cdna,
    consequence: v.consequence,
    impact: v.impact,
    acmgClass: v.acmg_class,
    acmgCriteria: v.acmg_criteria,
    gnomadAf: v.gnomad_af,
    genotype: v.genotype,
    clinvarSignificance: v.clinvar_significance,
    depth: v.depth,
    quality: v.quality,
    alphamissenseScore: v.alphamissense_score,
    siftScore: v.sift_score,
    spliceaiMaxScore: v.spliceai_max_score ?? null,
    bayesdelNoafScore: v.bayesdel_noaf_score ?? null,
    bayesdelNoafPred: v.bayesdel_noaf_pred ?? null,
  }
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface VariantCardProps {
  variant: VariantInGene
  onViewDetails: (variantIdx: number) => void
}

function VariantCard({ variant, onViewDetails }: VariantCardProps) {
  return (
    <SharedVariantCard
      variant={toSharedVariant(variant)}
      onViewDetails={onViewDetails}
      collapsedRight={
        variant.acmg_class_original ? (
          <Badge variant="outline" className="text-tiny bg-violet-100 text-violet-900 border-violet-300">
            <ArrowRightLeft className="h-3 w-3 mr-1" />
            Reclassified
          </Badge>
        ) : undefined
      }
    />
  )
}

interface GeneSectionProps {
  gene: GeneAggregated
  rank: number
  sessionId: string
  onViewVariantDetails: (variantIdx: number) => void
  onLoadVariants: (geneSymbol: string) => Promise<void>
  acmgFilter: ACMGFilter
  impactFilter: ImpactFilter
}

function GeneSection({ gene, rank, sessionId, onViewVariantDetails, onLoadVariants, acmgFilter, impactFilter }: GeneSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoadingVariants, setIsLoadingVariants] = useState(false)

  const hasVariants = gene.variants && gene.variants.length > 0

  const handleExpand = async () => {
    const willExpand = !isExpanded
    setIsExpanded(willExpand)

    // Lazy load variants on first expand
    if (willExpand && !hasVariants) {
      setIsLoadingVariants(true)
      await onLoadVariants(gene.gene_symbol)
      setIsLoadingVariants(false)
    }
  }

  // Filter loaded variants based on active filters
  const visibleVariants = useMemo(() => {
    if (!gene.variants) return []
    return gene.variants.filter(v =>
      variantMatchesACMG(v, acmgFilter) && variantMatchesImpact(v, impactFilter)
    )
  }, [gene.variants, acmgFilter, impactFilter])

  return (
    <Card className="gap-0">
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
        onClick={handleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Left: Rank + Gene + ACMG + Impact */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground w-8">#{rank}</span>
            <span className="text-base font-medium w-20">{gene.gene_symbol}</span>
            {gene.best_acmg_class && (
              <Badge variant="outline" className={`text-sm w-12 justify-center ${getACMGColor(gene.best_acmg_class)}`}>
                {formatACMGDisplay(gene.best_acmg_class)}
              </Badge>
            )}
            {gene.best_impact && (
              <Badge variant="outline" className={`text-sm ${getImpactColor(gene.best_impact)}`}>
                {formatImpactDisplay(gene.best_impact)}
              </Badge>
            )}
          </div>

          {/* Right: Variant count + Chevron */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {gene.variant_count} variant{gene.variant_count !== 1 ? 's' : ''}
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {isLoadingVariants ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Loading variants...</span>
            </div>
          ) : visibleVariants.length > 0 ? (
            visibleVariants.map((variant) => (
              <VariantCard
                key={variant.variant_idx}
                variant={variant}
                onViewDetails={onViewVariantDetails}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No variants match the active filters
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ============================================================================
// FILTER CARD COMPONENT
// ============================================================================

interface FilterCardProps {
  count: number
  label: string
  tooltip: string
  isSelected: boolean
  onClick: () => void
  colorClasses: string
}

function FilterCard({ count, label, tooltip, isSelected, onClick, colorClasses }: FilterCardProps) {
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
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-current/50 hover:text-current transition-all"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Info: ${label}`}
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-sm max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <p className="text-lg font-semibold">{formatCount(count)}</p>
        <p className="text-sm font-medium">{label}</p>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VariantAnalysisView({ sessionId }: VariantAnalysisViewProps) {
  // Get data from context (pre-loaded in ProcessingFlow Export phase)
  const {
    allGenes,
    totalVariants,
    impactByAcmg,
    isLoading,
    pathogenicCount,
    likelyPathogenicCount,
    vusCount,
    loadGeneVariants,
  } = useVariantsResults()

  // Local state for filters
  const [geneFilter, setGeneFilter] = useState('')
  const [acmgFilter, setAcmgFilter] = useState<ACMGFilter>('all')
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('all')
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD)

  // Read variant from URL param (deep link from dashboard findings)
  const searchParams = useSearchParams()
  const variantParamConsumed = useRef(false)
  useEffect(() => {
    if (variantParamConsumed.current) return
    const variantParam = searchParams.get('variant')
    if (variantParam !== null) {
      const idx = parseInt(variantParam, 10)
      if (!isNaN(idx)) {
        setSelectedVariantIdx(idx)
        variantParamConsumed.current = true
        // Clean variant from URL to prevent re-triggering on back navigation
        const url = new URL(window.location.href)
        url.searchParams.delete('variant')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [searchParams])

  // Intersection Observer for lazy loading VISUALIZATION (not data)
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

  // LOCAL FILTERING using summary counts (instant, no variant iteration)
  const filteredGenes = useMemo(() => {
    let filtered = allGenes

    // Filter genes by summary counts
    filtered = filtered.filter(g => geneMatchesFilters(g, acmgFilter, impactFilter))

    // Filter by gene name
    if (geneFilter.trim()) {
      const search = geneFilter.toLowerCase()
      filtered = filtered.filter(g => g.gene_symbol.toLowerCase().includes(search))
    }

    // Sort: ACMG priority -> impact severity -> variant count
    filtered.sort((a, b) => {
      const acmgDiff = (a.best_acmg_priority ?? 99) - (b.best_acmg_priority ?? 99)
      if (acmgDiff !== 0) return acmgDiff
      const impactDiff = (IMPACT_PRIORITY[a.best_impact ?? ''] ?? 9) - (IMPACT_PRIORITY[b.best_impact ?? ''] ?? 9)
      if (impactDiff !== 0) return impactDiff
      return (b.variant_count ?? 0) - (a.variant_count ?? 0)
    })

    return filtered
  }, [allGenes, acmgFilter, impactFilter, geneFilter])

  // Visible genes (lazy loading for visualization)
  const visibleGenes = useMemo(() => {
    return filteredGenes.slice(0, visibleCount)
  }, [filteredGenes, visibleCount])

  const hasMore = visibleCount < filteredGenes.length

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD)
  }, [geneFilter, acmgFilter, impactFilter])

  // Calculate ACMG counts from ALL genes (always total counts)
  const acmgCounts = useMemo(() => {
    const likely_benign = allGenes.reduce((sum, g) => sum + g.likely_benign_count, 0)
    const benign = allGenes.reduce((sum, g) => sum + g.benign_count, 0)

    return {
      total: totalVariants,
      pathogenic: pathogenicCount,
      likely_pathogenic: likelyPathogenicCount,
      vus: vusCount,
      likely_benign,
      benign,
    }
  }, [allGenes, totalVariants, pathogenicCount, likelyPathogenicCount, vusCount])

  // Impact counts from pre-computed cross-matrix (no variant iteration)
  // FIX: When filtering by specific ACMG class, do NOT fallback to 'all'.
  // Missing key means 0 variants for that classification.
  const impactCounts = useMemo(() => {
    if (acmgFilter === 'all') {
      const matrix = impactByAcmg['all'] || ZERO_IMPACT
      return {
        high: matrix.HIGH || 0,
        moderate: matrix.MODERATE || 0,
        low: matrix.LOW || 0,
        modifier: matrix.MODIFIER || 0,
      }
    }

    const matrix = impactByAcmg[acmgFilter] || ZERO_IMPACT

    return {
      high: matrix.HIGH || 0,
      moderate: matrix.MODERATE || 0,
      low: matrix.LOW || 0,
      modifier: matrix.MODIFIER || 0,
    }
  }, [impactByAcmg, acmgFilter])

  // Handle filter clicks
  const handleAcmgClick = (filter: ACMGFilter) => {
    setAcmgFilter(prev => prev === filter ? 'all' : filter)
    setImpactFilter('all') // Reset impact when ACMG changes
  }

  const handleImpactClick = (filter: ImpactFilter) => {
    setImpactFilter(prev => prev === filter ? 'all' : filter)
  }

  // Load gene variants handler
  const handleLoadGeneVariants = useCallback(async (geneSymbol: string) => {
    await loadGeneVariants(sessionId, geneSymbol)
  }, [sessionId, loadGeneVariants])

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

  const hasResults = !isLoading && allGenes.length > 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Microscope className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Variant Analysis</h1>
        </div>

        {/* Status Badge */}
        {hasResults && (
          <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-300">
            {acmgCounts.total.toLocaleString()} Variants Analyzed
          </Badge>
        )}
        {isLoading && (
          <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-300">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Loading...
          </Badge>
        )}
      </div>

      {/* ACMG Classification Cards */}
      {hasResults && (
        <div className="grid grid-cols-6 gap-3">
          <FilterCard
            count={acmgCounts.total}
            label="Total"
            tooltip="Show all variants"
            isSelected={acmgFilter === 'all'}
            onClick={() => handleAcmgClick('all')}
            colorClasses=""
          />
          <FilterCard
            count={acmgCounts.pathogenic}
            label="P"
            tooltip="Pathogenic variants - strong evidence of disease association"
            isSelected={acmgFilter === 'P'}
            onClick={() => handleAcmgClick('P')}
            colorClasses="border-red-200 bg-red-50 text-red-900"
          />
          <FilterCard
            count={acmgCounts.likely_pathogenic}
            label="LP"
            tooltip="Likely Pathogenic variants - probable disease association"
            isSelected={acmgFilter === 'LP'}
            onClick={() => handleAcmgClick('LP')}
            colorClasses="border-orange-200 bg-orange-50 text-orange-900"
          />
          <FilterCard
            count={acmgCounts.vus}
            label="VUS"
            tooltip="Variants of Uncertain Significance - requires further investigation"
            isSelected={acmgFilter === 'VUS'}
            onClick={() => handleAcmgClick('VUS')}
            colorClasses="border-yellow-200 bg-yellow-50 text-yellow-900"
          />
          <FilterCard
            count={acmgCounts.likely_benign}
            label="LB"
            tooltip="Likely Benign variants - probably not disease-causing"
            isSelected={acmgFilter === 'LB'}
            onClick={() => handleAcmgClick('LB')}
            colorClasses="border-blue-200 bg-blue-50 text-blue-900"
          />
          <FilterCard
            count={acmgCounts.benign}
            label="B"
            tooltip="Benign variants - not disease-causing"
            isSelected={acmgFilter === 'B'}
            onClick={() => handleAcmgClick('B')}
            colorClasses="border-green-200 bg-green-50 text-green-900"
          />
        </div>
      )}

      {/* Impact Filter Pills */}
      {hasResults && (
        <div className="flex items-center gap-2">
          {[
            { key: "HIGH" as ImpactFilter, label: "High", count: impactCounts.high, color: "border-red-200 bg-red-50 text-red-900" },
            { key: "MODERATE" as ImpactFilter, label: "Moderate", count: impactCounts.moderate, color: "border-orange-200 bg-orange-50 text-orange-900" },
            { key: "LOW" as ImpactFilter, label: "Low", count: impactCounts.low, color: "border-yellow-200 bg-yellow-50 text-yellow-900" },
            { key: "MODIFIER" as ImpactFilter, label: "Modifier", count: impactCounts.modifier, color: "border-blue-200 bg-blue-50 text-blue-900" },
          ].map(({ key, label, count, color }) => (
            <button
              key={key}
              onClick={() => handleImpactClick(key)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-md font-medium transition-all cursor-pointer ${color} ${
                impactFilter === key ? "ring-2 ring-gray-400 ring-offset-1" : "hover:ring-1 hover:ring-gray-300"
              }`}
              title={`${count.toLocaleString()} ${label} impact variants`}
            >
              {label}<span className="opacity-70">·</span>{formatCount(count)}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-base font-medium">Loading variants...</p>
          <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && hasResults && (
        <div className="space-y-2">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Filter by gene..."
              value={geneFilter}
              onChange={(e) => setGeneFilter(e.target.value)}
              className="max-w-xs text-base"
            />
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm text-muted-foreground cursor-default inline-flex items-center gap-1">
                    Showing {visibleGenes.length} of {filteredGenes.length} genes
                    {(acmgFilter !== 'all' || impactFilter !== 'all' || geneFilter) && ` (filtered)`}
                    <Info className="h-3.5 w-3.5 opacity-50" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-sm max-w-xs">
                  <p>Sorted by ACMG classification priority (Pathogenic first), then by Tier, then by variant count.
                  {(acmgFilter !== 'all' || impactFilter !== 'all') && ' Click the filter card again to show all.'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Gene Cards */}
          {visibleGenes.map((gene, idx) => (
            <GeneSection
              key={gene.gene_symbol}
              gene={gene}
              rank={idx + 1}
              sessionId={sessionId}
              onViewVariantDetails={setSelectedVariantIdx}
              onLoadVariants={handleLoadGeneVariants}
              acmgFilter={acmgFilter}
              impactFilter={impactFilter}
            />
          ))}

          {/* No results for filter */}
          {filteredGenes.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium mb-2">No Genes Match Filter</p>
                <p className="text-sm text-muted-foreground">
                  {acmgFilter !== 'all' || impactFilter !== 'all' || geneFilter
                    ? 'No genes match the selected filters.'
                    : 'No variants available for analysis.'}
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

      {/* Empty State - no data at all */}
      {!isLoading && !hasResults && (
        <Card>
          <CardContent className="p-6 text-center">
            <Microscope className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">No Variants Found</p>
            <p className="text-sm text-muted-foreground">
              No variants available for analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
