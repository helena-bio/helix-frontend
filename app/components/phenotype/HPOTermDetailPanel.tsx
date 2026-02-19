"use client"

/**
 * HPOTermDetailPanel - Full detail view for a single HPO term.
 *
 * Shows term metadata (definition, synonyms) and matched genes
 * from the current session's phenotype results.
 *
 * Design: Stripe-style data-rich layout. text-base (14px) for content.
 */

import { useMemo } from 'react'
import { ArrowLeft, Dna, TrendingUp, ExternalLink, BookOpen, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHPOTerm } from '@/hooks/queries'
import { usePhenotypeResults } from '@/contexts/PhenotypeResultsContext'
import { getTierColor, getScoreColor, formatTierDisplay } from '@/components/shared'

interface HPOTermDetailPanelProps {
  hpoId: string
  hpoName: string
  onBack: () => void
}

export function HPOTermDetailPanel({ hpoId, hpoName, onBack }: HPOTermDetailPanelProps) {
  const { data: term, isLoading } = useHPOTerm(hpoId)
  const { aggregatedResults } = usePhenotypeResults()

  // Find all genes that matched this specific HPO term
  const matchedGenes = useMemo(() => {
    if (!aggregatedResults) return []

    const results: {
      gene_symbol: string
      best_clinical_score: number
      best_tier: string
      similarity_score: number
      rank: number
    }[] = []

    for (const gene of aggregatedResults) {
      if (!gene.variants) continue
      let bestSimilarity = 0

      for (const variant of gene.variants) {
        if (!variant.individual_matches) continue
        for (const match of variant.individual_matches) {
          if (match.patient_hpo_id === hpoId && match.similarity_score > bestSimilarity) {
            bestSimilarity = match.similarity_score
          }
        }
      }

      if (bestSimilarity > 0) {
        results.push({
          gene_symbol: gene.gene_symbol,
          best_clinical_score: gene.best_clinical_score,
          best_tier: gene.best_tier,
          similarity_score: bestSimilarity,
          rank: gene.rank,
        })
      }
    }

    return results.sort((a, b) => b.similarity_score - a.similarity_score)
  }, [aggregatedResults, hpoId])

  // Clean definition text (strip surrounding quotes if present)
  const cleanDefinition = useMemo(() => {
    if (!term?.definition) return null
    return term.definition.replace(/^"(.*)"(\s*\[.*\])?$/, '$1').trim()
  }, [term?.definition])

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-3xl">

        {/* Back */}
        <Button variant="ghost" size="sm" onClick={onBack} className="text-base -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Phenotype Matching
        </Button>

        {/* ================================================================
            HEADER
        ================================================================ */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm font-mono text-muted-foreground">
              {hpoId}
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{hpoName}</h1>
        </div>

        {/* ================================================================
            DEFINITION
        ================================================================ */}
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-medium">Definition</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : cleanDefinition ? (
              <p className="text-base text-foreground leading-relaxed">{cleanDefinition}</p>
            ) : (
              <p className="text-base text-muted-foreground italic">No definition available.</p>
            )}
          </CardContent>
        </Card>

        {/* ================================================================
            SYNONYMS
        ================================================================ */}
        {(isLoading || (term?.synonyms && term.synonyms.length > 0)) && (
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-medium">Synonyms</span>
                {term?.synonyms && (
                  <span className="text-sm text-muted-foreground ml-1">
                    {term.synonyms.length}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 py-4">
              {isLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-32" />)}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {term!.synonyms!.map((syn, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm font-normal">
                      {syn}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            MATCHED GENES
        ================================================================ */}
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <div className="flex items-center gap-2">
              <Dna className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-medium">Matched Genes</span>
              <span className="text-sm text-muted-foreground ml-1">
                {matchedGenes.length > 0
                  ? `${matchedGenes.length} gene${matchedGenes.length !== 1 ? 's' : ''}`
                  : aggregatedResults
                    ? 'none'
                    : 'expand gene cards to load'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-0 py-0">
            {matchedGenes.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-base text-muted-foreground">
                  {aggregatedResults
                    ? 'No genes with variants matching this term. Expand gene cards first to load variant data.'
                    : 'Phenotype results not loaded.'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {matchedGenes.map((gene) => (
                  <div
                    key={gene.gene_symbol}
                    className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
                  >
                    {/* Left: rank + gene + tier */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-8 tabular-nums">
                        #{gene.rank}
                      </span>
                      <span className="text-base font-medium w-16">
                        {gene.gene_symbol}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-sm ${getTierColor(gene.best_tier)}`}
                      >
                        {formatTierDisplay(gene.best_tier)}
                      </Badge>
                    </div>

                    {/* Right: similarity + clinical score */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Similarity</p>
                        <p className="text-base font-semibold tabular-nums">
                          {(gene.similarity_score * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Clinical</p>
                        <Badge className={`text-sm ${getScoreColor(gene.best_clinical_score)}`}>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {gene.best_clinical_score.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ================================================================
            EXTERNAL LINK
        ================================================================ */}
        <div className="flex items-center gap-2 pb-4">
          
            href={`https://hpo.jax.org/app/browse/term/${hpoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on HPO Browser
          </a>
        </div>

      </div>
    </div>
  )
}
