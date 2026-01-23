"use client"

/**
 * VariantAnalysisView Component - CLINICAL GRADE
 *
 * Card-based layout using backend /by-gene endpoint for efficient data fetching.
 * Uses lazy loading with Intersection Observer for smooth scrolling.
 *
 * Features:
 * - Card per gene (not table rows)
 * - Lazy loading (no pagination)
 * - Consistent typography with PhenotypeMatchingView
 * - Clickable ACMG cards with filtering
 * - Clickable Impact cards with filtering
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
import { useVariantsByGene, useVariantStatistics } from '@/hooks/queries'
import { VariantDetailPanel } from './VariantDetailPanel'
import type { GeneAggregated, VariantInGene, GeneAggregatedFilters } from '@/types/variant.types'

interface VariantAnalysisViewProps {
  sessionId: string
}

// Lazy loading constants
const INITIAL_LOAD = 15
const LOAD_MORE_COUNT = 15
const FETCH_PAGE_SIZE = 500

// ACMG filter type
type ACMGFilter = 'all' | 'Pathogenic' | 'Likely Pathogenic' | 'VUS' | 'Likely Benign' | 'Benign'

// Impact filter type
type ImpactFilter = 'all' | 'HIGH' | 'MODERATE' | 'LOW' | 'MODIFIER'

// ============================================================================
// STYLING HELPERS
// ============================================================================

const getACMGColor = (acmg: string | null) => {
  if (!acmg) return 'bg-gray-100 text-gray-600 border-gray-300'
  const acmgLower = acmg.toLowerCase()
  if (acmgLower === 'pathogenic') return 'bg-red-100 text-red-900 border-red-300'
  if (acmgLower === 'likely pathogenic') return 'bg-orange-100 text-orange-900 border-orange-300'
  if (acmgLower.includes('uncertain') || acmgLower === 'vus') return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  if (acmgLower === 'likely benign') return 'bg-blue-100 text-blue-900 border-blue-300'
  if (acmgLower === 'benign') return 'bg-green-100 text-green-900 border-green-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

const getImpactColor = (impact: string | null) => {
  if (!impact) return 'bg-gray-100 text-gray-600 border-gray-300'
  const impactUpper = impact.toUpperCase()
  if (impactUpper === 'HIGH') return 'bg-red-100 text-red-900 border-red-300'
  if (impactUpper === 'MODERATE') return 'bg-orange-100 text-orange-900 border-orange-300'
  if (impactUpper === 'LOW') return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

const getTierColor = (tier: number | null) => {
  if (!tier) return 'bg-gray-100 text-gray-600 border-gray-300'
  if (tier === 1) return 'bg-red-100 text-red-900 border-red-300'
  if (tier === 2) return 'bg-orange-100 text-orange-900 border-orange-300'
  if (tier === 3) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

const getZygosityBadge = (genotype: string | null) => {
  if (!genotype) return { label: '-', color: 'bg-gray-100' }
  if (genotype === '0/1' || genotype === '1/0' || genotype === '0|1' || genotype === '1|0' || genotype === 'het') {
    return { label: 'Het', color: 'bg-blue-100 text-blue-900 border-blue-300' }
  }
  if (genotype === '1/1' || genotype === '1|1' || genotype === 'hom') {
    return { label: 'Hom', color: 'bg-purple-100 text-purple-900 border-purple-300' }
  }
  if (genotype === '1' || genotype === '1/.' || genotype === '.|1' || genotype === 'hemi') {
    return { label: 'Hemi', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' }
  }
  return { label: genotype, color: 'bg-gray-100' }
}

const formatACMGDisplay = (acmg: string | null): string => {
  if (!acmg) return 'Unknown'
  if (acmg.toLowerCase().includes('uncertain')) return 'VUS'
  if (acmg.toLowerCase() === 'likely pathogenic') return 'LP'
  if (acmg.toLowerCase() === 'likely benign') return 'LB'
  if (acmg.toLowerCase() === 'pathogenic') return 'P'
  if (acmg.toLowerCase() === 'benign') return 'B'
  return acmg
}

// Convert ACMG class to short tier for filtering
const getACMGShort = (acmg: string | null): ACMGFilter => {
  if (!acmg) return 'all'
  const acmgLower = acmg.toLowerCase()
  if (acmgLower === 'pathogenic') return 'Pathogenic'
  if (acmgLower === 'likely pathogenic') return 'Likely Pathogenic'
  if (acmgLower.includes('uncertain')) return 'VUS'
  if (acmgLower === 'likely benign') return 'Likely Benign'
  if (acmgLower === 'benign') return 'Benign'
  return 'all'
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
          <p className="text-sm text-muted-foreground mt-1">
            {variant.consequence || 'unknown consequence'}
          </p>
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
              <p className="text-sm text-muted-foreground">HGVS Protein</p>
              <p className="text-base font-mono">{variant.hgvs_protein || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">HGVS cDNA</p>
              <p className="text-base font-mono">{variant.hgvs_cdna || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Depth</p>
              <p className="text-base">{variant.depth || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quality</p>
              <p className="text-base">{variant.quality?.toFixed(1) || '-'}</p>
            </div>
          </div>

          {/* ACMG Criteria */}
          {variant.acmg_criteria && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">ACMG Criteria</p>
              <div className="flex flex-wrap gap-1">
                {variant.acmg_criteria.split(',').filter(Boolean).map((c: string) => (
                  <Badge key={c} variant="outline" className="text-xs font-mono">
                    {c.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ClinVar */}
          {variant.clinvar_significance && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">ClinVar</p>
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
              <Badge variant="outline" className={`text-xs ${getImpactColor(gene.best_impact)}`}>
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
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null)

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

  // Fetch all genes with large page size (backend handles sorting)
  const backendFilters: GeneAggregatedFilters = useMemo(() => ({
    page: 1,
    page_size: FETCH_PAGE_SIZE,
  }), [])

  // Data fetching
  const { data: stats, isLoading: statsLoading } = useVariantStatistics(sessionId)
  const { data: genesData, isLoading: genesLoading } = useVariantsByGene(sessionId, backendFilters)

  const isLoading = statsLoading || genesLoading

  // Calculate counts from stats
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

  const impactCounts = useMemo(() => {
    if (!stats) return { high: 0, moderate: 0, low: 0, modifier: 0 }
    return {
      high: stats.impact_breakdown['HIGH'] || stats.impact_breakdown['high'] || 0,
      moderate: stats.impact_breakdown['MODERATE'] || stats.impact_breakdown['moderate'] || 0,
      low: stats.impact_breakdown['LOW'] || stats.impact_breakdown['low'] || 0,
      modifier: stats.impact_breakdown['MODIFIER'] || stats.impact_breakdown['modifier'] || 0,
    }
  }, [stats])

  // Client-side filtering
  const filteredGenes = useMemo(() => {
    if (!genesData?.genes) return []

    let filtered = genesData.genes

    // Filter by ACMG class
    if (acmgFilter !== 'all') {
      filtered = filtered.filter(gene => {
        const geneAcmg = getACMGShort(gene.best_acmg_class)
        return geneAcmg === acmgFilter
      })
    }

    // Filter by impact
    if (impactFilter !== 'all') {
      filtered = filtered.filter(gene =>
        gene.best_impact?.toUpperCase() === impactFilter
      )
    }

    // Filter by gene name
    if (geneFilter.trim()) {
      const filter = geneFilter.toLowerCase().trim()
      filtered = filtered.filter(gene =>
        gene.gene_symbol.toLowerCase().includes(filter)
      )
    }

    return filtered
  }, [genesData?.genes, acmgFilter, impactFilter, geneFilter])

  // Visible results (lazy loading)
  const visibleGenes = useMemo(() => {
    return filteredGenes.slice(0, visibleCount)
  }, [filteredGenes, visibleCount])

  const hasMore = visibleCount < filteredGenes.length

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD)
  }, [acmgFilter, impactFilter, geneFilter])

  // Handle filter clicks
  const handleAcmgClick = (filter: ACMGFilter) => {
    setAcmgFilter(prev => prev === filter ? 'all' : filter)
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

  const hasResults = !isLoading && genesData && genesData.genes.length > 0

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
