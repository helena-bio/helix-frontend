"use client"

/**
 * VariantsResultsContext - Two-phase loading for instant case switching
 *
 * Phase 1: Gene summaries (255KB, <200ms) -> table renders immediately
 * Phase 2: Full variant data (77MB, ~10s) -> loads in background
 *
 * Architecture:
 * 1. Stream gene summaries on case open (instant table render)
 * 2. Background-load full variant data (silent, no loading screen)
 * 3. When user expands a gene, variants are already there (or show spinner)
 * 4. Session cache: LRU cache of 3 sessions (full data, instant switch-back)
 * 5. Fallback: if summaries file missing, loads full data directly (old path)
 */

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react'
import type { GeneAggregated } from '@/types/variant.types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.helixinsight.bio'

const MAX_CACHED_SESSIONS = 3

interface VariantsCacheEntry {
  allGenes: GeneAggregated[]
  totalVariants: number
  variantsFullyLoaded: boolean
}

interface VariantsResultsContextValue {
  // Data
  allGenes: GeneAggregated[]
  totalVariants: number

  // Loading state
  isLoading: boolean          // Phase 1 (summaries) - controls loading screen
  loadProgress: number        // Phase 1 progress (0-100)
  isLoadingFullData: boolean  // Phase 2 (background) - subtle indicator
  fullDataProgress: number    // Phase 2 progress (0-100)
  variantsFullyLoaded: boolean // All variant arrays populated
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

// ============================================================
// NDJSON streaming parser (main thread, used for both phases)
// ============================================================
async function streamNdjson(
  url: string,
  onMetadata: (meta: any) => void,
  onGene: (gene: any) => void,
  onProgress: (loaded: number, total: number) => void,
): Promise<void> {
  const response = await fetch(url)

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
  let totalGenesCount = 0
  let loadedCount = 0

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
          onMetadata(parsed)
        } else if (parsed.type === 'gene') {
          loadedCount++
          onGene(parsed.data)

          if (loadedCount % 500 === 0) {
            onProgress(loadedCount, totalGenesCount)
          }
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
  }

  onProgress(loadedCount, totalGenesCount)
}

