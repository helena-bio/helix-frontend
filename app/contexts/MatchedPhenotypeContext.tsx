/**
 * Matched Phenotype Context
 *
 * Caches phenotype matching results after analysis completes.
 * Auto-runs matching when:
 * 1. Session has variants (analysis complete)
 * 2. Patient has HPO terms defined
 *
 * Results are immediately available when user opens Phenotype Matching module.
 */
'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode
} from 'react'
import { useVariants } from '@/hooks/queries/use-variant-analysis-queries'
import { usePhenotypeContext } from './PhenotypeContext'
import {
  matchVariantPhenotypes,
  type MatchVariantPhenotypesResponse,
  type VariantMatchResult,
} from '@/lib/api/hpo'

// ============================================================================
// TYPES
// ============================================================================

export type MatchingStatus = 'idle' | 'pending' | 'success' | 'error' | 'no_phenotypes'

export interface GeneAggregatedResult {
  gene_symbol: string
  rank: number
  best_clinical_score: number
  best_phenotype_score: number
  best_tier: string
  variant_count: number
  matched_hpo_terms: string[]
  variants: VariantMatchResult[]
}

interface MatchedPhenotypeContextValue {
  // Status
  status: MatchingStatus
  isLoading: boolean
  error: Error | null

  // Raw results from API
  matchResponse: MatchVariantPhenotypesResponse | null

  // Aggregated results by gene (sorted by clinical priority)
  aggregatedResults: GeneAggregatedResult[] | null

  // Actions
  runMatching: () => Promise<void>
  clearResults: () => void

