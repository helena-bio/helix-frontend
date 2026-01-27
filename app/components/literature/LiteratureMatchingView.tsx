"use client"

/**
 * LiteratureMatchingView Component
 *
 * Displays clinical literature search results from Literature Mining Service.
 * Auto-searches when phenotype matching completes - no manual controls needed.
 *
 * Features:
 * - Auto-search triggered by phenotype matching
 * - Grouped by gene with expandable sections
 * - Combined scoring (60% clinical + 40% literature)
 * - Clickable tier cards with filtering (matching PhenotypeMatchingView)
 * - Evidence strength badges
 * - Score breakdown visualization
 * - Links to PubMed/PMC/DOI
 */

import { useState, useMemo } from 'react'
import {
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  FlaskConical,
  AlertCircle,
  Sparkles,
  Filter,
  TrendingUp,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useLiteratureResults } from '@/contexts/LiteratureResultsContext'
import { useSession } from '@/contexts/SessionContext'
import { getPubMedUrl, getPMCUrl, formatAuthors } from '@/lib/api/literature'
import type { PublicationResult, GenePublicationGroup } from '@/types/literature.types'

interface LiteratureMatchingViewProps {
  sessionId: string
}

// Tier filter type
type TierFilter = 'all' | 'T1' | 'T2' | 'T3' | 'T4'

// ============================================================================
// STYLING HELPERS
// ============================================================================

const getEvidenceColor = (strength: string) => {
  switch (strength) {
    case 'STRONG':
      return 'bg-green-100 text-green-900 border-green-300'
    case 'MODERATE':
      return 'bg-blue-100 text-blue-900 border-blue-300'
    case 'SUPPORTING':
      return 'bg-yellow-100 text-yellow-900 border-yellow-300'
    case 'WEAK':
      return 'bg-gray-100 text-gray-600 border-gray-300'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300'
  }
}

