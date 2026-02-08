"use client"

/**
 * ClinicalScreeningView Component
 *
 * Card-based layout matching PhenotypeMatchingView design.
 * Shows age-aware screening with tier-based prioritization.
 */

import { useState, useMemo } from 'react'
import {
  Filter,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  Sparkles,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { VariantDetailPanel } from '@/components/analysis/VariantDetailPanel'
import {
  getTierColor,
  ConsequenceBadges,
} from '@/components/shared'
import type { VariantResult } from '@/lib/api/screening'

interface ClinicalScreeningViewProps {
  sessionId: string
}

type TierFilter = 'all' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4'

// ============================================================================
// VARIANT CARD COMPONENT
// ============================================================================

interface VariantCardProps {
  variant: VariantResult
  rank: number
  onViewDetails: () => void
}

function VariantCard({ variant, rank, onViewDetails }: VariantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header - Flex layout with justify-between */}
        <div className="flex items-center justify-between">
          {/* Left: Rank + Gene + Tier + Actionability */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-muted-foreground w-8">#{rank}</span>
            <span className="text-lg font-semibold w-16">{variant.gene_symbol}</span>
            <Badge variant="outline" className={`text-sm w-16 justify-center ${getTierColor(variant.tier)}`}>
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
              {variant.clinical_actionability?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>

          {/* Right: Score + Chevron */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-lg font-bold">{variant.total_score.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {/* Protein Change and Consequence */}
          <div>
            <p className="text-base font-mono text-muted-foreground mb-1">
              {variant.hgvs_protein || 'No protein change'}
            </p>
            <ConsequenceBadges consequence={variant.consequence} />
          </div>

          {/* Score Breakdown */}
          <div>
            <p className="text-base font-semibold mb-2">Score Breakdown</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-md text-muted-foreground">Constraint</p>
                <p className="text-base font-mono">{variant.constraint_score?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-md text-muted-foreground">Deleteriousness</p>
                <p className="text-base font-mono">{variant.deleteriousness_score?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-md text-muted-foreground">Phenotype</p>
                <p className="text-base font-mono">{variant.phenotype_score?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-md text-muted-foreground">Age Relevance</p>
                <p className="text-base font-mono">{variant.age_relevance_score?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          {/* Boosts */}
          <div>
            <p className="text-base font-semibold mb-2">Clinical Boosts</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-md text-muted-foreground">ACMG</p>
                <p className="text-base font-mono">{variant.acmg_boost?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-md text-muted-foreground">Ethnicity</p>
                <p className="text-base font-mono">{variant.ethnicity_boost?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-md text-muted-foreground">Family History</p>
                <p className="text-base font-mono">{variant.family_history_boost?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-md text-muted-foreground">De Novo</p>
                <p className="text-base font-mono">{variant.de_novo_boost?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          {/* Justification */}
          {variant.justification && (
            <div>
              <p className="text-base font-semibold mb-1">Clinical Justification</p>
              <p className="text-base text-muted-foreground">{variant.justification}</p>
            </div>
          )}

          {/* Age Group and Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Age Group</p>
              <p className="text-base">{variant.age_group || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Screening Mode</p>
              <p className="text-base">{variant.screening_mode?.replace(/_/g, ' ') || 'Unknown'}</p>
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
  label: string
  tooltip: string
  isSelected: boolean
  onClick: () => void
  colorClasses: string
}

function TierCard({ count, label, tooltip, isSelected, onClick, colorClasses }: TierCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all ${colorClasses} ${
        isSelected ? 'ring-2 ring-gray-400 ring-offset-2' : 'hover:scale-105'
      }`}
      onClick={onClick}
    >
      <CardContent className="py-1.5 px-3 text-center relative">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="absolute top-1 right-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Info: ${label}`}
              >
                <Info className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-sm max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <p className="text-xl font-bold">{count.toLocaleString()}</p>
        <p className="text-sm font-medium">{label}</p>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ClinicalScreeningView({ sessionId }: ClinicalScreeningViewProps) {
  const { screeningResponse } = useScreeningResults()
  const { hpoTerms } = useClinicalProfileContext()
  const [geneFilter, setGeneFilter] = useState('')
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
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
              Age-aware variant prioritization with clinical actionability tiers.
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

    // Gene filter
    if (geneFilter.trim()) {
      const search = geneFilter.toLowerCase()
      variants = variants.filter(v => v.gene_symbol.toLowerCase().includes(search))
    }

    return variants
  }, [allVariants, tierFilter, geneFilter])

  // Handle tier click
  const handleTierClick = (filter: TierFilter) => {
    setTierFilter(prev => prev === filter ? 'all' : filter)
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
          {summary.total_variants_analyzed?.toLocaleString() || 0} Variants Screened
        </Badge>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-5 gap-3">
        <TierCard
          count={allVariants.length}
          label="All Tiers"
          tooltip="Show all variants across all tiers"
          isSelected={tierFilter === 'all'}
          onClick={() => handleTierClick('all')}
          colorClasses=""
        />
        <TierCard
          count={summary.tier1_count || 0}
          label="Tier 1"
          tooltip="Highest priority - immediate clinical action recommended"
          isSelected={tierFilter === 'TIER_1'}
          onClick={() => handleTierClick('TIER_1')}
          colorClasses="border-red-200 bg-red-50 text-red-900"
        />
        <TierCard
          count={summary.tier2_count || 0}
          label="Tier 2"
          tooltip="High priority - monitoring and follow-up recommended"
          isSelected={tierFilter === 'TIER_2'}
          onClick={() => handleTierClick('TIER_2')}
          colorClasses="border-orange-200 bg-orange-50 text-orange-900"
        />
        <TierCard
          count={summary.tier3_count || 0}
          label="Tier 3"
          tooltip="Moderate priority - future clinical relevance possible"
          isSelected={tierFilter === 'TIER_3'}
          onClick={() => handleTierClick('TIER_3')}
          colorClasses="border-yellow-200 bg-yellow-50 text-yellow-900"
        />
        <TierCard
          count={summary.tier4_count || 0}
          label="Tier 4"
          tooltip="Lower priority - research or uncertain significance"
          isSelected={tierFilter === 'TIER_4'}
          onClick={() => handleTierClick('TIER_4')}
          colorClasses="border-gray-200 bg-gray-50 text-gray-700"
        />
      </div>

      {/* Patient Clinical Context */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Demographics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Age Group</p>
                <p className="text-base font-semibold">{summary.age_group || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sex</p>
                <p className="text-base font-semibold">{summary.sex || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ethnicity</p>
                <p className="text-base font-semibold">{summary.ethnicity || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Screening Mode</p>
                <p className="text-base font-semibold">{summary.screening_mode?.replace(/_/g, ' ') || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processing Time</p>
                <p className="text-base font-semibold">{summary.processing_time_seconds?.toFixed(1) || '0.0'}s</p>
              </div>
            </div>

            {/* HPO Terms */}
            {hpoTerms.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-base font-semibold">Patient Phenotypes</p>
                </div>
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
              </div>
            )}

            {/* Info */}
            <div className="flex gap-3 pt-2">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Screening prioritizes variants based on age-specific disease onset, phenotype relevance,
                ethnicity-specific prevalence, and clinical actionability.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            {(tierFilter !== 'all' || geneFilter) && ` (filtered)`}
          </span>
        </div>

        {/* Sorting explanation */}
        <p className="text-sm text-muted-foreground">
          Sorted by tier priority (Tier 1 first), then by total score.
          {tierFilter !== 'all' && ' Click the tier card again to show all.'}
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
                {tierFilter !== 'all' || geneFilter
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
