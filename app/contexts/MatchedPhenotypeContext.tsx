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
import { useClinicalProfileContext } from './ClinicalProfileContext'
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

interface MatchedPhenotypeContextValue {
  // Status
  status: MatchingStatus
  isLoading: boolean
  error: Error | null

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

const MatchedPhenotypeContext = createContext<MatchedPhenotypeContextValue | undefined>(undefined)

interface MatchedPhenotypeProviderProps {
  sessionId: string | null
  children: ReactNode
}

export function MatchedPhenotypeProvider({ sessionId, children }: MatchedPhenotypeProviderProps) {
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

  // Dependencies
  const { hpoTerms } = useClinicalProfileContext()
  // Get HPO terms from phenotype context
  const patientHpoIds = useMemo(() => {
    return hpoTerms.map(t => t.hpo_id)
  }, [hpoTerms])

  // Load existing results from DuckDB when session changes
  useEffect(() => {
    if (!sessionId || sessionId === currentSessionId.current) return

    console.log('[MatchedPhenotypeContext] Session changed, checking for existing results:', sessionId)
    currentSessionId.current = sessionId
    hasLoadedResults.current = false
    setAggregatedResults(null)
    setStatus('loading')
    setError(null)

    // Try to load existing results from DuckDB
    getMatchingResults(sessionId)
      .then((response) => {
        console.log('[MatchedPhenotypeContext] Loaded existing results from DuckDB:', response.results.length)
        
        // Store tier counts
        setTier1Count(response.tier_1_count)
        setTier2Count(response.tier_2_count)
        setTier3Count(response.tier_3_count)
        setTier4Count(response.tier_4_count)
        setVariantsAnalyzed(response.variants_analyzed)

        // Aggregate by gene
        if (response.results.length > 0) {
          const aggregated = aggregateResultsByGene(response.results)
          console.log('[MatchedPhenotypeContext] Aggregated genes:', aggregated.length)
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
          console.log('[MatchedPhenotypeContext] No existing results found (expected)')
          setStatus('idle')
        } else {
          console.error('[MatchedPhenotypeContext] Failed to load results:', err)
          setError(err)
          setStatus('error')
        }
        hasLoadedResults.current = true
      })
  }, [sessionId])

  // Run matching (manual trigger)
  const runMatching = useCallback(async () => {
    console.log('[MatchedPhenotypeContext] runMatching called')
    console.log('  sessionId:', sessionId)
    console.log('  patientHpoIds:', patientHpoIds)

    if (!sessionId) {
      console.warn('[MatchedPhenotypeContext] Cannot run matching - no session')
      return
    }

    if (patientHpoIds.length === 0) {
      console.warn('[MatchedPhenotypeContext] No phenotypes selected')
      setStatus('no_phenotypes')
      return
    }

    setStatus('pending')
    setError(null)

    try {
      // Call session-based matching API (reads from DuckDB, saves results)
      console.log('[MatchedPhenotypeContext] Calling session matching API...')
      const runResponse = await runSessionPhenotypeMatching({
        sessionId,
        patientHpoIds,
      })

      console.log('[MatchedPhenotypeContext] Matching complete:', runResponse)

      if (runResponse.variants_with_hpo === 0) {
        console.warn('[MatchedPhenotypeContext] No variants with HPO annotations')
        setStatus('success')
        setAggregatedResults(null)
        setTier1Count(0)
        setTier2Count(0)
        setTier3Count(0)
        setTier4Count(0)
        setVariantsAnalyzed(0)
        return
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
      if (resultsResponse.results.length > 0) {
        const aggregated = aggregateResultsByGene(resultsResponse.results)
        console.log('[MatchedPhenotypeContext] Aggregated genes:', aggregated.length)
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
  }, [sessionId, patientHpoIds])

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

  // Re-run when phenotypes change (only if we already have results)
  const prevHpoCount = useRef(patientHpoIds.length)
  useEffect(() => {
    if (prevHpoCount.current !== patientHpoIds.length && prevHpoCount.current > 0) {
      console.log('[MatchedPhenotypeContext] Phenotypes changed, re-running matching')
      prevHpoCount.current = patientHpoIds.length
      if (aggregatedResults && hasLoadedResults.current) {
        runMatching()
      }
    } else {
      prevHpoCount.current = patientHpoIds.length
    }
  }, [patientHpoIds.length, aggregatedResults, runMatching])

  // Computed values
  const value = useMemo<MatchedPhenotypeContextValue>(() => ({
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
