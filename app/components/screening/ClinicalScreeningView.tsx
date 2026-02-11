"use client"

/**
 * ClinicalScreeningView Component
 *
 * Summary-first gene cards with lazy-loaded variants on expand.
 * Same pattern as PhenotypeMatchingView.
 */

import { useState, useMemo, useCallback } from 'react'
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
import type { ScreeningGeneResult, ScreeningVariantResult } from '@/contexts/ScreeningResultsContext'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { VariantDetailPanel } from '@/components/analysis/VariantDetailPanel'
import {
  getTierColor,
  ConsequenceBadges,
} from '@/components/shared'

interface ClinicalScreeningViewProps {
  sessionId: string
}

type TierFilter = 'all' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4'

// ============================================================================
// VARIANT ROW (inside expanded gene card)
// ============================================================================

interface VariantRowProps {
  variant: ScreeningVariantResult
  onViewDetails: () => void
}

function VariantRow({ variant, onViewDetails }: VariantRowProps) {
  const [showScores, setShowScores] = useState(false)

  return (
    <div className="border rounded-lg p-3 space-y-2">
      {/* Variant header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-xs ${getTierColor(variant.tier)}`}>
            {variant.tier.replace('_', ' ')}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${
              variant.clinical_actionability === 'immediate' ? 'bg-red-100 text-red-900 border-red-300' :
              variant.clinical_actionability === 'monitoring' ? 'bg-orange-100 text-orange-900 border-orange-300' :
              variant.clinical_actionability === 'future' ? 'bg-yellow-100 text-yellow-900 border-yellow-300' :
              'bg-gray-100 text-gray-700 border-gray-300'
            }`}
          >
            {variant.clinical_actionability?.toUpperCase() || 'UNKNOWN'}
          </Badge>
          <span className="text-sm font-mono text-muted-foreground">
            {variant.hgvs_protein || variant.hgvs_cdna || 'No protein change'}
          </span>
          <ConsequenceBadges consequence={variant.consequence} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">{variant.total_score.toFixed(3)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1"
            onClick={() => setShowScores(!showScores)}
          >
            {showScores ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Score breakdown (collapsible) */}
      {showScores && (
        <div className="space-y-2 pt-2 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Constraint</p>
              <p className="text-sm font-mono">{variant.constraint_score?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deleteriousness</p>
              <p className="text-sm font-mono">{variant.deleteriousness_score?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phenotype</p>
              <p className="text-sm font-mono">{variant.phenotype_score?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Age Relevance</p>
              <p className="text-sm font-mono">{variant.age_relevance_score?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">ACMG Boost</p>
              <p className="text-sm font-mono">{variant.acmg_boost?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ethnicity Boost</p>
              <p className="text-sm font-mono">{variant.ethnicity_boost?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Family History</p>
              <p className="text-sm font-mono">{variant.family_history_boost?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">De Novo</p>
              <p className="text-sm font-mono">{variant.de_novo_boost?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
          {variant.justification && (
            <p className="text-sm text-muted-foreground">{variant.justification}</p>
          )}
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={onViewDetails}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Full Details
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// GENE CARD (summary-first, expand for variants)
// ============================================================================

interface GeneCardProps {
  gene: ScreeningGeneResult
  sessionId: string
  onViewVariantDetails: (variantId: string) => void
}

function GeneCard({ gene, sessionId, onViewVariantDetails }: GeneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoadingVariants, setIsLoadingVariants] = useState(false)
  const { loadScreeningGeneVariants } = useScreeningResults()

  const handleExpand = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    setIsExpanded(true)

    // Lazy-load variants if not cached
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
  }, [isExpanded, gene, sessionId, loadScreeningGeneVariants])

  return (
    <Card className="gap-0">
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
        onClick={handleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Left: Rank + Gene + Tier + Actionability + ACMG */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-muted-foreground w-8">#{gene.rank}</span>
            <span className="text-lg font-semibold w-20">{gene.gene_symbol}</span>
            <Badge variant="outline" className={`text-sm w-16 justify-center ${getTierColor(gene.best_tier)}`}>
              {gene.best_tier.replace('_', ' ')}
            </Badge>
            <Badge
              variant="outline"
              className={`text-sm ${
                gene.best_actionability === 'immediate' ? 'bg-red-100 text-red-900 border-red-300' :
                gene.best_actionability === 'monitoring' ? 'bg-orange-100 text-orange-900 border-orange-300' :
                gene.best_actionability === 'future' ? 'bg-yellow-100 text-yellow-900 border-yellow-300' :
                'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              {gene.best_actionability?.toUpperCase() || 'UNKNOWN'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {gene.best_acmg_class}
            </Badge>
          </div>

          {/* Right: Variant count + Score + Chevron */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{gene.variant_count} variant{gene.variant_count !== 1 ? 's' : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{gene.best_score.toFixed(3)}</p>
              <p className="text-xs text-muted-foreground">Best Score</p>
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {/* Tier distribution mini-badges */}
        {(gene.tier_1_count > 0 || gene.tier_2_count > 0) && (
          <div className="flex items-center gap-2 mt-1 ml-11">
            {gene.tier_1_count > 0 && (
              <span className="text-xs text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                T1: {gene.tier_1_count}
              </span>
            )}
            {gene.tier_2_count > 0 && (
              <span className="text-xs text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                T2: {gene.tier_2_count}
              </span>
            )}
            {gene.tier_3_count > 0 && (
              <span className="text-xs text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded">
                T3: {gene.tier_3_count}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      {/* Expanded: variant list (lazy-loaded) */}
      {isExpanded && (
        <CardContent className="space-y-2 pt-0">
          {isLoadingVariants ? (
            <div className="flex items-center justify-center py-4 gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading variants...</span>
            </div>
          ) : gene.variants && gene.variants.length > 0 ? (
            gene.variants.map((variant) => (
              <VariantRow
                key={variant.variant_id}
                variant={variant}
                onViewDetails={() => onViewVariantDetails(variant.variant_id)}
              />
            ))
          ) : (
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
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  // Loading/Empty state
  if (!geneResults) {
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

  // Apply filters
  const filteredGenes = useMemo(() => {
    let genes = geneResults

    // Tier filter
    if (tierFilter !== 'all') {
      genes = genes.filter(g => g.best_tier === tierFilter)
    }

    // Gene filter
    if (geneFilter.trim()) {
      const search = geneFilter.toLowerCase()
      genes = genes.filter(g => g.gene_symbol.toLowerCase().includes(search))
    }

    return genes
  }, [geneResults, tierFilter, geneFilter])

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
          {totalVariantsAnalyzed.toLocaleString()} Variants Screened
        </Badge>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-5 gap-3">
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

      {/* Patient Clinical Context */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Demographics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Age Group</p>
                <p className="text-base font-semibold">{ageGroup || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Screening Mode</p>
                <p className="text-base font-semibold">{screeningMode?.replace(/_/g, ' ') || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Genes with Variants</p>
                <p className="text-base font-semibold">{geneResults.length.toLocaleString()}</p>
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
                ethnicity-specific prevalence, and clinical actionability. Click a gene to see individual variants.
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
            Showing {filteredGenes.length} of {geneResults.length} genes
            {(tierFilter !== 'all' || geneFilter) && ` (filtered)`}
          </span>
        </div>

        {/* Sorting explanation */}
        <p className="text-sm text-muted-foreground">
          Sorted by tier priority (Tier 1 first), then by best score.
          {tierFilter !== 'all' && ' Click the tier card again to show all.'}
        </p>

        {/* Gene Cards */}
        {filteredGenes.map((gene) => (
          <GeneCard
            key={gene.gene_symbol}
            gene={gene}
            sessionId={sessionId}
            onViewVariantDetails={(variantId) => setSelectedVariantId(variantId)}
          />
        ))}

        {/* No results for filter */}
        {filteredGenes.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">No Genes Match Filter</p>
              <p className="text-sm text-muted-foreground">
                {tierFilter !== 'all' || geneFilter
                  ? 'No genes match the selected filters.'
                  : 'No screening results available.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
