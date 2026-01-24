"use client"

/**
 * VariantAnalysisView Component - CLINICAL GRADE
 *
 * Card-based layout using backend /by-gene endpoint with infinite scroll.
 * Uses useInfiniteQuery + Intersection Observer for smooth lazy loading.
 *
 * Features:
 * - Card per gene (not table rows)
 * - Infinite scroll with server-side pagination
 * - Consistent typography with PhenotypeMatchingView
 * - Clickable ACMG cards with filtering
 * - Clickable Impact cards with filtering (counts update based on ACMG filter only)
 * - Filter by gene name
 * - Sorted by ACMG classification priority (backend)
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import {
  Microscope,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useInfiniteVariantsByGene, useVariantStatistics } from '@/hooks/queries'
import { VariantDetailPanel } from './VariantDetailPanel'
import {
  getACMGColor,
  getImpactColor,
  getTierColor,
  getZygosityBadge,
  formatACMGDisplay,
  ConsequenceBadges,
} from '@/components/shared'
import type { GeneAggregated, VariantInGene, GeneAggregatedFilters } from '@/types/variant.types'

interface VariantAnalysisViewProps {
  sessionId: string
}

// Page size for backend requests
const PAGE_SIZE = 50

// ACMG filter type
type ACMGFilter = 'all' | 'Pathogenic' | 'Likely Pathogenic' | 'VUS' | 'Likely Benign' | 'Benign'

// Impact filter type
type ImpactFilter = 'all' | 'HIGH' | 'MODERATE' | 'LOW' | 'MODIFIER'

// Convert filter to backend ACMG class format
const acmgFilterToBackend = (filter: ACMGFilter): string | undefined => {
  if (filter === 'all') return undefined
  if (filter === 'VUS') return 'Uncertain Significance'
  return filter
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface VariantCardProps {
  variant: VariantInGene
  onViewDetails: (variantIdx: number) => void
}

function VariantCard({ variant, onViewDetails }: VariantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const zygosity = getZygosityBadge(variant.genotype)

  return (
    <div
      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {variant.acmg_class && (
              <Badge variant="outline" className={`text-sm ${getACMGColor(variant.acmg_class)}`}>
                {formatACMGDisplay(variant.acmg_class)}
              </Badge>
            )}
            {variant.impact && (
              <Badge variant="outline" className={`text-sm ${getImpactColor(variant.impact)}`}>
                {variant.impact}
              </Badge>
            )}
            <Badge variant="outline" className={`text-sm ${zygosity.color}`}>
              {zygosity.label}
            </Badge>
            {variant.priority_tier && (
              <Badge variant="outline" className={`text-sm ${getTierColor(variant.priority_tier)}`}>
                T{variant.priority_tier}
              </Badge>
            )}
          </div>
          <p className="text-base font-mono text-muted-foreground">
            {variant.chromosome}:{variant.position?.toLocaleString()}
            <span className="ml-2">{variant.reference_allele}/{variant.alternate_allele}</span>
          </p>
          <ConsequenceBadges consequence={variant.consequence} className="mt-1" />
        </div>
        <div className="flex items-center gap-3">
          {variant.gnomad_af !== null && variant.gnomad_af !== undefined && (
            <div className="text-right">
              <p className="text-sm font-mono">{variant.gnomad_af.toExponential(2)}</p>
              <p className="text-xs text-muted-foreground">gnomAD AF</p>
            </div>
          )}
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
          {/* Variant Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-md text-muted-foreground">HGVS Protein</p>
              <p className="text-md font-mono">{variant.hgvs_protein || '-'}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">HGVS cDNA</p>
              <p className="text-md font-mono">{variant.hgvs_cdna || '-'}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Depth</p>
              <p className="text-md">{variant.depth || '-'}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Quality</p>
              <p className="text-md">{variant.quality?.toFixed(1) || '-'}</p>
            </div>
          </div>

          {/* ACMG Criteria */}
          {variant.acmg_criteria && (
            <div>
              <p className="text-md text-muted-foreground mb-2">ACMG Criteria</p>
              <div className="flex flex-wrap gap-1">
                {variant.acmg_criteria.split(',').filter(Boolean).map((c: string) => (
                  <Badge key={c} variant="outline" className="text-sm font-mono">
                    {c.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ClinVar */}
          {variant.clinvar_significance && (
            <div>
              <p className="text-md text-muted-foreground mb-1">ClinVar</p>
              <p className="text-base">{variant.clinvar_significance}</p>
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
  gene: GeneAggregated
  rank: number
  onViewVariantDetails: (variantIdx: number) => void
}

function GeneSection({ gene, rank, onViewVariantDetails }: GeneSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          {/* Left: Rank + Gene + ACMG + Tier + Variants */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-muted-foreground w-8">#{rank}</span>
            <span className="text-lg font-semibold w-20">{gene.gene_symbol}</span>
            {gene.best_acmg_class && (
              <Badge variant="outline" className={`text-sm w-12 justify-center ${getACMGColor(gene.best_acmg_class)}`}>
                {formatACMGDisplay(gene.best_acmg_class)}
              </Badge>
            )}
            {gene.best_tier && (
              <Badge variant="outline" className={`text-sm w-10 justify-center ${getTierColor(gene.best_tier)}`}>
                T{gene.best_tier}
              </Badge>
            )}
            <Badge variant="secondary" className="text-sm">
              {gene.variant_count} variant{gene.variant_count !== 1 ? 's' : ''}
            </Badge>
            {gene.best_impact && (
              <Badge variant="outline" className={`text-sm ${getImpactColor(gene.best_impact)}`}>
                {gene.best_impact}
              </Badge>
            )}
          </div>

          {/* Right: ACMG breakdown + Chevron */}
          <div className="flex items-center gap-2">
            {gene.pathogenic_count > 0 && (
              <Badge variant="outline" className="text-xs bg-red-100 text-red-900 border-red-300">
                {gene.pathogenic_count} P
              </Badge>
            )}
            {gene.likely_pathogenic_count > 0 && (
              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-900 border-orange-300">
                {gene.likely_pathogenic_count} LP
              </Badge>
            )}
            {gene.vus_count > 0 && (
              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-900 border-yellow-300">
                {gene.vus_count} VUS
              </Badge>
            )}
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {gene.variants.map((variant) => (
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={`cursor-pointer transition-all ${colorClasses} ${
              isSelected ? 'ring-2 ring-gray-400 ring-offset-2' : 'hover:scale-105'
            }`}
            onClick={onClick}
          >
            <CardContent className="py-1.5 px-3 text-center">
              <p className="text-xl font-bold">{count.toLocaleString()}</p>
              <p className="text-sm font-medium">{label}</p>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent className="text-sm max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VariantAnalysisView({ sessionId }: VariantAnalysisViewProps) {
  // Local state for filters
  const [geneFilter, setGeneFilter] = useState('')
  const [acmgFilter, setAcmgFilter] = useState<ACMGFilter>('all')
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('all')
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null)
  
  // Cached impact counts - updated only when ACMG filter changes
  const [cachedImpactCounts, setCachedImpactCounts] = useState<{
    high: number
    moderate: number
    low: number
    modifier: number
  } | null>(null)

  // Build filters for backend (without page - handled by infinite query)
  const backendFilters = useMemo(() => {
    const filters: Omit<GeneAggregatedFilters, 'page'> = {
      page_size: PAGE_SIZE,
    }

    // ACMG filter
    const acmgBackend = acmgFilterToBackend(acmgFilter)
    if (acmgBackend) {
      filters.acmg_class = [acmgBackend]
    }

    // Impact filter
    if (impactFilter !== 'all') {
      filters.impact = [impactFilter]
    }

    // Gene name filter
    if (geneFilter.trim()) {
      filters.gene_symbol = geneFilter.trim()
    }

    return filters
  }, [acmgFilter, impactFilter, geneFilter])

  // Separate query for ACMG-only filter (to calculate impact counts)
  const acmgOnlyFilters = useMemo(() => {
    const filters: Omit<GeneAggregatedFilters, 'page'> = {
      page_size: PAGE_SIZE,
    }

    const acmgBackend = acmgFilterToBackend(acmgFilter)
    if (acmgBackend) {
      filters.acmg_class = [acmgBackend]
    }

    return filters
  }, [acmgFilter])

  // Data fetching with infinite query
  const { data: stats, isLoading: statsLoading } = useVariantStatistics(sessionId)
  
  // Main query with all filters
  const {
    data: genesData,
    isLoading: genesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteVariantsByGene(sessionId, backendFilters)

  // Query for ACMG-only data (to calculate impact counts) - only when impact filter is active
  const {
    data: acmgOnlyData,
    isLoading: acmgOnlyLoading,
  } = useInfiniteVariantsByGene(
    sessionId,
    acmgOnlyFilters,
    { enabled: impactFilter !== 'all' && acmgFilter !== 'all' }
  )

  const isLoading = statsLoading || genesLoading

  // Intersection Observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        },
        { threshold: 0, rootMargin: '200px' }
      )

      if (node) observerRef.current.observe(node)
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  // Flatten pages into single array
  const allGenes = useMemo(() => {
    if (!genesData?.pages) return []
    return genesData.pages.flatMap((page) => page.genes)
  }, [genesData?.pages])

  // Flatten ACMG-only data for impact counting
  const acmgOnlyGenes = useMemo(() => {
    if (!acmgOnlyData?.pages) return []
    return acmgOnlyData.pages.flatMap((page) => page.genes)
  }, [acmgOnlyData?.pages])

  // Get total count from first page
  const totalGenes = genesData?.pages?.[0]?.total_genes ?? 0

  // Calculate ACMG counts from stats (always show total counts)
  const acmgCounts = useMemo(() => {
    if (!stats) return { total: 0, pathogenic: 0, likely_pathogenic: 0, vus: 0, likely_benign: 0, benign: 0 }
    return {
      total: stats.total_variants,
      pathogenic: stats.classification_breakdown['Pathogenic'] || 0,
      likely_pathogenic: stats.classification_breakdown['Likely Pathogenic'] || 0,
      vus: stats.classification_breakdown['Uncertain Significance'] || 0,
      likely_benign: stats.classification_breakdown['Likely Benign'] || 0,
      benign: stats.classification_breakdown['Benign'] || 0,
    }
  }, [stats])

  // Calculate Impact counts from appropriate data source
  const calculatedImpactCounts = useMemo(() => {
    // If no ACMG filter, use global stats
    if (acmgFilter === 'all') {
      if (!stats) return { high: 0, moderate: 0, low: 0, modifier: 0 }
      return {
        high: stats.impact_breakdown['HIGH'] || stats.impact_breakdown['high'] || 0,
        moderate: stats.impact_breakdown['MODERATE'] || stats.impact_breakdown['moderate'] || 0,
        low: stats.impact_breakdown['LOW'] || stats.impact_breakdown['low'] || 0,
        modifier: stats.impact_breakdown['MODIFIER'] || stats.impact_breakdown['modifier'] || 0,
      }
    }

    // When ACMG filter is active, use ACMG-only data if impact filter is active
    // Otherwise use main data
    const sourceGenes = impactFilter !== 'all' ? acmgOnlyGenes : allGenes
    
    const counts = { high: 0, moderate: 0, low: 0, modifier: 0 }
    sourceGenes.forEach(gene => {
      gene.variants.forEach(variant => {
        const impact = variant.impact?.toUpperCase()
        if (impact === 'HIGH') counts.high++
        else if (impact === 'MODERATE') counts.moderate++
        else if (impact === 'LOW') counts.low++
        else if (impact === 'MODIFIER') counts.modifier++
      })
    })

    return counts
  }, [stats, acmgFilter, impactFilter, allGenes, acmgOnlyGenes])

  // Update cached impact counts when ACMG filter changes or when data loads
  useEffect(() => {
    // Only update cache when we have valid data and impact filter is 'all'
    if (impactFilter === 'all' && !genesLoading) {
      setCachedImpactCounts(calculatedImpactCounts)
    }
  }, [calculatedImpactCounts, impactFilter, genesLoading])

  // Use cached counts if available and impact filter is active, otherwise use calculated
  const impactCounts = (impactFilter !== 'all' && cachedImpactCounts) 
    ? cachedImpactCounts 
    : calculatedImpactCounts

  // Handle filter clicks
  const handleAcmgClick = (filter: ACMGFilter) => {
    setAcmgFilter(prev => prev === filter ? 'all' : filter)
    // Reset impact filter when ACMG changes
    setImpactFilter('all')
    // Clear cached impact counts so they get recalculated
    setCachedImpactCounts(null)
  }

  const handleImpactClick = (filter: ImpactFilter) => {
    setImpactFilter(prev => prev === filter ? 'all' : filter)
  }

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
        <div className="p-3 rounded-lg bg-primary/10">
          <Microscope className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Variant Analysis</h1>
          <p className="text-base text-muted-foreground mt-1">
            Analyze variants by ACMG classification, impact, and clinical significance.
          </p>
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
      {stats && (
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
            label="Pathogenic"
            tooltip="Pathogenic variants - strong evidence of disease association"
            isSelected={acmgFilter === 'Pathogenic'}
            onClick={() => handleAcmgClick('Pathogenic')}
            colorClasses="border-red-200 bg-red-50 text-red-900"
          />
          <FilterCard
            count={acmgCounts.likely_pathogenic}
            label="Likely Path."
            tooltip="Likely Pathogenic variants - probable disease association"
            isSelected={acmgFilter === 'Likely Pathogenic'}
            onClick={() => handleAcmgClick('Likely Pathogenic')}
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
            label="Likely Benign"
            tooltip="Likely Benign variants - probably not disease-causing"
            isSelected={acmgFilter === 'Likely Benign'}
            onClick={() => handleAcmgClick('Likely Benign')}
            colorClasses="border-blue-200 bg-blue-50 text-blue-900"
          />
          <FilterCard
            count={acmgCounts.benign}
            label="Benign"
            tooltip="Benign variants - not disease-causing"
            isSelected={acmgFilter === 'Benign'}
            onClick={() => handleAcmgClick('Benign')}
            colorClasses="border-green-200 bg-green-50 text-green-900"
          />
        </div>
      )}

      {/* Impact Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <FilterCard
            count={impactCounts.high}
            label="HIGH"
            tooltip="High impact variants - frameshift, stop gained, splice donor/acceptor"
            isSelected={impactFilter === 'HIGH'}
            onClick={() => handleImpactClick('HIGH')}
            colorClasses="border-red-200 bg-red-50 text-red-900"
          />
          <FilterCard
            count={impactCounts.moderate}
            label="MODERATE"
            tooltip="Moderate impact variants - missense, in-frame indels"
            isSelected={impactFilter === 'MODERATE'}
            onClick={() => handleImpactClick('MODERATE')}
            colorClasses="border-orange-200 bg-orange-50 text-orange-900"
          />
          <FilterCard
            count={impactCounts.low}
            label="LOW"
            tooltip="Low impact variants - synonymous, splice region"
            isSelected={impactFilter === 'LOW'}
            onClick={() => handleImpactClick('LOW')}
            colorClasses="border-yellow-200 bg-yellow-50 text-yellow-900"
          />
          <FilterCard
            count={impactCounts.modifier}
            label="MODIFIER"
            tooltip="Modifier variants - intron, intergenic, UTR"
            isSelected={impactFilter === 'MODIFIER'}
            onClick={() => handleImpactClick('MODIFIER')}
            colorClasses="border-gray-200 bg-gray-50 text-gray-700"
          />
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
      {!isLoading && genesData && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Filter by gene..."
              value={geneFilter}
              onChange={(e) => setGeneFilter(e.target.value)}
              className="max-w-xs text-base"
            />
            <span className="text-sm text-muted-foreground">
              Showing {allGenes.length} of {totalGenes} genes
              {(acmgFilter !== 'all' || impactFilter !== 'all' || geneFilter) && ` (filtered)`}
            </span>
            {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {/* Sorting explanation */}
          <p className="text-sm text-muted-foreground">
            Sorted by ACMG classification priority (Pathogenic first), then by Tier, then by variant count.
            {(acmgFilter !== 'all' || impactFilter !== 'all') && ' Click the filter card again to show all.'}
          </p>

          {/* Gene Cards */}
          {allGenes.map((gene, idx) => (
            <GeneSection
              key={gene.gene_symbol}
              gene={gene}
              rank={idx + 1}
              onViewVariantDetails={setSelectedVariantIdx}
            />
          ))}

          {/* No results for filter */}
          {allGenes.length === 0 && (
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
          {hasNextPage && (
            <div ref={loadMoreRef} className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Loading more genes...</p>
            </div>
          )}

          {/* End of List */}
          {!hasNextPage && allGenes.length > PAGE_SIZE && (
            <p className="text-sm text-muted-foreground text-center py-4">
              All {allGenes.length} genes loaded
            </p>
          )}
        </div>
      )}

      {/* Empty State - no data at all */}
      {!isLoading && !genesData && (
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
