"use client"

/**
 * ScreeningView Component - Clinical Screening Results
 *
 * Displays age-aware screening analysis results with tier-based prioritization.
 * Shows variants grouped by clinical actionability tiers.
 */

import { useState, useMemo } from 'react'
import {
  Filter,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import { VariantDetailPanel } from '@/components/analysis/VariantDetailPanel'
import {
  getACMGColor,
  getTierColor,
  formatACMGDisplay,
  ConsequenceBadges,
} from '@/components/shared'
import type { VariantResult } from '@/lib/api/screening'

interface ScreeningViewProps {
  sessionId: string
}

// Tier filter type
type TierFilter = 'all' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4'

// ACMG filter type
type ACMGFilter = 'all' | 'Pathogenic' | 'Likely Pathogenic' | 'VUS'

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface VariantCardProps {
  variant: VariantResult
  rank: number
  onViewDetails: () => void
}

function VariantCard({ variant, rank, onViewDetails }: VariantCardProps) {
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
            <span className="text-base font-bold text-muted-foreground">#{rank}</span>
            <span className="text-lg font-semibold">{variant.gene_symbol}</span>
            {variant.acmg_class && (
              <Badge variant="outline" className={`text-sm ${getACMGColor(variant.acmg_class)}`}>
                {formatACMGDisplay(variant.acmg_class)}
              </Badge>
            )}
            <Badge variant="outline" className={`text-sm ${getTierColor(variant.tier)}`}>
              {variant.tier.replace('_', ' ')}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-sm ${
                variant.clinical_actionability === 'immediate' ? 'bg-red-100 text-red-900 border-red-300' :
                variant.clinical_actionability === 'monitoring' ? 'bg-orange-100 text-orange-900 border-orange-300' :
                variant.clinical_actionability === 'future' ? 'bg-yellow-100 text-yellow-900 border-yellow-300' :
                'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              {variant.clinical_actionability.toUpperCase()}
            </Badge>
          </div>
          <p className="text-base font-mono text-muted-foreground">
            {variant.hgvs_protein || 'No protein change'}
          </p>
          <ConsequenceBadges consequence={variant.consequence} className="mt-1" />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xl font-bold">{variant.total_score.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Total Score</p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-md text-muted-foreground">Constraint</p>
              <p className="text-md font-mono">{variant.constraint_score.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Deleteriousness</p>
              <p className="text-md font-mono">{variant.deleteriousness_score.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Phenotype</p>
              <p className="text-md font-mono">{variant.phenotype_score.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Age Relevance</p>
              <p className="text-md font-mono">{variant.age_relevance_score.toFixed(2)}</p>
            </div>
          </div>

          {/* Boosts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-md text-muted-foreground">ACMG Boost</p>
              <p className="text-md font-mono">{variant.acmg_boost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Ethnicity Boost</p>
              <p className="text-md font-mono">{variant.ethnicity_boost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Family History</p>
              <p className="text-md font-mono">{variant.family_history_boost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">De Novo Boost</p>
              <p className="text-md font-mono">{variant.de_novo_boost.toFixed(2)}</p>
            </div>
          </div>

          {/* Justification */}
          {variant.justification && (
            <div>
              <p className="text-md text-muted-foreground mb-1">Clinical Justification</p>
              <p className="text-base">{variant.justification}</p>
            </div>
          )}

          {/* Age Group and Mode */}
          <div className="flex gap-4">
            <div>
              <p className="text-md text-muted-foreground">Age Group</p>
              <p className="text-base">{variant.age_group}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Screening Mode</p>
              <p className="text-base">{variant.screening_mode.replace(/_/g, ' ')}</p>
            </div>
          </div>

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

export function ScreeningView({ sessionId }: ScreeningViewProps) {
  const { screeningResponse } = useScreeningResults()
  const [geneFilter, setGeneFilter] = useState('')
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [acmgFilter, setACMGFilter] = useState<ACMGFilter>('all')
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  // Loading/Empty state
  if (!screeningResponse) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Clinical Screening</h1>
            <p className="text-base text-muted-foreground mt-1">
              No screening results available. Please run clinical analysis first.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const summary = screeningResponse.summary

  // Combine all tier results
  const allVariants = useMemo(() => {
    return [
      ...screeningResponse.tier1_results,
      ...screeningResponse.tier2_results,
      ...screeningResponse.tier3_results,
      ...screeningResponse.tier4_results,
    ]
  }, [screeningResponse])

  // Apply filters
  const filteredVariants = useMemo(() => {
    let variants = allVariants

    // Tier filter
    if (tierFilter !== 'all') {
      variants = variants.filter(v => v.tier === tierFilter)
    }

    // ACMG filter
    if (acmgFilter !== 'all') {
      variants = variants.filter(v => v.acmg_class === acmgFilter)
    }

    // Gene filter
    if (geneFilter.trim()) {
      const search = geneFilter.toLowerCase()
      variants = variants.filter(v => v.gene_symbol.toLowerCase().includes(search))
    }

    return variants
  }, [allVariants, tierFilter, acmgFilter, geneFilter])

  // Handle filter clicks
  const handleTierClick = (filter: TierFilter) => {
    setTierFilter(prev => prev === filter ? 'all' : filter)
  }

  const handleACMGClick = (filter: ACMGFilter) => {
    setACMGFilter(prev => prev === filter ? 'all' : filter)
  }

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

        {/* Status Badge */}
        <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-300">
          {summary.total_variants_analyzed.toLocaleString()} Variants Screened
        </Badge>
      </div>

      {/* Summary Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-md text-muted-foreground">Age Group</p>
              <p className="text-lg font-semibold">{summary.age_group}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Sex</p>
              <p className="text-lg font-semibold">{summary.sex}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Ethnicity</p>
              <p className="text-lg font-semibold">{summary.ethnicity || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Screening Mode</p>
              <p className="text-lg font-semibold">{summary.screening_mode.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Processing Time</p>
              <p className="text-lg font-semibold">{summary.processing_time_seconds.toFixed(1)}s</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ACMG Classification Cards */}
      <div className="grid grid-cols-4 gap-3">
        <FilterCard
          count={summary.total_variants_analyzed}
          label="Total"
          tooltip="Show all screened variants"
          isSelected={acmgFilter === 'all'}
          onClick={() => handleACMGClick('all')}
          colorClasses=""
        />
        <FilterCard
          count={summary.pathogenic_count}
          label="Pathogenic"
          tooltip="Pathogenic variants - strong evidence of disease association"
          isSelected={acmgFilter === 'Pathogenic'}
          onClick={() => handleACMGClick('Pathogenic')}
          colorClasses="border-red-200 bg-red-50 text-red-900"
        />
        <FilterCard
          count={summary.likely_pathogenic_count}
          label="Likely Path."
          tooltip="Likely Pathogenic variants - probable disease association"
          isSelected={acmgFilter === 'Likely Pathogenic'}
          onClick={() => handleACMGClick('Likely Pathogenic')}
          colorClasses="border-orange-200 bg-orange-50 text-orange-900"
        />
        <FilterCard
          count={summary.vus_count}
          label="VUS"
          tooltip="Variants of Uncertain Significance - requires further investigation"
          isSelected={acmgFilter === 'VUS'}
          onClick={() => handleACMGClick('VUS')}
          colorClasses="border-yellow-200 bg-yellow-50 text-yellow-900"
        />
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-5 gap-3">
        <FilterCard
          count={allVariants.length}
          label="All Tiers"
          tooltip="Show all variants across all tiers"
          isSelected={tierFilter === 'all'}
          onClick={() => handleTierClick('all')}
          colorClasses=""
        />
        <FilterCard
          count={summary.tier1_count}
          label="Tier 1"
          tooltip="Highest priority - immediate clinical action recommended"
          isSelected={tierFilter === 'TIER_1'}
          onClick={() => handleTierClick('TIER_1')}
          colorClasses="border-red-200 bg-red-50 text-red-900"
        />
        <FilterCard
          count={summary.tier2_count}
          label="Tier 2"
          tooltip="High priority - monitoring and follow-up recommended"
          isSelected={tierFilter === 'TIER_2'}
          onClick={() => handleTierClick('TIER_2')}
          colorClasses="border-orange-200 bg-orange-50 text-orange-900"
        />
        <FilterCard
          count={summary.tier3_count}
          label="Tier 3"
          tooltip="Moderate priority - future clinical relevance possible"
          isSelected={tierFilter === 'TIER_3'}
          onClick={() => handleTierClick('TIER_3')}
          colorClasses="border-yellow-200 bg-yellow-50 text-yellow-900"
        />
        <FilterCard
          count={summary.tier4_count}
          label="Tier 4"
          tooltip="Lower priority - research or uncertain significance"
          isSelected={tierFilter === 'TIER_4'}
          onClick={() => handleTierClick('TIER_4')}
          colorClasses="border-gray-200 bg-gray-50 text-gray-700"
        />
      </div>

      {/* Results */}
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
            Showing {filteredVariants.length} of {allVariants.length} variants
            {(tierFilter !== 'all' || acmgFilter !== 'all' || geneFilter) && ` (filtered)`}
          </span>
        </div>

        {/* Sorting explanation */}
        <p className="text-sm text-muted-foreground">
          Sorted by tier priority (Tier 1 first), then by total score.
          {(tierFilter !== 'all' || acmgFilter !== 'all') && ' Click the filter card again to show all.'}
        </p>

        {/* Variant Cards */}
        {filteredVariants.map((variant, idx) => (
          <VariantCard
            key={variant.variant_id}
            variant={variant}
            rank={idx + 1}
            onViewDetails={() => setSelectedVariantId(variant.variant_id)}
          />
        ))}

        {/* No results for filter */}
        {filteredVariants.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">No Variants Match Filter</p>
              <p className="text-sm text-muted-foreground">
                {tierFilter !== 'all' || acmgFilter !== 'all' || geneFilter
                  ? 'No variants match the selected filters.'
                  : 'No variants available.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
