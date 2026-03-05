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
  Shield,
  Sparkles,
  Info,
  AlertCircle,
  TrendingUp,
  Pill,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSession } from '@/contexts/SessionContext'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import type { ScreeningGeneResult, ScreeningVariantResult } from '@/contexts/ScreeningResultsContext'
import { VariantDetailPanel } from '@/components/analysis/VariantDetailPanel'
import { useGenerateScreeningReport, useScreeningReport } from '@/hooks/mutations/use-screening-report'
import {
  getTierColor,
  getACMGColor,
  getScoreColor,
  formatACMGDisplay,
  formatTierDisplay,
  SharedVariantCard,
  type SharedVariantData,
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
// CLINGEN STATUS BADGE HELPER
// ============================================================================

const getClingenBadgeColor = (status: string | null | undefined): string => {
  if (!status) return 'bg-gray-100 text-gray-700 border-gray-300'
  switch (status.toLowerCase()) {
    case 'definitive': return 'bg-green-100 text-green-900 border-green-300'
    case 'strong': return 'bg-green-50 text-green-800 border-green-200'
    case 'moderate': return 'bg-yellow-100 text-yellow-900 border-yellow-300'
    case 'limited': return 'bg-orange-100 text-orange-900 border-orange-300'
    case 'disputed': return 'bg-red-100 text-red-900 border-red-300'
    case 'refuted': return 'bg-red-200 text-red-900 border-red-400'
    default: return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

/** Map ScreeningVariantResult to SharedVariantData */
function toSharedVariant(v: ScreeningVariantResult): SharedVariantData {
  return {
    variantIdx: parseInt(v.variant_id),
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

// ============================================================================
// VARIANT CARD (inside expanded gene card) - uses SharedVariantCard
// ============================================================================

interface VariantCardProps {
  variant: ScreeningVariantResult
  onViewDetails: () => void
}

function VariantCard({ variant, onViewDetails }: VariantCardProps) {
  const hasBoosts = variant.acmg_boost > 0 || variant.ethnicity_boost > 0 || variant.family_history_boost > 0 || variant.de_novo_boost > 0

  return (
    <SharedVariantCard
      variant={toSharedVariant(variant)}
      onViewDetails={() => onViewDetails()}
      collapsedRight={
        <>
          <Badge variant="outline" className={`text-tiny ${getTierColor(variant.tier)}`}>
            {formatTierDisplay(variant.tier)}
          </Badge>
          <Badge variant="outline" className={`text-tiny ${getActionabilityColor(variant.clinical_actionability)}`}>
            {formatActionability(variant.clinical_actionability)}
          </Badge>
          <Badge className={`text-tiny ${getScoreColor(variant.total_score * 100)}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {variant.total_score.toFixed(3)}
          </Badge>
        </>
      }
      expandedChildren={
        <>
          {/* Score Breakdown */}
          <div>
            <p className="text-md text-muted-foreground mb-2">Score Breakdown</p>
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
          {hasBoosts && (
            <div>
              <p className="text-md text-muted-foreground mb-2">Applied Boosts</p>
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
            <p className="text-md text-muted-foreground italic">{variant.justification}</p>
          )}
        </>
      }
    />
  )
}

// ============================================================================
// THERAPY NOTE BANNER (reusable)
// ============================================================================

function TherapyNoteBanner({ note }: { note: string }) {
  const isHighConfidence = /exceptional|first-line/i.test(note)
  const bgClass = isHighConfidence
    ? 'bg-green-50 border-l-4 border-green-400'
    : 'bg-blue-50 border-l-4 border-blue-400'
  const iconClass = isHighConfidence ? 'text-green-600' : 'text-blue-600'

  return (
    <div className={`flex items-start gap-2.5 px-4 py-2.5 rounded-r ${bgClass}`}>
      <Pill className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconClass}`} />
      <div>
        <p className="text-md text-muted-foreground">Therapy</p>
        <p className="text-base font-medium">{note}</p>
      </div>
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

    // Variant count respects tier filter
    const displayCount = useMemo(() => {
      if (tierFilter === 'all') return gene.variant_count
      switch (tierFilter) {
        case 'TIER_1': return gene.tier_1_count ?? 0
        case 'TIER_2': return gene.tier_2_count ?? 0
        case 'TIER_3': return gene.tier_3_count ?? 0
        case 'TIER_4': return gene.tier_4_count ?? 0
        default: return gene.variant_count
      }
    }, [tierFilter, gene])

  return (
    <Card className="gap-0">
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
        onClick={handleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Left: Rank + Gene + Panel Badges + Tier + Variants + ACMG */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground w-8">#{rank}</span>
            <span className="text-base font-medium w-16">{gene.gene_symbol}</span>
            {/* Panel metadata badges - conditional */}
            {gene.mody_type && (
              <Badge variant="outline" className="text-xs">{gene.mody_type}</Badge>
            )}
            {gene.clingen_status && (
              <Badge variant="outline" className={`text-xs ${getClingenBadgeColor(gene.clingen_status)}`}>
                {gene.clingen_status}
              </Badge>
            )}
            <Badge variant="outline" className={`text-sm w-10 justify-center ${getTierColor(gene.best_tier)}`}>
              {formatTierDisplay(gene.best_tier)}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {displayCount} variant{displayCount !== 1 ? 's' : ''}
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
          {/* Therapy Note Banner - highest clinical priority */}
          {gene.therapy_note && (
            <TherapyNoteBanner note={gene.therapy_note} />
          )}

          {/* Panel Disease Name - shown as info row when present */}
          {gene.disease_name_panel && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-md text-muted-foreground">Panel Disease</span>
              <span className="text-base font-medium">{gene.disease_name_panel}</span>
            </div>
          )}

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
  const [geneFilter, setGeneFilter] = useState('')
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedGene, setSelectedGene] = useState<ScreeningGeneResult | null>(null)
  const [isContextOpen, setIsContextOpen] = useState(false)

  // Screening Report
  const generateReport = useGenerateScreeningReport()
  const { data: existingReport, refetch: refetchReport } = useScreeningReport(sessionId)
  const [showFullReport, setShowFullReport] = useState(false)
  const { setSelectedModule } = useSession()

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
        onBack={() => { setSelectedVariantId(null); setSelectedGene(null) }}
        panelMetadata={selectedGene ? {
          therapy_note: selectedGene.therapy_note,
          disease_name_panel: selectedGene.disease_name_panel,
          mody_type: selectedGene.mody_type,
          clingen_status: selectedGene.clingen_status,
        } : undefined}
      />

    )
  }

  // Count context items for badge
  const contextItemCount = [ageGroup, screeningMode].filter(Boolean).length

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Clinical Screening</h1>
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

      {/* Patient Clinical Context - Collapsible (aligned with PhenotypeMatchingView) */}
      <Card className="gap-0">
        <CardHeader
          className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
          onClick={() => setIsContextOpen(!isContextOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-base font-medium">Screening Context</span>
              <Badge variant="secondary" className="text-sm">
                {contextItemCount} item{contextItemCount !== 1 ? 's' : ''}
              </Badge>
            </div>
            {isContextOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {isContextOpen && (
          <CardContent className="space-y-4">
            {/* Demographics inline */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Age Group</p>
                <p className="text-base font-semibold capitalize">{ageGroup || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Screening Mode</p>
                <p className="text-base font-semibold capitalize">{screeningMode?.replace(/_/g, ' ') || 'Unknown'}</p>
              </div>
              {hasResults && (
                <div>
                  <p className="text-sm text-muted-foreground">Genes with Variants</p>
                  <p className="text-base font-semibold">{geneResults.length.toLocaleString()}</p>
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

            {/* Screening Report Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-base font-medium">Screening Findings Report</span>
                </div>
                <div className="flex items-center gap-2">
                  {!existingReport && !generateReport.isPending && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        await generateReport.mutateAsync(sessionId)
                        refetchReport()
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate Report
                    </button>
                  )}
                  {generateReport.isPending && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </div>
                  )}
                  {existingReport && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedModule('screening-report')
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Full Report
                    </button>
                  )}
                </div>
              </div>

              {/* Report Summary Preview */}
              {existingReport && existingReport.content && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                  {existingReport.content
                    .split("\n")
                    .filter((line: string) => line.startsWith("### ") || line.startsWith("**Therapy"))
                    .slice(0, 6)
                    .map((line: string, i: number) => {
                      if (line.startsWith("### ")) {
                        return (
                          <p key={i} className="font-semibold text-base">
                            {line.replace("### ", "")}
                          </p>
                        )
                      }
                      return (
                        <p key={i} className="text-muted-foreground">
                          {line.replace(/\*\*/g, "")}
                        </p>
                      )
                    })}
                  {existingReport.content_length > 500 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Showing key findings only.
                    </p>
                  )}
                </div>
              )}

              {/* Error state */}
              {generateReport.isError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-md p-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{generateReport.error?.message || "Report generation failed"}</span>
                </div>
              )}
            </div>
          </CardContent>
        )}
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
              onViewVariantDetails={(variantId) => { setSelectedVariantId(variantId); setSelectedGene(gene) }}
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