const getScoreColor = (score: number) => {
  if (score >= 0.7) return 'bg-green-100 text-green-900 border-green-300'
  if (score >= 0.4) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

/**
 * Get color for combined score badge based on score value
 * Higher score = green, medium = blue, lower = gray
 */
const getCombinedScoreColor = (score: number) => {
  if (score >= 0.7) return 'bg-green-100 text-green-900 border-green-300'
  if (score >= 0.5) return 'bg-blue-100 text-blue-900 border-blue-300'
  if (score >= 0.3) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

/**
 * Format evidence strength for display (Title Case instead of ALL CAPS)
 */
const formatEvidenceStrength = (strength: string): string => {
  return strength.charAt(0) + strength.slice(1).toLowerCase()
}

/**
 * Get color for clinical tier badge
 */
const getTierColor = (tier: string) => {
  const tierLower = tier.toLowerCase()
  if (tierLower.includes('1')) {
    return 'bg-red-100 text-red-900 border-red-300'
  }
  if (tierLower.includes('2') || tierLower.includes('potentially')) {
    return 'bg-orange-100 text-orange-900 border-orange-300'
  }
  if (tierLower.includes('3') || tierLower.includes('uncertain')) {
    return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  }
  if (tierLower.includes('4') || tierLower.includes('unlikely')) {
    return 'bg-gray-100 text-gray-600 border-gray-300'
  }
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

/**
 * Format tier for display - always use short format T1, T2, T3, T4
 */
const formatTierDisplay = (tier: string): string => {
  const tierLower = tier.toLowerCase()
  if (tierLower.includes('1')) return 'T1'
  if (tierLower.includes('2') || tierLower.includes('potentially')) return 'T2'
  if (tierLower.includes('3') || tierLower.includes('uncertain')) return 'T3'
  if (tierLower.includes('4') || tierLower.includes('unlikely')) return 'T4'
  return tier
}

/**
 * Get short tier from clinicalTier string
 */
const getShortTier = (tier: string | undefined): TierFilter => {
  if (!tier) return 'T4'
  const tierLower = tier.toLowerCase()
  if (tierLower.includes('1')) return 'T1'
  if (tierLower.includes('2') || tierLower.includes('potentially')) return 'T2'
  if (tierLower.includes('3') || tierLower.includes('uncertain')) return 'T3'
  if (tierLower.includes('4') || tierLower.includes('unlikely')) return 'T4'
  return 'T4'
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface PublicationCardProps {
  publication: PublicationResult
  onViewDetails: (pmid: string) => void
}

function PublicationCard({ publication, onViewDetails }: PublicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    onViewDetails(publication.pmid)
  }

  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={`text-sm ${getEvidenceColor(publication.evidence.evidence_strength)}`}>
              {formatEvidenceStrength(publication.evidence.evidence_strength)}
            </Badge>
            <Badge variant="outline" className={`text-sm ${getScoreColor(publication.relevance_score)}`}>
              {(publication.relevance_score * 100).toFixed(0)}%
            </Badge>
            {publication.evidence.has_functional_data && (
              <Badge variant="secondary" className="text-sm bg-purple-100 text-purple-900">
                <FlaskConical className="h-3 w-3 mr-1" />
                Functional
              </Badge>
            )}
            {publication.evidence.has_exact_variant && (
              <Badge variant="secondary" className="text-sm bg-red-100 text-red-900">
                <Sparkles className="h-3 w-3 mr-1" />
                Exact Match
              </Badge>
            )}
          </div>
          <h4 className="font-medium text-ml line-clamp-2">{publication.title}</h4>
          <p className="text-md text-muted-foreground mt-1">
            {formatAuthors(publication.authors)} - {publication.journal || 'Unknown Journal'}
            {publication.publication_date && ` (${publication.publication_date.slice(0, 4)})`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Abstract */}
          <div>
            <p className="text-base font-semibold mb-1">Abstract</p>
            <p className="text-base text-muted-foreground line-clamp-6">{publication.abstract}</p>
          </div>

          {/* Evidence Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-base font-semibold mb-1">Matched Phenotypes</p>
              <div className="flex flex-wrap gap-1">
                {publication.evidence.phenotype_matches.length > 0 ? (
                  publication.evidence.phenotype_matches.map((phenotype, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {phenotype}
                    </Badge>
                  ))
                ) : (
                  <span className="text-md text-muted-foreground">None</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-base font-semibold mb-1">Genes Mentioned</p>
              <div className="flex flex-wrap gap-1">
                {publication.evidence.gene_mentions.map((gene, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">
                    {gene}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div>
            <p className="text-base font-semibold mb-2">Score Breakdown</p>
            <div className="grid grid-cols-3 gap-2 text-md">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phenotype</span>
                <span>{(publication.phenotype_score * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pub Type</span>
                <span>{(publication.publication_type_score * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gene Focus</span>
                <span>{(publication.gene_centrality_score * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Functional</span>
                <span>{(publication.functional_data_score * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Variant</span>
                <span>{(publication.variant_score * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recency</span>
                <span>{(publication.recency_score * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-md"
              onClick={handleViewDetails}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Full Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-md"
              onClick={(e) => { e.stopPropagation(); window.open(getPubMedUrl(publication.pmid), '_blank') }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              PubMed
            </Button>
            {publication.pmc_id && (
              <Button
                variant="outline"
                size="sm"
                className="text-md"
                onClick={(e) => { e.stopPropagation(); const url = getPMCUrl(publication.pmc_id); if (url) window.open(url, '_blank') }}
              >
                <FileText className="h-3 w-3 mr-1" />
                Full Text
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface GeneSectionProps {
  group: GenePublicationGroup
  rank: number
  onViewDetails: (pmid: string) => void
}

function GeneSection({ group, rank, onViewDetails }: GeneSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Flex layout with justify-between */}
        <div className="flex items-center justify-between">
          {/* Left: Rank + Gene + Tier + Publications + Phenotype Rank */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-muted-foreground w-8">#{rank}</span>
            <span className="text-lg font-semibold w-16">{group.gene}</span>
            {group.clinicalTier && (
              <Badge variant="outline" className={`text-sm w-10 justify-center ${getTierColor(group.clinicalTier)}`}>
                {formatTierDisplay(group.clinicalTier)}
              </Badge>
            )}
            <Badge variant="secondary" className="text-sm">
              {group.publications.length} publications
            </Badge>
            {group.phenotypeRank && (
              <span className="text-sm text-muted-foreground">
                Phenotype Matching Rank: #{group.phenotypeRank}
              </span>
            )}
          </div>

          {/* Right: Scores + Evidence counts + Chevron - compact */}
          <div className="flex items-center gap-2">
            <Badge className={`text-sm ${getCombinedScoreColor(group.combinedScore)}`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {(group.combinedScore * 100).toFixed(0)}%
            </Badge>
            <span className="text-sm text-muted-foreground">
              Lit: {(group.bestScore * 100).toFixed(0)}%
              {group.clinicalScore !== undefined && ` / Clin: ${group.clinicalScore.toFixed(0)}`}
            </span>
            {group.strongCount > 0 && (
              <Badge variant="outline" className="text-sm bg-green-100 text-green-900 border-green-300">
                {group.strongCount} Strong
              </Badge>
            )}
            {group.moderateCount > 0 && (
              <Badge variant="outline" className="text-sm bg-blue-100 text-blue-900 border-blue-300">
                {group.moderateCount} Moderate
              </Badge>
            )}
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3">
          {group.publications.map((pub) => (
            <PublicationCard key={pub.pmid} publication={pub} onViewDetails={onViewDetails} />
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
              <p className="text-ml font-bold">{count}</p>
              <p className="text-base font-semibold">{label}</p>
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

export function LiteratureMatchingView({ sessionId }: LiteratureMatchingViewProps) {
  const [geneFilter, setGeneFilter] = useState('')
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')

  // Context
  const {
    status,
    error,
    totalResults,
    groupedByGene,
  } = useLiteratureResults()

  const { setSelectedPublicationId, openDetails } = useSession()

  // Handle view details click
  const handleViewDetails = (pmid: string) => {
    setSelectedPublicationId(pmid)
    openDetails()
  }

  // Calculate tier counts from grouped results
  const tierCounts = useMemo(() => {
    if (!groupedByGene) return { t1: 0, t2: 0, t3: 0, t4: 0 }

    return groupedByGene.reduce((acc, group) => {
      const tier = getShortTier(group.clinicalTier)
      if (tier === 'T1') acc.t1++
      else if (tier === 'T2') acc.t2++
      else if (tier === 'T3') acc.t3++
      else acc.t4++
      return acc
    }, { t1: 0, t2: 0, t3: 0, t4: 0 })
  }, [groupedByGene])

  // Handle tier card click
  const handleTierClick = (tier: TierFilter) => {
    setTierFilter(prev => prev === tier ? 'all' : tier)
  }

  // Filter groups by gene name and tier
  const filteredGroups = useMemo(() => {
    if (!groupedByGene) return []

    let filtered = groupedByGene

    // Filter by tier
    if (tierFilter !== 'all') {
      filtered = filtered.filter(g => getShortTier(g.clinicalTier) === tierFilter)
    }

    // Filter by gene name
    if (geneFilter) {
      const filter = geneFilter.toLowerCase()
      filtered = filtered.filter(g => g.gene.toLowerCase().includes(filter))
    }

    return filtered
  }, [groupedByGene, geneFilter, tierFilter])

  return (
    <div className="p-6 space-y-6 overflow-y-auto [scrollbar-gutter:stable]">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Literature Analysis</h1>
          <p className="text-base text-muted-foreground mt-1">
            Automated clinical literature search with combined scoring (60% clinical + 40% literature)
          </p>
        </div>

        {/* Status Badge */}
        {status === 'success' && (
          <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-300">
            {totalResults} Publications Found
          </Badge>
        )}
        {status === 'loading' && (
          <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-300">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Searching...
          </Badge>
        )}
      </div>

      {/* Tier Summary Cards - Clickable */}
      {status === 'success' && groupedByGene.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          <TierCard
            count={groupedByGene.length}
            tier="all"
            label="Genes"
            tooltip="Show all genes with literature"
            isSelected={tierFilter === 'all'}
            onClick={() => handleTierClick('all')}
            colorClasses=""
          />
          <TierCard
            count={tierCounts.t1}
            tier="T1"
            label="Tier 1"
            tooltip="Tier 1 - Actionable: Strong evidence of pathogenicity with clinical actionability"
            isSelected={tierFilter === 'T1'}
            onClick={() => handleTierClick('T1')}
            colorClasses="border-red-200 bg-red-50 text-red-900"
          />
          <TierCard
            count={tierCounts.t2}
            tier="T2"
            label="Tier 2"
            tooltip="Tier 2 - Potentially Actionable: Moderate evidence, may require additional validation"
            isSelected={tierFilter === 'T2'}
            onClick={() => handleTierClick('T2')}
            colorClasses="border-orange-200 bg-orange-50 text-orange-900"
          />
          <TierCard
            count={tierCounts.t3}
            tier="T3"
            label="Tier 3"
            tooltip="Tier 3 - Uncertain Significance: Limited evidence, requires further investigation"
            isSelected={tierFilter === 'T3'}
            onClick={() => handleTierClick('T3')}
            colorClasses="border-yellow-200 bg-yellow-50 text-yellow-900"
          />
          <TierCard
            count={tierCounts.t4}
            tier="T4"
            label="Tier 4"
            tooltip="Tier 4 - Unlikely Pathogenic: Benign or likely benign variants"
            isSelected={tierFilter === 'T4'}
            onClick={() => handleTierClick('T4')}
            colorClasses="border-gray-200 bg-gray-50 text-gray-700"
          />
        </div>
      )}

      {/* Results */}
      {status === 'loading' && (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-base font-medium">Searching clinical literature...</p>
          <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
        </div>
      )}

      {status === 'error' && (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-base font-medium mb-2">Search Failed</p>
            <p className="text-sm text-muted-foreground">{error?.message}</p>
          </CardContent>
        </Card>
      )}

      {status === 'success' && groupedByGene.length > 0 && (
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
              Showing {filteredGroups.length} of {groupedByGene.length} genes
              {tierFilter !== 'all' && ` (filtered by ${tierFilter})`}
            </span>
          </div>

          {/* Scoring explanation */}
          <p className="text-md text-muted-foreground">
            Sorted by Combined Score = 60% Clinical Priority (from Phenotype Matching) + 40% Literature Relevance
            {tierFilter !== 'all' && '. Click the tier card again to show all.'}
          </p>

          {/* Gene Groups */}
          {filteredGroups.map((group, idx) => (
            <GeneSection key={group.gene} group={group} rank={idx + 1} onViewDetails={handleViewDetails} />
          ))}

          {/* No results for filter */}
          {filteredGroups.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium mb-2">No Genes Match Filter</p>
                <p className="text-sm text-muted-foreground">
                  {tierFilter !== 'all'
                    ? `No genes with ${tierFilter} classification found.`
                    : 'Try a different gene name filter.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {status === 'success' && groupedByGene.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">No Publications Found</p>
            <p className="text-sm text-muted-foreground">
              No relevant literature found for the searched genes and phenotypes.
            </p>
          </CardContent>
        </Card>
      )}

      {(status === 'idle' || status === 'no_data') && (
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">Waiting for Phenotype Matching</p>
            <p className="text-sm text-muted-foreground">
              Literature search will run automatically after phenotype matching completes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
