"use client"

/**
 * Matched Phenotype Context - Summary-First Architecture
 *
 * WORKFLOW:
 * 1. runMatching() - triggers backend computation, saves to DuckDB
 * 2. loadAllPhenotypeResults() - streams lightweight gene SUMMARIES (~50KB)
 * 3. Individual variants loaded on-demand when user expands a gene
 *
 * Flow:
 * - ClinicalAnalysis Stage 1: runMatching() -> loadAllPhenotypeResults()
 * - Summaries stream instantly (<200ms)
 * - Gene expansion triggers DuckDB query (<50ms)
 * - Session cache: switching cases restores instantly (max 3 cached)
 *
 * 5-tier system with Incidental Findings:
 * - Tier 1: P/LP with phenotype match (confirmed relevant)
 * - Tier 2: VUS with strong evidence
 * - IF: P/LP without phenotype match (incidental/secondary finding)
 * - Tier 3: Uncertain
 * - Tier 4: Unlikely
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
  getPhenotypeGeneVariants,
  type SessionMatchResult,
} from '@/lib/api/hpo'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.helixinsight.bio'

const MAX_CACHED_SESSIONS = 3

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
  best_matched_terms: number
  total_patient_terms: number
  tier_1_count: number
  tier_2_count: number
  incidental_count: number
  tier_3_count: number
  tier_4_count: number
  // Lazy-loaded on expand
  variants?: SessionMatchResult[]
}

interface PhenotypeCacheEntry {
  aggregatedResults: GeneAggregatedResult[] | null
  tier1Count: number
  tier2Count: number
  incidentalFindingsCount: number
  tier3Count: number
  tier4Count: number
  variantsAnalyzed: number
}

interface PhenotypeResultsContextValue {
  status: MatchingStatus
  isLoading: boolean
  loadProgress: number
  error: Error | null
  aggregatedResults: GeneAggregatedResult[] | null
  runMatching: (patientHpoIds: string[]) => Promise<void>
  loadAllPhenotypeResults: (sessionId: string) => Promise<GeneAggregatedResult[]>
  loadPhenotypeGeneVariants: (sessionId: string, geneSymbol: string) => Promise<SessionMatchResult[]>
  clearResults: () => void
  totalGenes: number
  tier1Count: number
  tier2Count: number
  incidentalFindingsCount: number
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
  const [status, setStatus] = useState<MatchingStatus>('idle')
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [aggregatedResults, setAggregatedResults] = useState<GeneAggregatedResult[] | null>(null)
  const [tier1Count, setTier1Count] = useState(0)
  const [tier2Count, setTier2Count] = useState(0)
  const [incidentalFindingsCount, setIncidentalFindingsCount] = useState(0)
  const [tier3Count, setTier3Count] = useState(0)
  const [tier4Count, setTier4Count] = useState(0)
  const [variantsAnalyzed, setVariantsAnalyzed] = useState(0)

  const currentSessionId = useRef<string | null>(null)

  // Refs mirroring state for cache saves
  const aggregatedRef = useRef<GeneAggregatedResult[] | null>(null)
  const tier1Ref = useRef(0)
  const tier2Ref = useRef(0)
  const ifRef = useRef(0)
  const tier3Ref = useRef(0)
  const tier4Ref = useRef(0)
  const analyzedRef = useRef(0)

  useEffect(() => { aggregatedRef.current = aggregatedResults }, [aggregatedResults])
  useEffect(() => { tier1Ref.current = tier1Count }, [tier1Count])
  useEffect(() => { tier2Ref.current = tier2Count }, [tier2Count])
  useEffect(() => { ifRef.current = incidentalFindingsCount }, [incidentalFindingsCount])
  useEffect(() => { tier3Ref.current = tier3Count }, [tier3Count])
  useEffect(() => { tier4Ref.current = tier4Count }, [tier4Count])
  useEffect(() => { analyzedRef.current = variantsAnalyzed }, [variantsAnalyzed])

  const sessionCache = useRef<Map<string, PhenotypeCacheEntry>>(new Map())

  const saveToCache = useCallback((id: string, entry: PhenotypeCacheEntry) => {
    if (!entry.aggregatedResults || entry.aggregatedResults.length === 0) return

    sessionCache.current.set(id, entry)
    if (sessionCache.current.size > MAX_CACHED_SESSIONS) {
      const oldest = sessionCache.current.keys().next().value
      if (oldest) sessionCache.current.delete(oldest)
    }
  }, [])

  const getCurrentCacheEntry = useCallback((): PhenotypeCacheEntry => ({
    aggregatedResults: aggregatedRef.current,
    tier1Count: tier1Ref.current,
    tier2Count: tier2Ref.current,
    incidentalFindingsCount: ifRef.current,
    tier3Count: tier3Ref.current,
    tier4Count: tier4Ref.current,
    variantsAnalyzed: analyzedRef.current,
  }), [])

  const restoreFromCache = useCallback((entry: PhenotypeCacheEntry) => {
    setAggregatedResults(entry.aggregatedResults)
    setTier1Count(entry.tier1Count)
    setTier2Count(entry.tier2Count)
    setIncidentalFindingsCount(entry.incidentalFindingsCount)
    setTier3Count(entry.tier3Count)
    setTier4Count(entry.tier4Count)
    setVariantsAnalyzed(entry.variantsAnalyzed)
    setLoadProgress(100)
    setError(null)
    setStatus('success')
  }, [])

  const clearState = useCallback(() => {
    setAggregatedResults(null)
    setStatus('idle')
    setError(null)
    setLoadProgress(0)
    setTier1Count(0)
    setTier2Count(0)
    setIncidentalFindingsCount(0)
    setTier3Count(0)
    setTier4Count(0)
    setVariantsAnalyzed(0)
  }, [])

  // Auto-cleanup and cache management when session changes
  useEffect(() => {
    const prevId = currentSessionId.current

    if (sessionId === null) {
      if (prevId) saveToCache(prevId, getCurrentCacheEntry())
      console.log('[PhenotypeResultsContext] Session cleared - resetting phenotype results')
      currentSessionId.current = null
      clearState()
      return
    }

    if (sessionId === currentSessionId.current) return

    if (prevId) saveToCache(prevId, getCurrentCacheEntry())

    currentSessionId.current = sessionId

    const cached = sessionCache.current.get(sessionId)
    if (cached) {
      console.log(`[PhenotypeResultsContext] Cache hit for ${sessionId} - restoring`)
      sessionCache.current.delete(sessionId)
      sessionCache.current.set(sessionId, cached)
      restoreFromCache(cached)
      return
    }

    console.log(`[PhenotypeResultsContext] Cache miss for ${sessionId}`)
    clearState()
  }, [sessionId, saveToCache, getCurrentCacheEntry, restoreFromCache, clearState])

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
        setIncidentalFindingsCount(0)
        setTier3Count(0)
        setTier4Count(0)
        setVariantsAnalyzed(0)
        return
      }

      setStatus('success')
    } catch (err) {
      console.error('[PhenotypeResultsContext] Matching failed:', err)
      setError(err as Error)
      setStatus('error')
      throw err
    }
  }, [sessionId])

  // Load gene summaries (lightweight, no variants)
  const loadAllPhenotypeResults = useCallback(async (sid: string): Promise<GeneAggregatedResult[]> => {
    setStatus('loading')
    setLoadProgress(0)
    setError(null)
    setAggregatedResults(null)

    try {
      console.log('[PhenotypeResultsContext] Loading phenotype summaries...')

      const response = await fetch(
        `${API_BASE_URL}/phenotype/api/sessions/${sid}/phenotype/summaries`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

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
              console.log(`[PhenotypeResultsContext] Streaming ${totalGenesCount} gene summaries...`)
              setTier1Count(parsed.tier_1_count)
              setTier2Count(parsed.tier_2_count)
              setIncidentalFindingsCount(parsed.incidental_findings_count || 0)
              setTier3Count(parsed.tier_3_count)
              setTier4Count(parsed.tier_4_count)
              setVariantsAnalyzed(parsed.total_variants)
            } else if (parsed.type === 'gene') {
              loadedGenes.push(parsed.data)

              if (loadedGenes.length % 50 === 0) {
                const progress = totalGenesCount > 0
                  ? Math.round((loadedGenes.length / totalGenesCount) * 100)
                  : 0
                setLoadProgress(progress)
                setAggregatedResults([...loadedGenes])
              }
            } else if (parsed.type === 'complete') {
              console.log(`[PhenotypeResultsContext] Summaries complete: ${parsed.total_streamed} genes`)
            }
          } catch (e) {
            console.warn('[PhenotypeResultsContext] Failed to parse line:', e)
          }
        }
      }

      setAggregatedResults(loadedGenes)
      setLoadProgress(100)
      setStatus('success')

      console.log(`[PhenotypeResultsContext] Summaries loaded: ${loadedGenes.length} genes`)
      return loadedGenes

    } catch (err) {
      console.error('[PhenotypeResultsContext] Summaries load failed:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setStatus('error')
      throw err
    }
  }, [])

  // Load variants for a single gene on-demand
  const loadPhenotypeGeneVariants = useCallback(async (
    sid: string,
    geneSymbol: string
  ): Promise<SessionMatchResult[]> => {
    // Check if already loaded in current results
    const current = aggregatedRef.current
    if (current) {
      const gene = current.find(g => g.gene_symbol === geneSymbol)
      if (gene?.variants && gene.variants.length > 0) {
        return gene.variants
      }
    }

    console.log(`[PhenotypeResultsContext] Loading variants for ${geneSymbol}...`)
    const response = await getPhenotypeGeneVariants(sid, geneSymbol)

    // Update gene in aggregatedResults with loaded variants
    setAggregatedResults(prev => {
      if (!prev) return prev
      return prev.map(g =>
        g.gene_symbol === geneSymbol
          ? { ...g, variants: response.variants }
          : g
      )
    })

    return response.variants
  }, [])

  const clearResults = useCallback(() => {
    clearState()
  }, [clearState])

  const value = useMemo<PhenotypeResultsContextValue>(() => ({
    status,
    isLoading: status === 'pending' || status === 'loading',
    loadProgress,
    error,
    aggregatedResults,
    runMatching,
    loadAllPhenotypeResults,
    loadPhenotypeGeneVariants,
    clearResults,
    totalGenes: aggregatedResults?.length || 0,
    tier1Count,
    tier2Count,
    incidentalFindingsCount,
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
    loadPhenotypeGeneVariants,
    clearResults,
    tier1Count,
    tier2Count,
    incidentalFindingsCount,
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
