"use client"

/**
 * Matched Phenotype Context - Streaming Architecture
 *
 * NEW WORKFLOW (matching Variants streaming):
 * 1. runMatching() - triggers backend computation, saves to DuckDB
 * 2. loadAllPhenotypeResults() - streams aggregated results by gene
 * 3. Backend does aggregation (not frontend!)
 * 4. Progressive loading with progress tracking
 *
 * Flow:
 * - ClinicalAnalysis Stage 1: runMatching() → loadAllPhenotypeResults()
 * - Results stream directly to context (pre-aggregated by gene)
 * - Views read from pre-loaded context data
 * - Auto-cleanup when session becomes null
 */

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
  type SessionMatchResult,
} from '@/lib/api/hpo'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.helixinsight.bio'

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
  loadProgress: number
  error: Error | null

  // Aggregated results by gene (sorted by clinical priority)
  aggregatedResults: GeneAggregatedResult[] | null

  // Actions
  runMatching: (patientHpoIds: string[]) => Promise<void>
  loadAllPhenotypeResults: (sessionId: string) => Promise<void>
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
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [aggregatedResults, setAggregatedResults] = useState<GeneAggregatedResult[] | null>(null)
  const [tier1Count, setTier1Count] = useState(0)
  const [tier2Count, setTier2Count] = useState(0)
  const [tier3Count, setTier3Count] = useState(0)
  const [tier4Count, setTier4Count] = useState(0)
  const [variantsAnalyzed, setVariantsAnalyzed] = useState(0)

  // Refs for tracking
  const currentSessionId = useRef<string | null>(null)

  // Auto-cleanup when session changes or becomes null
  useEffect(() => {
    // Case 1: Session cleared - cleanup all data
    if (sessionId === null) {
      console.log('[PhenotypeResultsContext] Session cleared - resetting phenotype results')
      currentSessionId.current = null
      setAggregatedResults(null)
      setStatus('idle')
      setError(null)
      setLoadProgress(0)
      setTier1Count(0)
      setTier2Count(0)
      setTier3Count(0)
      setTier4Count(0)
      setVariantsAnalyzed(0)
      return
    }

    // Case 2: Same session - do nothing
    if (sessionId === currentSessionId.current) return

    // Case 3: New session - clear old data
    console.log('[PhenotypeResultsContext] Session changed - clearing old data')
    currentSessionId.current = sessionId
    setAggregatedResults(null)
    setStatus('idle')
    setError(null)
    setLoadProgress(0)
    setTier1Count(0)
    setTier2Count(0)
    setTier3Count(0)
    setTier4Count(0)
    setVariantsAnalyzed(0)
  }, [sessionId])

  // Run phenotype matching (trigger backend computation only)
  const runMatching = useCallback(async (patientHpoIds: string[]): Promise<void> => {
    console.log('[PhenotypeResultsContext] runMatching called')
    console.log('  sessionId:', sessionId)
    console.log('  patientHpoIds:', patientHpoIds)

    if (!sessionId) {
      console.warn('[PhenotypeResultsContext] Cannot run matching - no session')
      return
    }

    if (patientHpoIds.length === 0) {
      console.warn('[PhenotypeResultsContext] No phenotypes provided')
      setStatus('no_phenotypes')
      return
    }

    setStatus('pending')
    setError(null)

    try {
      // Call session-based matching API (computes & saves to DuckDB)
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
        return
      }

      // NOTE: Don't fetch results here - caller will call loadAllPhenotypeResults()
      setStatus('success')
    } catch (err) {
      console.error('[PhenotypeResultsContext] Matching failed:', err)
      setError(err as Error)
      setStatus('error')
      throw err
    }
  }, [sessionId])

  // Load all phenotype results via streaming (like variants!)
  const loadAllPhenotypeResults = useCallback(async (sessionId: string) => {
    setStatus('loading')
    setLoadProgress(0)
    setError(null)
    setAggregatedResults(null)

    try {
      console.log('[PhenotypeResultsContext] Starting streaming load...')

      const response = await fetch(
        `${API_BASE_URL}/phenotype/api/sessions/${sessionId}/phenotype/stream/by-gene`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      console.log('[PhenotypeResultsContext] Response headers:', {
        contentType: response.headers.get('content-type'),
        contentEncoding: response.headers.get('content-encoding'),
      })

      // Browser automatically decompresses based on Content-Encoding header
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader()

      let buffer = ''
      let loadedGenes: GeneAggregatedResult[] = []
      let totalGenesCount = 0

      while (true) {
        const { value, done } = await reader.read()

        if (done) break

        buffer += value
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const parsed = JSON.parse(line)

            if (parsed.type === 'metadata') {
              totalGenesCount = parsed.total_genes
              console.log(`[PhenotypeResultsContext] Streaming ${totalGenesCount} genes...`)
              
              // Store tier counts from metadata
              setTier1Count(parsed.tier_1_count)
              setTier2Count(parsed.tier_2_count)
              setTier3Count(parsed.tier_3_count)
              setTier4Count(parsed.tier_4_count)
              setVariantsAnalyzed(parsed.total_variants)
            } else if (parsed.type === 'gene') {
              loadedGenes.push(parsed.data)

              // Update progress every 50 genes
              if (loadedGenes.length % 50 === 0) {
                const progress = totalGenesCount > 0
                  ? Math.round((loadedGenes.length / totalGenesCount) * 100)
                  : 0
                setLoadProgress(progress)

                // Update state in batches for performance
                setAggregatedResults([...loadedGenes])
              }
            } else if (parsed.type === 'complete') {
              console.log(`[PhenotypeResultsContext] Streaming complete: ${parsed.total_streamed} genes loaded`)
            }
          } catch (e) {
            console.warn('[PhenotypeResultsContext] Failed to parse line:', e)
          }
        }
      }

      // Final update
      setAggregatedResults(loadedGenes)
      setLoadProgress(100)
      setStatus('success')

      console.log(`[PhenotypeResultsContext] All data loaded: ${loadedGenes.length} genes`)

    } catch (err) {
      console.error('[PhenotypeResultsContext] Streaming failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
      throw err
    }
  }, [])

  // Clear results
  const clearResults = useCallback(() => {
    setAggregatedResults(null)
    setStatus('idle')
    setError(null)
    setLoadProgress(0)
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
    loadProgress,
    error,
    aggregatedResults,
    runMatching,
    loadAllPhenotypeResults,
    clearResults,
    totalGenes: aggregatedResults?.length || 0,
    tier1Count,
    tier2Count,
    tier3Count,
    tier4Count,
    variantsAnalyzed,
  }), [
    status,
    loadProgress,
    error,
    aggregatedResults,
    runMatching,
    loadAllPhenotypeResults,
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
