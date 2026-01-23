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
 * - Clinical tier badges from phenotype matching
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLiterature } from '@/contexts/LiteratureContext'
import { getPubMedUrl, getPMCUrl, formatAuthors } from '@/lib/api/literature'
import type { PublicationResult, GenePublicationGroup } from '@/types/literature.types'

interface LiteratureMatchingViewProps {
  sessionId: string
}

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
 * Handles both short format (T1, T2) and full format (Tier 1 - Actionable)
 */
const getTierColor = (tier: string) => {
  const tierLower = tier.toLowerCase()
  if (tierLower.includes('1') || tierLower.includes('actionable')) {
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
  if (tierLower.includes('1') || tierLower.includes('actionable')) return 'T1'
  if (tierLower.includes('2') || tierLower.includes('potentially')) return 'T2'
  if (tierLower.includes('3') || tierLower.includes('uncertain')) return 'T3'
  if (tierLower.includes('4') || tierLower.includes('unlikely')) return 'T4'
  return tier
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function PublicationCard({ publication }: { publication: PublicationResult }) {
  const [isExpanded, setIsExpanded] = useState(false)

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
              onClick={() => window.open(getPubMedUrl(publication.pmid), '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              PubMed
            </Button>
            {publication.pmc_id && (
              <Button
                variant="outline"
                size="sm"
                className="text-md"
                onClick={() => { const url = getPMCUrl(publication.pmc_id); if (url) window.open(url, '_blank') }}
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

function GeneSection({ group, rank }: { group: GenePublicationGroup; rank: number }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Grid layout for consistent alignment */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
          {/* Left: Rank + Gene + Tier + Publications */}
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
          </div>

          {/* Center: Phenotype rank */}
          <div>
            {group.phenotypeRank && (
              <p className="text-sm text-muted-foreground">
                Phenotype Matching Rank: #{group.phenotypeRank}
              </p>
            )}
          </div>

          {/* Right: Scores + Evidence counts + Chevron - Grid aligned */}
          <div className="grid grid-cols-[60px_130px_auto_auto_20px] items-center gap-1">
            {/* Combined score - fixed width */}
            <Badge className={`text-sm justify-center ${getCombinedScoreColor(group.combinedScore)}`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {(group.combinedScore * 100).toFixed(0)}%
            </Badge>
            {/* Lit/Clin breakdown - fixed width */}
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Lit: {(group.bestScore * 100).toFixed(0)}%
              {group.clinicalScore !== undefined && ` / Clin: ${group.clinicalScore.toFixed(0)}`}
            </span>
            {/* Strong count - fixed width */}
            <div className="w-20">
              {group.strongCount > 0 && (
                <Badge variant="outline" className="text-sm bg-green-100 text-green-900 border-green-300 w-full justify-center">
                  {group.strongCount} Strong
                </Badge>
              )}
            </div>
            {/* Moderate count - fixed width */}
            <div className="w-24">
              {group.moderateCount > 0 && (
                <Badge variant="outline" className="text-sm bg-blue-100 text-blue-900 border-blue-300 w-full justify-center">
                  {group.moderateCount} Moderate
                </Badge>
              )}
            </div>
            {/* Chevron */}
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3">
          {group.publications.map((pub) => (
            <PublicationCard key={pub.pmid} publication={pub} />
          ))}
        </CardContent>
      )}
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LiteratureMatchingView({ sessionId }: LiteratureMatchingViewProps) {
  const [geneFilter, setGeneFilter] = useState('')

  // Context
  const {
    status,
    error,
    totalResults,
    groupedByGene,
    strongCount,
    moderateCount,
    supportingCount,
    weakCount,
  } = useLiterature()

  // Filter groups by gene name
  const filteredGroups = useMemo(() => {
    if (!geneFilter) return groupedByGene
    const filter = geneFilter.toLowerCase()
    return groupedByGene.filter(g => g.gene.toLowerCase().includes(filter))
  }, [groupedByGene, geneFilter])

  return (
    <div className="p-6 space-y-6">
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

      {/* Summary Cards */}
      {status === 'success' && (
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="py-1.5 px-3 text-center">
              <p className="text-ml font-bold">{totalResults}</p>
              <p className="text-base font-semibold text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-1.5 px-3 text-center">
              <p className="text-ml font-bold text-green-900">{strongCount}</p>
              <p className="text-base font-semibold text-green-700">Strong</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-1.5 px-3 text-center">
              <p className="text-ml font-bold text-blue-900">{moderateCount}</p>
              <p className="text-base font-semibold text-blue-700">Moderate</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="py-1.5 px-3 text-center">
              <p className="text-ml font-bold text-yellow-900">{supportingCount}</p>
              <p className="text-base font-semibold text-yellow-700">Supporting</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="py-1.5 px-3 text-center">
              <p className="text-ml font-bold text-gray-700">{weakCount}</p>
              <p className="text-base font-semibold text-gray-600">Weak</p>
            </CardContent>
          </Card>
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
            </span>
          </div>

          {/* Scoring explanation */}
          <p className="text-md text-muted-foreground">
            Sorted by Combined Score = 60% Clinical Priority (from Phenotype Matching) + 40% Literature Relevance
          </p>

          {/* Gene Groups */}
          {filteredGroups.map((group, idx) => (
            <GeneSection key={group.gene} group={group} rank={idx + 1} />
          ))}
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
