"use client"

/**
 * VariantAnalysisView Component - CLINICAL GRADE
 *
 * Card-based layout with LOCAL filtering (like PhenotypeMatchingView).
 * Loads ALL genes once, filters in memory for instant response.
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
import { useVariantsByGene, useVariantStatistics } from '@/hooks/queries'
import { VariantDetailPanel } from './VariantDetailPanel'
import {
  getACMGColor,
  getImpactColor,
  getTierColor,
  getZygosityBadge,
  formatACMGDisplay,
  ConsequenceBadges,
} from '@/components/shared'
import type { GeneAggregated, VariantInGene } from '@/types/variant.types'

interface VariantAnalysisViewProps {
  sessionId: string
}

// Lazy loading config (for visualization, not data fetching)
const INITIAL_LOAD = 15
const LOAD_MORE_COUNT = 15

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

// Check if gene matches ACMG filter
const geneMatchesACMG = (gene: GeneAggregated, filter: ACMGFilter): boolean => {
  if (filter === 'all') return true
  
  const acmgClass = acmgFilterToBackend(filter)
  if (!acmgClass) return true
  
  // Check if gene has any variant with this ACMG class
  return gene.variants.some(v => v.acmg_class === acmgClass)
}

// Check if gene matches Impact filter
const geneMatchesImpact = (gene: GeneAggregated, filter: ImpactFilter): boolean => {
  if (filter === 'all') return true
  
  // Check if gene has any variant with this impact
  return gene.variants.some(v => v.impact === filter)
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
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD)

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

  // Load ALL genes at once (no page/page_size = backend returns everything)
  const { data: allGenesData, isLoading: genesLoading } = useVariantsByGene(
    sessionId,
    {} // Empty filters = no pagination, return ALL genes
  )

  // Global stats (always unfiltered)
  const { data: globalStats, isLoading: globalStatsLoading } = useVariantStatistics(sessionId)

  const isLoading = globalStatsLoading || genesLoading

  // All genes from backend
  const allGenes = allGenesData?.genes ?? []

  // LOCAL FILTERING (instant, no API calls)
  const filteredGenes = useMemo(() => {
    let filtered = allGenes

    // Filter by ACMG
    if (acmgFilter !== 'all') {
      filtered = filtered.filter(g => geneMatchesACMG(g, acmgFilter))
    }

    // Filter by Impact
    if (impactFilter !== 'all') {
      filtered = filtered.filter(g => geneMatchesImpact(g, impactFilter))
    }

    // Filter by gene name
    if (geneFilter.trim()) {
      const search = geneFilter.toLowerCase()
      filtered = filtered.filter(g => g.gene_symbol.toLowerCase().includes(search))
    }

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

  // Calculate ACMG counts from global stats (always total counts)
  const acmgCounts = useMemo(() => {
    if (!globalStats) return { total: 0, pathogenic: 0, likely_pathogenic: 0, vus: 0, likely_benign: 0, benign: 0 }
    return {
      total: globalStats.total_variants,
      pathogenic: globalStats.classification_breakdown['Pathogenic'] || 0,
      likely_pathogenic: globalStats.classification_breakdown['Likely Pathogenic'] || 0,
      vus: globalStats.classification_breakdown['Uncertain Significance'] || 0,
      likely_benign: globalStats.classification_breakdown['Likely Benign'] || 0,
      benign: globalStats.classification_breakdown['Benign'] || 0,
    }
  }, [globalStats])

  // Calculate Impact counts from global stats
  const impactCounts = useMemo(() => {
    if (!globalStats) return { high: 0, moderate: 0, low: 0, modifier: 0 }
    return {
      high: globalStats.impact_breakdown['HIGH'] || 0,
      moderate: globalStats.impact_breakdown['MODERATE'] || 0,
      low: globalStats.impact_breakdown['LOW'] || 0,
      modifier: globalStats.impact_breakdown['MODIFIER'] || 0,
    }
  }, [globalStats])

  // Handle filter clicks
  const handleAcmgClick = (filter: ACMGFilter) => {
    setAcmgFilter(prev => prev === filter ? 'all' : filter)
    setImpactFilter('all') // Reset impact when ACMG changes
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
    <div className="p-6 space-y-6 overflow-y-auto [scrollbar-gutter:stable]">
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
      {globalStats && (
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
      {globalStats && (
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
      {!isLoading && hasResults && (
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
              Showing {visibleGenes.length} of {filteredGenes.length} genes
              {(acmgFilter !== 'all' || impactFilter !== 'all' || geneFilter) && ` (filtered)`}
            </span>
          </div>

          {/* Sorting explanation */}
          <p className="text-sm text-muted-foreground">
            Sorted by ACMG classification priority (Pathogenic first), then by Tier, then by variant count.
            {(acmgFilter !== 'all' || impactFilter !== 'all') && ' Click the filter card again to show all.'}
          </p>

          {/* Gene Cards */}
          {visibleGenes.map((gene, idx) => (
            <GeneSection
              key={gene.gene_symbol}
              gene={gene}
              rank={idx + 1}
              onViewVariantDetails={setSelectedVariantIdx}
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
