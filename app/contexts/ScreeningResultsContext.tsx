"use client"

/**
 * ScreeningResultsContext - Summary-First with Disk Cache
 *
 * Same pattern as PhenotypeResultsContext:
 * 1. loadAllScreeningResults() - streams gene summaries from NDJSON.gz
 * 2. Individual variants loaded on-demand when user expands a gene
 *
 * Caching layers:
 * - In-memory LRU (10 sessions) - instant tab switching
 * - IndexedDB disk cache (TTL 7 days) - survives page refresh
 * - Network fetch as last resort
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { getCached, setCache } from '@/lib/cache/session-disk-cache'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.helixinsight.bio'

const MAX_CACHED_SESSIONS = 10

// ============================================================================
// TYPES
// ============================================================================

export type ScreeningStatus = 'idle' | 'loading' | 'success' | 'error'

export interface ScreeningGeneResult {
  gene_symbol: string
  rank: number
  variant_count: number
  best_score: number
  best_tier: string
  best_actionability: string
  best_acmg_class: string
  tier_1_count: number
  tier_2_count: number
  tier_3_count: number
  tier_4_count: number
  // Lazy-loaded on expand
  variants?: ScreeningVariantResult[]
}

export interface ScreeningVariantResult {
  variant_id: string
  gene_symbol: string
  hgvs_protein: string | null
  hgvs_cdna: string | null
  consequence: string
  acmg_class: string
  chromosome: string
  position: number
  impact: string
  genotype: string
  rsid: string | null
  gnomad_af: number | null
  total_score: number
  constraint_score: number
  deleteriousness_score: number
  phenotype_score: number
  dosage_score: number
  consequence_score: number
  compound_het_score: number
  age_relevance_score: number
  acmg_boost: number
  phenotype_boost: number
  ethnicity_boost: number
  family_history_boost: number
  de_novo_boost: number
  tier: string
  clinical_actionability: string
  age_group: string
  screening_mode: string
  justification: string
}

interface ScreeningDiskData {
  geneResults: ScreeningGeneResult[]
  tier1Count: number
  tier2Count: number
  tier3Count: number
  tier4Count: number
  totalVariantsAnalyzed: number
  ageGroup: string
  screeningMode: string
}

interface ScreeningCacheEntry {
  geneResults: ScreeningGeneResult[] | null
  tier1Count: number
  tier2Count: number
  tier3Count: number
  tier4Count: number
  totalVariantsAnalyzed: number
  ageGroup: string
  screeningMode: string
}

interface ScreeningResultsContextValue {
  status: ScreeningStatus
  isLoading: boolean
  loadProgress: number
  error: Error | null
  geneResults: ScreeningGeneResult[] | null
  loadAllScreeningResults: (sessionId: string) => Promise<ScreeningGeneResult[]>
  loadScreeningGeneVariants: (sessionId: string, geneSymbol: string) => Promise<ScreeningVariantResult[]>
  clearResults: () => void
  totalGenes: number
  tier1Count: number
  tier2Count: number
  tier3Count: number
  tier4Count: number
  totalVariantsAnalyzed: number
  ageGroup: string
  screeningMode: string
}

// ============================================================================
// CONTEXT
// ============================================================================

const ScreeningResultsContext = createContext<ScreeningResultsContextValue | undefined>(undefined)

interface ScreeningResultsProviderProps {
  sessionId: string | null
  children: ReactNode
}

export function ScreeningResultsProvider({ sessionId, children }: ScreeningResultsProviderProps) {
  const [status, setStatus] = useState<ScreeningStatus>('idle')
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [geneResults, setGeneResults] = useState<ScreeningGeneResult[] | null>(null)
  const [tier1Count, setTier1Count] = useState(0)
  const [tier2Count, setTier2Count] = useState(0)
  const [tier3Count, setTier3Count] = useState(0)
  const [tier4Count, setTier4Count] = useState(0)
  const [totalVariantsAnalyzed, setTotalVariantsAnalyzed] = useState(0)
  const [ageGroup, setAgeGroup] = useState('')
  const [screeningMode, setScreeningMode] = useState('')

  const currentSessionId = useRef<string | null>(null)

  // Refs mirroring state for cache saves
  const geneResultsRef = useRef<ScreeningGeneResult[] | null>(null)
  const tier1Ref = useRef(0)
  const tier2Ref = useRef(0)
  const tier3Ref = useRef(0)
  const tier4Ref = useRef(0)
  const analyzedRef = useRef(0)
  const ageGroupRef = useRef('')
  const screeningModeRef = useRef('')

  useEffect(() => { geneResultsRef.current = geneResults }, [geneResults])
  useEffect(() => { tier1Ref.current = tier1Count }, [tier1Count])
  useEffect(() => { tier2Ref.current = tier2Count }, [tier2Count])
  useEffect(() => { tier3Ref.current = tier3Count }, [tier3Count])
  useEffect(() => { tier4Ref.current = tier4Count }, [tier4Count])
  useEffect(() => { analyzedRef.current = totalVariantsAnalyzed }, [totalVariantsAnalyzed])
  useEffect(() => { ageGroupRef.current = ageGroup }, [ageGroup])
  useEffect(() => { screeningModeRef.current = screeningMode }, [screeningMode])

  const sessionCache = useRef<Map<string, ScreeningCacheEntry>>(new Map())

  const saveToMemoryCache = useCallback((id: string, entry: ScreeningCacheEntry) => {
    if (!entry.geneResults || entry.geneResults.length === 0) return

    sessionCache.current.set(id, entry)
    if (sessionCache.current.size > MAX_CACHED_SESSIONS) {
      const oldest = sessionCache.current.keys().next().value
      if (oldest) sessionCache.current.delete(oldest)
    }
  }, [])

  const getCurrentCacheEntry = useCallback((): ScreeningCacheEntry => ({
    geneResults: geneResultsRef.current,
    tier1Count: tier1Ref.current,
    tier2Count: tier2Ref.current,
    tier3Count: tier3Ref.current,
    tier4Count: tier4Ref.current,
    totalVariantsAnalyzed: analyzedRef.current,
    ageGroup: ageGroupRef.current,
    screeningMode: screeningModeRef.current,
  }), [])

  const restoreFromEntry = useCallback((entry: ScreeningCacheEntry) => {
    setGeneResults(entry.geneResults)
    setTier1Count(entry.tier1Count)
    setTier2Count(entry.tier2Count)
    setTier3Count(entry.tier3Count)
    setTier4Count(entry.tier4Count)
    setTotalVariantsAnalyzed(entry.totalVariantsAnalyzed)
    setAgeGroup(entry.ageGroup)
    setScreeningMode(entry.screeningMode)
    setLoadProgress(100)
    setError(null)
    setStatus('success')
  }, [])

  const clearState = useCallback(() => {
    setGeneResults(null)
    setStatus('idle')
    setError(null)
    setLoadProgress(0)
    setTier1Count(0)
    setTier2Count(0)
    setTier3Count(0)
    setTier4Count(0)
    setTotalVariantsAnalyzed(0)
    setAgeGroup('')
    setScreeningMode('')
  }, [])

  // Session change: memory cache + IndexedDB
  useEffect(() => {
    const prevId = currentSessionId.current

    if (sessionId === null) {
      if (prevId) saveToMemoryCache(prevId, getCurrentCacheEntry())
      console.log('[ScreeningResultsContext] Session cleared')
      currentSessionId.current = null
      clearState()
      return
    }

    if (sessionId === currentSessionId.current) return

    if (prevId) saveToMemoryCache(prevId, getCurrentCacheEntry())

    currentSessionId.current = sessionId

    // Check memory cache first (instant)
    const memoryCached = sessionCache.current.get(sessionId)
    if (memoryCached) {
      console.log(`[ScreeningResultsContext] Memory cache hit for ${sessionId}`)
      sessionCache.current.delete(sessionId)
      sessionCache.current.set(sessionId, memoryCached)
      restoreFromEntry(memoryCached)
      return
    }

    // Check IndexedDB
    clearState()
    getCached<ScreeningDiskData>('screening-summaries', sessionId).then(diskData => {
      if (diskData && currentSessionId.current === sessionId) {
        console.log(`[ScreeningResultsContext] Disk cache hit: ${diskData.geneResults.length} genes`)
        restoreFromEntry(diskData)
      } else if (!diskData) {
        console.log(`[ScreeningResultsContext] Disk cache miss for ${sessionId}`)
      }
    }).catch(() => {})
  }, [sessionId, saveToMemoryCache, getCurrentCacheEntry, restoreFromEntry, clearState])

  // Load gene summaries (check disk cache first, then stream)
  const loadAllScreeningResults = useCallback(async (sid: string): Promise<ScreeningGeneResult[]> => {
    // Quick check: if data already loaded
    if (geneResultsRef.current && geneResultsRef.current.length > 0 && currentSessionId.current === sid) {
      console.log('[ScreeningResultsContext] Data already loaded, skipping fetch')
      return geneResultsRef.current
    }

    setStatus('loading')
    setLoadProgress(0)
    setError(null)
    setGeneResults(null)

    try {
      console.log('[ScreeningResultsContext] Loading screening gene summaries...')

      const response = await fetch(
        `${API_BASE_URL}/screening/sessions/${sid}/screening/summaries`
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
      let loadedGenes: ScreeningGeneResult[] = []
      let totalGenesCount = 0
      let loadedTier1 = 0
      let loadedTier2 = 0
      let loadedTier3 = 0
      let loadedTier4 = 0
      let loadedAnalyzed = 0
      let loadedAgeGroup = ''
      let loadedScreeningMode = ''

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
              loadedTier1 = parsed.tier_1_count
              loadedTier2 = parsed.tier_2_count
              loadedTier3 = parsed.tier_3_count
              loadedTier4 = parsed.tier_4_count
              loadedAnalyzed = parsed.total_variants
              loadedAgeGroup = parsed.age_group || ''
              loadedScreeningMode = parsed.screening_mode || ''
              console.log(`[ScreeningResultsContext] Streaming ${totalGenesCount} gene summaries...`)
              setTier1Count(loadedTier1)
              setTier2Count(loadedTier2)
              setTier3Count(loadedTier3)
              setTier4Count(loadedTier4)
              setTotalVariantsAnalyzed(loadedAnalyzed)
              setAgeGroup(loadedAgeGroup)
              setScreeningMode(loadedScreeningMode)
            } else if (parsed.type === 'gene') {
              loadedGenes.push(parsed.data)

              if (loadedGenes.length % 50 === 0) {
                const progress = totalGenesCount > 0
                  ? Math.round((loadedGenes.length / totalGenesCount) * 100)
                  : 0
                setLoadProgress(progress)
                setGeneResults([...loadedGenes])
              }
            } else if (parsed.type === 'complete') {
              console.log(`[ScreeningResultsContext] Summaries complete: ${parsed.total_streamed} genes`)
            }
          } catch (e) {
            console.warn('[ScreeningResultsContext] Failed to parse line:', e)
          }
        }
      }

      setGeneResults(loadedGenes)
      setLoadProgress(100)
      setStatus('success')

      console.log(`[ScreeningResultsContext] Summaries loaded: ${loadedGenes.length} genes`)

      // Persist to IndexedDB (async, non-blocking)
      setCache<ScreeningDiskData>('screening-summaries', sid, {
        geneResults: loadedGenes,
        tier1Count: loadedTier1,
        tier2Count: loadedTier2,
        tier3Count: loadedTier3,
        tier4Count: loadedTier4,
        totalVariantsAnalyzed: loadedAnalyzed,
        ageGroup: loadedAgeGroup,
        screeningMode: loadedScreeningMode,
      }).catch(() => {})

      return loadedGenes

    } catch (err) {
      console.error('[ScreeningResultsContext] Summaries load failed:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setStatus('error')
      throw err
    }
  }, [])

  // Load variants for a single gene on-demand
  const loadScreeningGeneVariants = useCallback(async (
    sid: string,
    geneSymbol: string,
  ): Promise<ScreeningVariantResult[]> => {
    const current = geneResultsRef.current
    if (current) {
      const gene = current.find(g => g.gene_symbol === geneSymbol)
      if (gene?.variants && gene.variants.length > 0) {
        return gene.variants
      }
    }

    console.log(`[ScreeningResultsContext] Loading variants for ${geneSymbol}...`)

    const response = await fetch(
      `${API_BASE_URL}/screening/sessions/${sid}/screening/genes/${geneSymbol}/variants`
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    setGeneResults(prev => {
      if (!prev) return prev
      return prev.map(g =>
        g.gene_symbol === geneSymbol
          ? { ...g, variants: data.variants }
          : g
      )
    })

    return data.variants
  }, [])

  const clearResults = useCallback(() => {
    clearState()
  }, [clearState])

  const value = useMemo<ScreeningResultsContextValue>(() => ({
    status,
    isLoading: status === 'loading',
    loadProgress,
    error,
    geneResults,
    loadAllScreeningResults,
    loadScreeningGeneVariants,
    clearResults,
    totalGenes: geneResults?.length || 0,
    tier1Count,
    tier2Count,
    tier3Count,
    tier4Count,
    totalVariantsAnalyzed,
    ageGroup,
    screeningMode,
  }), [
    status,
    loadProgress,
    error,
    geneResults,
    loadAllScreeningResults,
    loadScreeningGeneVariants,
    clearResults,
    tier1Count,
    tier2Count,
    tier3Count,
    tier4Count,
    totalVariantsAnalyzed,
    ageGroup,
    screeningMode,
  ])

  return (
    <ScreeningResultsContext.Provider value={value}>
      {children}
    </ScreeningResultsContext.Provider>
  )
}

export function useScreeningResults(): ScreeningResultsContextValue {
  const context = useContext(ScreeningResultsContext)
  if (!context) {
    throw new Error('useScreeningResults must be used within ScreeningResultsProvider')
  }
  return context
}
