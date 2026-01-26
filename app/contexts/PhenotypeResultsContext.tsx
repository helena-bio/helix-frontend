/**
 * Matched Phenotype Context - DuckDB Backed
 *
 * Uses session-based phenotype matching API that:
 * 1. Reads variants directly from DuckDB (no HTTP transfer)
 * 2. Saves results to DuckDB (persistent across sessions)
 * 3. Auto-loads existing results on mount
 *
 * Flow:
 * - Mount: Check if results exist in DuckDB, load if available
 * - User clicks "Run": Call session matching API, saves to DuckDB
 * - Navigate away & back: Results auto-load from DuckDB
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
import {
  runSessionPhenotypeMatching,
  getMatchingResults,
  type SessionMatchResult,
} from '@/lib/api/hpo'

// ============================================================================
// TYPES
// ============================================================================

export type MatchingStatus = 'idle' | 'loading' | 'pending' | 'success' | 'error' | 'no_phenotypes'

export interface GeneAggregatedResult {
  gene_symbol: string
  rank: number
  best_clinical_score: number
  best_phenotype_score: number
  best_tier: string
  variant_count: number
  matched_hpo_terms: string[]
  variants: SessionMatchResult[]
}

interface PhenotypeResultsContextValue {
  // Status
  status: MatchingStatus
  isLoading: boolean
  error: Error | null

  // Aggregated results by gene (sorted by clinical priority)
  aggregatedResults: GeneAggregatedResult[] | null

  // Actions - Returns results directly for immediate use
  runMatching: (patientHpoIds: string[]) => Promise<GeneAggregatedResult[]>
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
function aggregateResultsByGene(results: SessionMatchResult[]): GeneAggregatedResult[] {
  const geneMap = new Map<string, {
    variants: SessionMatchResult[]
    bestClinicalScore: number
    bestPhenotypeScore: number
    bestTier: string
    matchedTerms: Set<string>
  }>()

  results.forEach((result) => {
    const geneSymbol = result.gene_symbol || 'Unknown'

    if (!geneMap.has(geneSymbol)) {
      geneMap.set(geneSymbol, {
        variants: [],
        bestClinicalScore: result.clinical_priority_score,
        bestPhenotypeScore: result.phenotype_match_score,
        bestTier: result.clinical_tier,
        matchedTerms: new Set(),
      })
    }

    const geneData = geneMap.get(geneSymbol)!
    geneData.variants.push(result)

    // Track best scores
    if (result.clinical_priority_score > geneData.bestClinicalScore) {
      geneData.bestClinicalScore = result.clinical_priority_score
      geneData.bestTier = result.clinical_tier
    }
    geneData.bestPhenotypeScore = Math.max(geneData.bestPhenotypeScore, result.phenotype_match_score)

    // Collect matched HPO terms
    result.individual_matches.forEach(match => {
      if (match.similarity_score > 0.5 && match.patient_hpo_name) {
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

const PhenotypeResultsContext = createContext<PhenotypeResultsContextValue | undefined>(undefined)

interface PhenotypeResultsProviderProps {
  sessionId: string | null
  children: ReactNode
}

export function PhenotypeResultsProvider({ sessionId, children }: PhenotypeResultsProviderProps) {
  // State
  const [status, setStatus] = useState<MatchingStatus>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [aggregatedResults, setAggregatedResults] = useState<GeneAggregatedResult[] | null>(null)
  const [tier1Count, setTier1Count] = useState(0)
  const [tier2Count, setTier2Count] = useState(0)
  const [tier3Count, setTier3Count] = useState(0)
  const [tier4Count, setTier4Count] = useState(0)
  const [variantsAnalyzed, setVariantsAnalyzed] = useState(0)

  // Refs for tracking
  const currentSessionId = useRef<string | null>(null)
  const hasLoadedResults = useRef(false)

  // Load existing results from DuckDB when session changes
  useEffect(() => {
    if (!sessionId || sessionId === currentSessionId.current) return

    console.log('[PhenotypeResultsContext] Session changed, checking for existing results:', sessionId)
    currentSessionId.current = sessionId
    hasLoadedResults.current = false
    setAggregatedResults(null)
    setStatus('loading')
    setError(null)

    // Try to load existing results from DuckDB
    getMatchingResults(sessionId)
      .then((response) => {
        console.log('[PhenotypeResultsContext] Loaded existing results from DuckDB:', response.results.length)

        // Store tier counts
        setTier1Count(response.tier_1_count)
        setTier2Count(response.tier_2_count)
        setTier3Count(response.tier_3_count)
        setTier4Count(response.tier_4_count)
        setVariantsAnalyzed(response.variants_analyzed)

        // Aggregate by gene
        if (response.results.length > 0) {
          const aggregated = aggregateResultsByGene(response.results)
          console.log('[PhenotypeResultsContext] Aggregated genes:', aggregated.length)
          setAggregatedResults(aggregated)
          setStatus('success')
        } else {
          setAggregatedResults(null)
          setStatus('idle')
        }

        hasLoadedResults.current = true
      })
      .catch((err) => {
        // 404 is expected if no results exist yet
        if (err.message.includes('404') || err.message.includes('No phenotype matching results')) {
          console.log('[PhenotypeResultsContext] No existing results found (expected)')
          setStatus('idle')
        } else {
          console.error('[PhenotypeResultsContext] Failed to load results:', err)
          setError(err)
          setStatus('error')
        }
        hasLoadedResults.current = true
      })
  }, [sessionId])

  // ARCHITECTURAL FIX: Run matching and return results directly
  const runMatching = useCallback(async (patientHpoIds: string[]): Promise<GeneAggregatedResult[]> => {
    console.log('[PhenotypeResultsContext] runMatching called')
    console.log('  sessionId:', sessionId)
    console.log('  patientHpoIds:', patientHpoIds)

    if (!sessionId) {
      console.warn('[PhenotypeResultsContext] Cannot run matching - no session')
      return []
    }

    if (patientHpoIds.length === 0) {
      console.warn('[PhenotypeResultsContext] No phenotypes provided')
      setStatus('no_phenotypes')
      return []
    }

    setStatus('pending')
    setError(null)

    try {
      // Call session-based matching API (reads from DuckDB, saves results)
      console.log('[PhenotypeResultsContext] Calling session matching API...')
      const runResponse = await runSessionPhenotypeMatching({
        sessionId,
        patientHpoIds,
      })

      console.log('[PhenotypeResultsContext] Matching complete:', runResponse)

      if (runResponse.variants_with_hpo === 0) {
        console.warn('[PhenotypeResultsContext] No variants with HPO annotations')
        setStatus('success')
        setAggregatedResults(null)
        setTier1Count(0)
        setTier2Count(0)
        setTier3Count(0)
        setTier4Count(0)
        setVariantsAnalyzed(0)
        return []
      }

      // Fetch results from DuckDB (they were just saved by the API)
      const resultsResponse = await getMatchingResults(sessionId)

      // Store tier counts
      setTier1Count(resultsResponse.tier_1_count)
      setTier2Count(resultsResponse.tier_2_count)
      setTier3Count(resultsResponse.tier_3_count)
      setTier4Count(resultsResponse.tier_4_count)
      setVariantsAnalyzed(resultsResponse.variants_analyzed)

      // Aggregate by gene
      let aggregated: GeneAggregatedResult[] = []
      if (resultsResponse.results.length > 0) {
        aggregated = aggregateResultsByGene(resultsResponse.results)
        console.log('[PhenotypeResultsContext] Aggregated genes:', aggregated.length)
        setAggregatedResults(aggregated)
      } else {
        setAggregatedResults(null)
      }

      setStatus('success')
      
      // RETURN results directly for immediate use by caller
      return aggregated
    } catch (err) {
      console.error('[PhenotypeResultsContext] Matching failed:', err)
      setError(err as Error)
      setStatus('error')
      return []
    }
  }, [sessionId])

  // Clear results
  const clearResults = useCallback(() => {
    setAggregatedResults(null)
    setStatus('idle')
    setError(null)
    setTier1Count(0)
    setTier2Count(0)
    setTier3Count(0)
    setTier4Count(0)
    setVariantsAnalyzed(0)
  }, [])

  // Computed values
  const value = useMemo<PhenotypeResultsContextValue>(() => ({
    status,
    isLoading: status === 'pending' || status === 'loading',
    error,
    aggregatedResults,
    runMatching,
    clearResults,
    totalGenes: aggregatedResults?.length || 0,
    tier1Count,
    tier2Count,
    tier3Count,
    tier4Count,
    variantsAnalyzed,
  }), [
    status,
    error,
    aggregatedResults,
    runMatching,
    clearResults,
    tier1Count,
    tier2Count,
    tier3Count,
    tier4Count,
    variantsAnalyzed,
  ])

  return (
    <PhenotypeResultsContext.Provider value={value}>
      {children}
    </PhenotypeResultsContext.Provider>
  )
}

export function usePhenotypeResults(): PhenotypeResultsContextValue {
  const context = useContext(PhenotypeResultsContext)
  if (!context) {
    throw new Error('usePhenotypeResults must be used within PhenotypeResultsProvider')
  }
  return context
}