  // Computed
  totalGenes: number
  tier1Count: number
  tier2Count: number
  tier3Count: number
  tier4Count: number
  variantsAnalyzed: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Aggregate results by gene, using best clinical score
 */
function aggregateResultsByGene(results: VariantMatchResult[]): GeneAggregatedResult[] {
  const geneMap = new Map<string, {
    variants: VariantMatchResult[]
    bestClinicalScore: number
    bestPhenotypeScore: number
    bestTier: string
    matchedTerms: Set<string>
  }>()

  results.forEach((result) => {
    if (!geneMap.has(result.gene_symbol)) {
      geneMap.set(result.gene_symbol, {
        variants: [],
        bestClinicalScore: result.clinical_priority_score,
        bestPhenotypeScore: result.phenotype_match_score,
        bestTier: result.clinical_tier,
        matchedTerms: new Set(),
      })
    }

    const geneData = geneMap.get(result.gene_symbol)!
    geneData.variants.push(result)

    // Track best scores
    if (result.clinical_priority_score > geneData.bestClinicalScore) {
      geneData.bestClinicalScore = result.clinical_priority_score
      geneData.bestTier = result.clinical_tier
    }
    geneData.bestPhenotypeScore = Math.max(geneData.bestPhenotypeScore, result.phenotype_match_score)

    // Collect matched HPO terms
    result.individual_matches.forEach(match => {
      if (match.similarity_score > 0.5) {
        geneData.matchedTerms.add(match.patient_hpo_name)
      }
    })
  })

  return Array.from(geneMap.entries())
    .map(([gene_symbol, data]) => ({
      gene_symbol,
      rank: 0,
      best_clinical_score: data.bestClinicalScore,
      best_phenotype_score: data.bestPhenotypeScore,
      best_tier: data.bestTier,
      variant_count: data.variants.length,
      matched_hpo_terms: Array.from(data.matchedTerms),
      variants: data.variants.sort((a, b) => b.clinical_priority_score - a.clinical_priority_score),
    }))
    .sort((a, b) => b.best_clinical_score - a.best_clinical_score)
    .map((item, idx) => ({ ...item, rank: idx + 1 }))
}

// ============================================================================
// CONTEXT
// ============================================================================

const MatchedPhenotypeContext = createContext<MatchedPhenotypeContextValue | undefined>(undefined)

interface MatchedPhenotypeProviderProps {
  sessionId: string | null
  children: ReactNode
}

export function MatchedPhenotypeProvider({ sessionId, children }: MatchedPhenotypeProviderProps) {
  // State
  const [status, setStatus] = useState<MatchingStatus>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [matchResponse, setMatchResponse] = useState<MatchVariantPhenotypesResponse | null>(null)
  const [aggregatedResults, setAggregatedResults] = useState<GeneAggregatedResult[] | null>(null)
  const [hasAutoRun, setHasAutoRun] = useState(false)

  // Dependencies
  const { phenotype } = usePhenotypeContext()

  // Fetch variants (only those with HPO data for matching)
  const { data: variantsData, isLoading: variantsLoading } = useVariants(
    sessionId || '',
    { page: 1, page_size: 2000 },
    { enabled: !!sessionId }
  )

  // Get HPO terms from phenotype context
  const patientHpoIds = useMemo(() => {
    return phenotype?.hpo_terms.map(t => t.hpo_id) || []
  }, [phenotype])

  // Run matching
  const runMatching = useCallback(async () => {
    if (!sessionId || !variantsData?.variants?.length || patientHpoIds.length === 0) {
      if (patientHpoIds.length === 0) {
        setStatus('no_phenotypes')
      }
      return
    }

    setStatus('pending')
    setError(null)

    try {
      // Prepare variants with HPO data
      const variantsWithData = variantsData.variants
        .filter((v: any) => v.hpo_phenotypes)
        .map((v: any) => ({
          variant_idx: v.variant_idx,
          gene_symbol: v.gene_symbol || 'Unknown',
          hpo_ids: v.hpo_phenotypes?.split('; ').filter(Boolean) || [],
          acmg_class: v.acmg_class || null,
          impact: v.impact || null,
          gnomad_af: v.global_af || null,
          consequence: v.consequence || null,
        }))

      if (variantsWithData.length === 0) {
        setStatus('success')
        setMatchResponse(null)
        setAggregatedResults(null)
        return
      }

      // Call matching API
      const result = await matchVariantPhenotypes({
        patient_hpo_ids: patientHpoIds,
        variants: variantsWithData,
      })

      // Store results
      setMatchResponse(result)

      // Aggregate by gene
      if (result.results && result.results.length > 0) {
        const aggregated = aggregateResultsByGene(result.results)
        setAggregatedResults(aggregated)
      } else {
        setAggregatedResults(null)
      }

      setStatus('success')
    } catch (err) {
      console.error('[MatchedPhenotypeContext] Matching failed:', err)
      setError(err as Error)
      setStatus('error')
    }
  }, [sessionId, variantsData, patientHpoIds])

  // Clear results
  const clearResults = useCallback(() => {
    setMatchResponse(null)
    setAggregatedResults(null)
    setStatus('idle')
    setError(null)
    setHasAutoRun(false)
  }, [])

  // Auto-run matching when conditions are met
  useEffect(() => {
    // Skip if already ran, loading, or no data
    if (hasAutoRun || variantsLoading || !sessionId) return

    // Skip if no phenotypes
    if (patientHpoIds.length === 0) {
      setStatus('no_phenotypes')
      return
    }

    // Skip if no variants yet
    if (!variantsData?.variants?.length) return

    // Run matching automatically
    setHasAutoRun(true)
    runMatching()
  }, [hasAutoRun, variantsLoading, sessionId, patientHpoIds, variantsData, runMatching])

  // Reset when session changes
  useEffect(() => {
    clearResults()
  }, [sessionId, clearResults])

  // Re-run when phenotypes change
  useEffect(() => {
    if (hasAutoRun && patientHpoIds.length > 0) {
      // Phenotypes changed, re-run matching
      runMatching()
    }
  }, [patientHpoIds.length])

  // Computed values
  const value = useMemo<MatchedPhenotypeContextValue>(() => ({
    status,
    isLoading: status === 'pending' || variantsLoading,
    error,
    matchResponse,
    aggregatedResults,
    runMatching,
    clearResults,
    totalGenes: aggregatedResults?.length || 0,
    tier1Count: matchResponse?.tier_1_count || 0,
    tier2Count: matchResponse?.tier_2_count || 0,
    tier3Count: matchResponse?.tier_3_count || 0,
    tier4Count: matchResponse?.tier_4_count || 0,
    variantsAnalyzed: matchResponse?.variants_analyzed || 0,
  }), [
    status,
    variantsLoading,
    error,
    matchResponse,
    aggregatedResults,
    runMatching,
    clearResults,
  ])

  return (
    <MatchedPhenotypeContext.Provider value={value}>
      {children}
    </MatchedPhenotypeContext.Provider>
  )
}

export function useMatchedPhenotype(): MatchedPhenotypeContextValue {
  const context = useContext(MatchedPhenotypeContext)
  if (!context) {
    throw new Error('useMatchedPhenotype must be used within MatchedPhenotypeProvider')
  }
  return context
}
