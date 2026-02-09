"use client"

/**
 * VariantsResultsContext - Store ALL variants locally for instant filtering
 *
 * Uses streaming to load large datasets (2M+ variants) progressively.
 * Once loaded, ALL operations are instant (no backend calls).
 *
 * Architecture:
 * 1. Stream all variants on mount (with progress)
 * 2. Store everything in context
 * 3. Local filtering/sorting/search (instant!)
 * 4. Session cache: switching between cases restores data instantly
 *    (max 3 sessions cached, LRU eviction)
 * 5. Auto-cleanup when session becomes null
 */

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react'
import type { GeneAggregated } from '@/types/variant.types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.helixinsight.bio'

// Session cache: avoids re-streaming when switching between cases
const MAX_CACHED_SESSIONS = 3

interface VariantsCacheEntry {
  allGenes: GeneAggregated[]
  totalVariants: number
}

interface VariantsResultsContextValue {
  // Data
  allGenes: GeneAggregated[]
  totalVariants: number

  // Loading state
  isLoading: boolean
  loadProgress: number
  error: string | null

  // Actions
  loadAllVariants: (sessionId: string) => Promise<void>
  clearVariants: () => void

  // Local operations (instant!)
  filterByGene: (geneSymbol: string) => GeneAggregated[]
  filterByAcmg: (acmgClass: string) => GeneAggregated[]
  filterByImpact: (impact: string) => GeneAggregated[]
  searchGenes: (query: string) => GeneAggregated[]

  // Computed stats
  totalGenes: number
  pathogenicCount: number
  likelyPathogenicCount: number
  vusCount: number
}

const VariantsResultsContext = createContext<VariantsResultsContextValue | undefined>(undefined)

interface VariantsResultsProviderProps {
  sessionId: string | null
  children: ReactNode
}