export function VariantsResultsProvider({ sessionId, children }: VariantsResultsProviderProps) {
  const [allGenes, setAllGenes] = useState<GeneAggregated[]>([])
  const [totalVariants, setTotalVariants] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isLoadingFullData, setIsLoadingFullData] = useState(false)
  const [fullDataProgress, setFullDataProgress] = useState(0)
  const [variantsFullyLoaded, setVariantsFullyLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ref for tracking current session
  const currentSessionId = useRef<string | null>(null)

  // Abort controller for background loading
  const bgAbortRef = useRef<AbortController | null>(null)

  // Refs mirroring state for cache saves
  const allGenesRef = useRef<GeneAggregated[]>([])
  const totalVariantsRef = useRef(0)
  const variantsFullyLoadedRef = useRef(false)

  useEffect(() => { allGenesRef.current = allGenes }, [allGenes])
  useEffect(() => { totalVariantsRef.current = totalVariants }, [totalVariants])
  useEffect(() => { variantsFullyLoadedRef.current = variantsFullyLoaded }, [variantsFullyLoaded])

  // Session cache
  const sessionCache = useRef<Map<string, VariantsCacheEntry>>(new Map())

  const saveToCache = useCallback((id: string, entry: VariantsCacheEntry) => {
    if (entry.allGenes.length === 0) return

    sessionCache.current.set(id, entry)

    if (sessionCache.current.size > MAX_CACHED_SESSIONS) {
      const oldest = sessionCache.current.keys().next().value
      if (oldest) sessionCache.current.delete(oldest)
    }
  }, [])

  const clearState = useCallback(() => {
    setAllGenes([])
    setTotalVariants(0)
    setLoadProgress(0)
    setFullDataProgress(0)
    setError(null)
    setIsLoading(false)
    setIsLoadingFullData(false)
    setVariantsFullyLoaded(false)
  }, [])

  // Session change: cache management
  useEffect(() => {
    const prevId = currentSessionId.current

    if (sessionId === null) {
      if (prevId && allGenesRef.current.length > 0) {
        saveToCache(prevId, {
          allGenes: allGenesRef.current,
          totalVariants: totalVariantsRef.current,
          variantsFullyLoaded: variantsFullyLoadedRef.current,
        })
      }
      // Abort any background loading
      if (bgAbortRef.current) bgAbortRef.current.abort()
      console.log('[VariantsResultsContext] Session cleared')
      currentSessionId.current = null
      clearState()
      return
    }

    if (sessionId === currentSessionId.current) return

    // Save current session to cache
    if (prevId && allGenesRef.current.length > 0) {
      saveToCache(prevId, {
        allGenes: allGenesRef.current,
        totalVariants: totalVariantsRef.current,
        variantsFullyLoaded: variantsFullyLoadedRef.current,
      })
    }

    // Abort any background loading from previous session
    if (bgAbortRef.current) bgAbortRef.current.abort()

    currentSessionId.current = sessionId

    // Check cache
    const cached = sessionCache.current.get(sessionId)
    if (cached) {
      console.log(`[VariantsResultsContext] Cache hit: ${cached.allGenes.length} genes, full=${cached.variantsFullyLoaded}`)
      sessionCache.current.delete(sessionId)
      sessionCache.current.set(sessionId, cached)
      setAllGenes(cached.allGenes)
      setTotalVariants(cached.totalVariants)
      setLoadProgress(100)
      setVariantsFullyLoaded(cached.variantsFullyLoaded)
      setError(null)
      setIsLoading(false)
      setIsLoadingFullData(false)
      return
    }

    console.log(`[VariantsResultsContext] Cache miss for ${sessionId}`)
    clearState()
  }, [sessionId, saveToCache, clearState])

  // ============================================================
  // Two-phase loading
  // ============================================================
  const loadAllVariants = useCallback(async (sessionId: string) => {
    setIsLoading(true)
    setLoadProgress(0)
    setError(null)
    setAllGenes([])
    setVariantsFullyLoaded(false)

    try {
      // ---- PHASE 1: Gene summaries (255KB) ----
      console.log('[VariantsResultsContext] Phase 1: Loading gene summaries...')

      const summaryUrl = `${API_BASE_URL}/sessions/${sessionId}/variants/summaries`
      let summaryGenes: GeneAggregated[] = []
      let totalVariantsCount = 0
      let summariesAvailable = true

      try {
        const response = await fetch(summaryUrl)

        if (!response.ok) {
          console.log('[VariantsResultsContext] Summaries not available, falling back to full load')
          summariesAvailable = false
        } else {
          // Parse summaries (small enough for main thread)
          const reader = response.body!
            .pipeThrough(new TextDecoderStream())
            .getReader()

          let buffer = ''

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
                  totalVariantsCount = parsed.total_variants
                } else if (parsed.type === 'gene') {
                  // Add empty variants array for compatibility
                  summaryGenes.push({ ...parsed.data, variants: [] })
                }
              } catch (e) {
                // Skip malformed lines
              }
            }
          }

          console.log(`[VariantsResultsContext] Phase 1 complete: ${summaryGenes.length} genes in ~200ms`)
        }
      } catch (e) {
        console.log('[VariantsResultsContext] Summaries fetch failed, falling back')
        summariesAvailable = false
      }

      // ---- FALLBACK: No summaries, load full data directly ----
      if (!summariesAvailable) {
        console.log('[VariantsResultsContext] Fallback: streaming full data...')
        const fullGenes: GeneAggregated[] = []

        await streamNdjson(
          `${API_BASE_URL}/sessions/${sessionId}/variants/stream/by-gene`,
          (meta) => {
            totalVariantsCount = meta.total_variants
            console.log(`[VariantsResultsContext] Streaming ${meta.total_genes} genes...`)
          },
          (gene) => {
            fullGenes.push(gene)
          },
          (loaded, total) => {
            const progress = total > 0 ? Math.round((loaded / total) * 100) : 0
            setLoadProgress(progress)
            if (loaded % 500 === 0) {
              setAllGenes([...fullGenes])
            }
          },
        )

        setAllGenes(fullGenes)
        setTotalVariants(totalVariantsCount)
        setLoadProgress(100)
        setIsLoading(false)
        setVariantsFullyLoaded(true)
        return
      }

      // ---- Phase 1 renders table NOW ----
      setAllGenes(summaryGenes)
      setTotalVariants(totalVariantsCount)
      setLoadProgress(100)
      setIsLoading(false)  // Loading screen clears, table visible

      // ---- PHASE 2: Full variant data (77MB, background) ----
      console.log('[VariantsResultsContext] Phase 2: Background loading full variant data...')
      setIsLoadingFullData(true)
      setFullDataProgress(0)

      const abortController = new AbortController()
      bgAbortRef.current = abortController

      try {
        const fullGenes: GeneAggregated[] = []

        await streamNdjson(
          `${API_BASE_URL}/sessions/${sessionId}/variants/stream/by-gene`,
          (meta) => {
            console.log(`[VariantsResultsContext] Phase 2: streaming ${meta.total_genes} genes with variants...`)
          },
          (gene) => {
            if (abortController.signal.aborted) return
            fullGenes.push(gene)
          },
          (loaded, total) => {
            if (abortController.signal.aborted) return
            const progress = total > 0 ? Math.round((loaded / total) * 100) : 0
            setFullDataProgress(progress)
          },
        )

        if (!abortController.signal.aborted) {
          // One single state update: replace summaries with full data
          console.log(`[VariantsResultsContext] Phase 2 complete: ${fullGenes.length} genes with variants`)
          setAllGenes(fullGenes)
          setVariantsFullyLoaded(true)
          setIsLoadingFullData(false)
          setFullDataProgress(100)
        }
      } catch (bgErr) {
        if (!abortController.signal.aborted) {
          console.error('[VariantsResultsContext] Phase 2 failed:', bgErr)
          setIsLoadingFullData(false)
          // Table still works with summaries, just no variant expansion
        }
      }

    } catch (err) {
      console.error('[VariantsResultsContext] Loading failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsLoading(false)
    }
  }, [])

  // Clear variants
  const clearVariants = useCallback(() => {
    if (bgAbortRef.current) bgAbortRef.current.abort()
    clearState()
  }, [clearState])

  // LOCAL OPERATIONS

  const filterByGene = useCallback((geneSymbol: string) => {
    return allGenes.filter(g => g.gene_symbol === geneSymbol)
  }, [allGenes])

  const filterByAcmg = useCallback((acmgClass: string) => {
    return allGenes.filter(g =>
      g.variants && g.variants.length > 0
        ? g.variants.some(v => v.acmg_class === acmgClass)
        : g.best_acmg_class === acmgClass
    )
  }, [allGenes])

  const filterByImpact = useCallback((impact: string) => {
    return allGenes.filter(g =>
      g.variants && g.variants.length > 0
        ? g.variants.some(v => v.impact === impact)
        : g.best_impact === impact
    )
  }, [allGenes])

  const searchGenes = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return allGenes.filter(g =>
      g.gene_symbol.toLowerCase().includes(lowerQuery)
    )
  }, [allGenes])

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
        isLoadingFullData,
        fullDataProgress,
        variantsFullyLoaded,
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
