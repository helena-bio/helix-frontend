/**
 * Matched Phenotype Context
 *
 * Caches phenotype matching results after analysis completes.
 * Auto-runs matching when:
 * 1. Session has variants (analysis complete)
 * 2. Patient has HPO terms defined
 *
 * Fetches ALL variants using pagination (backend limit is 1000 per page).
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
  useRef,
  type ReactNode
} from 'react'
import { usePhenotypeContext } from './PhenotypeContext'
import { getVariants } from '@/lib/api/variant-analysis'
import {
  matchVariantPhenotypes,
  type MatchVariantPhenotypesResponse,
  type VariantMatchResult,
} from '@/lib/api/hpo'

// ============================================================================
// TYPES
// ============================================================================

export type MatchingStatus = 'idle' | 'loading_variants' | 'pending' | 'success' | 'error' | 'no_phenotypes'

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
 * Fetch ALL variants using pagination
 * Backend limit is 1000 per page
 */
async function fetchAllVariants(sessionId: string): Promise<any[]> {
  const PAGE_SIZE = 1000
  const allVariants: any[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const response = await getVariants(sessionId, { page, page_size: PAGE_SIZE })
    
    if (response.variants && response.variants.length > 0) {
      allVariants.push(...response.variants)
    }

    hasMore = response.has_next_page
    page++

    // Safety limit - max 50 pages (50,000 variants)
    if (page > 50) {
      console.warn('[MatchedPhenotypeContext] Reached max page limit')
      break
    }
  }

  return allVariants
}

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
  const [allVariants, setAllVariants] = useState<any[] | null>(null)
  
  // Refs for tracking
  const hasAutoRun = useRef(false)
  const currentSessionId = useRef<string | null>(null)

  // Dependencies
  const { phenotype } = usePhenotypeContext()

  // Get HPO terms from phenotype context
  const patientHpoIds = useMemo(() => {
    return phenotype?.hpo_terms.map(t => t.hpo_id) || []
  }, [phenotype])

  // Load all variants when session changes
  useEffect(() => {
    if (!sessionId || sessionId === currentSessionId.current) return

    currentSessionId.current = sessionId
    hasAutoRun.current = false
    setAllVariants(null)
    setMatchResponse(null)
    setAggregatedResults(null)
    setStatus('loading_variants')
    setError(null)

    // Fetch all variants
    fetchAllVariants(sessionId)
      .then((variants) => {
        setAllVariants(variants)
        setStatus('idle')
      })
      .catch((err) => {
        console.error('[MatchedPhenotypeContext] Failed to load variants:', err)
        setError(err)
        setStatus('error')
      })
  }, [sessionId])

  // Run matching
  const runMatching = useCallback(async () => {
    if (!sessionId || !allVariants?.length || patientHpoIds.length === 0) {
      if (patientHpoIds.length === 0) {
        setStatus('no_phenotypes')
      }
      return
    }

    setStatus('pending')
    setError(null)

    try {
      // Prepare variants with HPO data
      const variantsWithData = allVariants
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
  }, [sessionId, allVariants, patientHpoIds])

  // Clear results
  const clearResults = useCallback(() => {
    setMatchResponse(null)
    setAggregatedResults(null)
    setStatus('idle')
    setError(null)
    hasAutoRun.current = false
  }, [])

  // Auto-run matching when variants loaded and phenotypes exist
  useEffect(() => {
    if (hasAutoRun.current) return
    if (status === 'loading_variants') return
    if (!allVariants?.length) return
    if (patientHpoIds.length === 0) {
      setStatus('no_phenotypes')
      return
    }

    hasAutoRun.current = true
    runMatching()
  }, [status, allVariants, patientHpoIds, runMatching])

  // Re-run when phenotypes change (after initial auto-run)
  const prevHpoCount = useRef(patientHpoIds.length)
  useEffect(() => {
    if (prevHpoCount.current !== patientHpoIds.length) {
      prevHpoCount.current = patientHpoIds.length
      if (hasAutoRun.current && allVariants?.length) {
        runMatching()
      }
    }
  }, [patientHpoIds.length, allVariants, runMatching])

  // Computed values
  const value = useMemo<MatchedPhenotypeContextValue>(() => ({
    status,
    isLoading: status === 'pending' || status === 'loading_variants',
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