export function VariantsResultsProvider({ sessionId, children }: VariantsResultsProviderProps) {
  const [allGenes, setAllGenes] = useState<GeneAggregated[]>([])
  const [totalVariants, setTotalVariants] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Ref for tracking current session
  const currentSessionId = useRef<string | null>(null)

  // Refs mirroring state for cache saves (avoids adding state to effect dependencies)
  const allGenesRef = useRef<GeneAggregated[]>([])
  const totalVariantsRef = useRef(0)

  useEffect(() => { allGenesRef.current = allGenes }, [allGenes])
  useEffect(() => { totalVariantsRef.current = totalVariants }, [totalVariants])

  // Session cache (persists across re-renders, not across page reloads)
  const sessionCache = useRef<Map<string, VariantsCacheEntry>>(new Map())

  const saveToCache = useCallback((id: string, entry: VariantsCacheEntry) => {
    // Only cache if there's actual data
    if (entry.allGenes.length === 0) return

    sessionCache.current.set(id, entry)

    // LRU eviction: Map preserves insertion order, delete oldest
    if (sessionCache.current.size > MAX_CACHED_SESSIONS) {
      const oldest = sessionCache.current.keys().next().value
      if (oldest) sessionCache.current.delete(oldest)
    }
  }, [])

  // Auto-cleanup and cache management when session changes
  useEffect(() => {
    const prevId = currentSessionId.current

    // Case 1: Session cleared - save current to cache, then clear
    if (sessionId === null) {
      if (prevId && allGenesRef.current.length > 0) {
        saveToCache(prevId, {
          allGenes: allGenesRef.current,
          totalVariants: totalVariantsRef.current,
        })
      }
      console.log('[VariantsResultsContext] Session cleared - resetting variants')
      currentSessionId.current = null
      setAllGenes([])
      setTotalVariants(0)
      setLoadProgress(0)
      setError(null)
      setIsLoading(false)
      return
    }

    // Case 2: Same session - do nothing
    if (sessionId === currentSessionId.current) return

    // Case 3: New session - save current to cache, then check cache for new session
    if (prevId && allGenesRef.current.length > 0) {
      saveToCache(prevId, {
        allGenes: allGenesRef.current,
        totalVariants: totalVariantsRef.current,
      })
    }

    currentSessionId.current = sessionId

    // Check cache for the new session
    const cached = sessionCache.current.get(sessionId)
    if (cached) {
      console.log(`[VariantsResultsContext] Cache hit for ${sessionId} - restoring ${cached.allGenes.length} genes`)
      // Move to end of Map for LRU (delete + re-insert)
      sessionCache.current.delete(sessionId)
      sessionCache.current.set(sessionId, cached)
      // Restore instantly
      setAllGenes(cached.allGenes)
      setTotalVariants(cached.totalVariants)
      setLoadProgress(100)
      setError(null)
      setIsLoading(false)
      return
    }

    // Not in cache - clear and let LayoutContent trigger fresh load
    console.log(`[VariantsResultsContext] Cache miss for ${sessionId} - will stream fresh`)
    setAllGenes([])
    setTotalVariants(0)
    setLoadProgress(0)
    setError(null)
    setIsLoading(false)
  }, [sessionId, saveToCache])

  // Web Worker ref for streaming parse (persists across renders)
  const workerRef = useRef<Worker | null>(null)

  // Load all variants via Web Worker (JSON.parse off main thread)
  const loadAllVariants = useCallback(async (sessionId: string) => {
    setIsLoading(true)
    setLoadProgress(0)
    setError(null)
    setAllGenes([])

    // Terminate any existing worker
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }

    try {
      console.log('[VariantsResultsContext] Starting Web Worker streaming load...')

      const worker = new Worker('/workers/ndjson-stream-worker.js')
      workerRef.current = worker

      let loadedGenes: GeneAggregated[] = []
      let totalVariantsCount = 0

      worker.onmessage = (e) => {
        const msg = e.data

        if (msg.type === 'metadata') {
          totalVariantsCount = msg.data.total_variants
          console.log(`[VariantsResultsContext] Worker streaming ${msg.data.total_genes} genes, ${totalVariantsCount} variants...`)
        } else if (msg.type === 'batch') {
          // Append batch from worker (already parsed)
          loadedGenes = loadedGenes.concat(msg.genes)

          const progress = msg.totalGenes > 0
            ? Math.round((msg.totalSoFar / msg.totalGenes) * 100)
            : 0
          setLoadProgress(progress)
          setAllGenes([...loadedGenes])
        } else if (msg.type === 'complete') {
          console.log(`[VariantsResultsContext] Worker complete: ${msg.totalGenes} genes loaded`)
          setAllGenes(loadedGenes)
          setTotalVariants(totalVariantsCount)
          setLoadProgress(100)
          setIsLoading(false)
          worker.terminate()
          workerRef.current = null
        } else if (msg.type === 'error') {
          console.error('[VariantsResultsContext] Worker error:', msg.message)
          setError(msg.message)
          setIsLoading(false)
          worker.terminate()
          workerRef.current = null
        }
      }

      worker.onerror = (err) => {
        console.error('[VariantsResultsContext] Worker crashed:', err)
        setError('Worker failed: ' + (err.message || 'Unknown error'))
        setIsLoading(false)
        workerRef.current = null
      }

      // Start the worker
      const url = `${API_BASE_URL}/sessions/${sessionId}/variants/stream/by-gene`
      worker.postMessage({ type: 'start', url, batchSize: 500 })

    } catch (err) {
      console.error('[VariantsResultsContext] Failed to create worker:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsLoading(false)
    }
  }, [])

  // Clear variants
  const clearVariants = useCallback(() => {
    setAllGenes([])
    setTotalVariants(0)
    setLoadProgress(0)
    setError(null)
    setIsLoading(false)
  }, [])

  // LOCAL OPERATIONS (all instant - no API calls!)

  const filterByGene = useCallback((geneSymbol: string) => {
    return allGenes.filter(g => g.gene_symbol === geneSymbol)
  }, [allGenes])

  const filterByAcmg = useCallback((acmgClass: string) => {
    return allGenes.filter(g =>
      g.variants.some(v => v.acmg_class === acmgClass)
    )
  }, [allGenes])

  const filterByImpact = useCallback((impact: string) => {
    return allGenes.filter(g =>
      g.variants.some(v => v.impact === impact)
    )
  }, [allGenes])

  const searchGenes = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return allGenes.filter(g =>
      g.gene_symbol.toLowerCase().includes(lowerQuery)
    )
  }, [allGenes])

  // Computed statistics
  const totalGenes = allGenes.length

  const pathogenicCount = useMemo(() => {
    return allGenes.reduce((sum, g) => sum + g.pathogenic_count, 0)
  }, [allGenes])

  const likelyPathogenicCount = useMemo(() => {
    return allGenes.reduce((sum, g) => sum + g.likely_pathogenic_count, 0)
  }, [allGenes])

  const vusCount = useMemo(() => {
    return allGenes.reduce((sum, g) => sum + g.vus_count, 0)
  }, [allGenes])

  return (
    <VariantsResultsContext.Provider
      value={{
        allGenes,
        totalVariants,
        isLoading,
        loadProgress,
        error,
        loadAllVariants,
        clearVariants,
        filterByGene,
        filterByAcmg,
        filterByImpact,
        searchGenes,
        totalGenes,
        pathogenicCount,
        likelyPathogenicCount,
        vusCount,
      }}
    >
      {children}
    </VariantsResultsContext.Provider>
  )
}

export function useVariantsResults(): VariantsResultsContextValue {
  const context = useContext(VariantsResultsContext)
  if (!context) {
    throw new Error('useVariantsResults must be used within VariantsResultsProvider')
  }
  return context
}
