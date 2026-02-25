"use client"

/**
 * VariantsResultsContext - Summary-first with lazy gene expansion
 *
 * Architecture:
 * 1. Check IndexedDB disk cache -> instant restore (0ms)
 * 2. On miss: fetch gene summaries (~330KB, <200ms) -> save to IndexedDB
 * 3. When user expands a gene, fetch variants on-demand (<50ms per gene)
 * 4. In-memory LRU of 3 sessions for tab switching
 * 5. IndexedDB persists across page refreshes (TTL: 7 days)
 */

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react'
import type { GeneAggregated, ImpactByAcmg } from '@/types/variant.types'
import { getCached, setCache } from '@/lib/cache/session-disk-cache'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.helixinsight.bio'

const MAX_CACHED_SESSIONS = 10

interface VariantsDiskData {
  allGenes: GeneAggregated[]
  totalVariants: number
  impactByAcmg: ImpactByAcmg
}

interface VariantsCacheEntry {
  allGenes: GeneAggregated[]
  totalVariants: number
  impactByAcmg: ImpactByAcmg
}

interface VariantsResultsContextValue {
  allGenes: GeneAggregated[]
  totalVariants: number
  impactByAcmg: ImpactByAcmg
  isLoading: boolean
  loadProgress: number
  error: string | null
  loadAllVariants: (sessionId: string) => Promise<void>
  loadGeneVariants: (sessionId: string, geneSymbol: string) => Promise<void>
  clearVariants: () => void
  filterByGene: (geneSymbol: string) => GeneAggregated[]
  searchGenes: (query: string) => GeneAggregated[]
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

const EMPTY_IMPACT: ImpactByAcmg = {
  all: { HIGH: 0, MODERATE: 0, LOW: 0, MODIFIER: 0 },
}

// ============================================================
// NDJSON streaming parser (summaries are small, main thread OK)
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
  const [impactByAcmg, setImpactByAcmg] = useState<ImpactByAcmg>(EMPTY_IMPACT)
  const [isLoading, setIsLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const currentSessionId = useRef<string | null>(null)

  // Refs mirroring state for cache saves
  const allGenesRef = useRef<GeneAggregated[]>([])
  const totalVariantsRef = useRef(0)
  const impactByAcmgRef = useRef<ImpactByAcmg>(EMPTY_IMPACT)

  useEffect(() => { allGenesRef.current = allGenes }, [allGenes])
  useEffect(() => { totalVariantsRef.current = totalVariants }, [totalVariants])
  useEffect(() => { impactByAcmgRef.current = impactByAcmg }, [impactByAcmg])

  // In-memory LRU cache (fast tab switching)
  const sessionCache = useRef<Map<string, VariantsCacheEntry>>(new Map())

  const saveToMemoryCache = useCallback((id: string, entry: VariantsCacheEntry) => {
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
    setImpactByAcmg(EMPTY_IMPACT)
    setLoadProgress(0)
    setError(null)
    setIsLoading(false)
  }, [])

  // Session change: memory cache + IndexedDB
  useEffect(() => {
    const prevId = currentSessionId.current

    if (sessionId === null) {
      if (prevId && allGenesRef.current.length > 0) {
        saveToMemoryCache(prevId, {
          allGenes: allGenesRef.current,
          totalVariants: totalVariantsRef.current,
          impactByAcmg: impactByAcmgRef.current,
        })
      }
      console.log('[VariantsResultsContext] Session cleared')
      currentSessionId.current = null
      clearState()
      return
    }

    if (sessionId === currentSessionId.current) return

    // Save current to memory cache
    if (prevId && allGenesRef.current.length > 0) {
      saveToMemoryCache(prevId, {
        allGenes: allGenesRef.current,
        totalVariants: totalVariantsRef.current,
        impactByAcmg: impactByAcmgRef.current,
      })
    }

    currentSessionId.current = sessionId

    // Check memory cache first (instant)
    const memoryCached = sessionCache.current.get(sessionId)
    if (memoryCached) {
      console.log('[VariantsResultsContext] Memory cache hit: ' + memoryCached.allGenes.length + ' genes')
      sessionCache.current.delete(sessionId)
      sessionCache.current.set(sessionId, memoryCached)
      setAllGenes(memoryCached.allGenes)
      setTotalVariants(memoryCached.totalVariants)
      setImpactByAcmg(memoryCached.impactByAcmg)
      setLoadProgress(100)
      setError(null)
      setIsLoading(false)
      return
    }

    // No memory cache -- check IndexedDB (async)
    // CRITICAL: Set isLoading=true to prevent LayoutContent from triggering
    // loadAllVariants during the async IndexedDB check. Without this,
    // a race condition causes variant detail panel to not open:
    //   1. clearState sets isLoading=false, allGenes=[]
    //   2. LayoutContent sees !isLoading && allGenes.length===0 -> calls loadAllVariants
    //   3. loadAllVariants wipes disk cache data with setAllGenes([])
    //   4. variantsReady flickers -> VariantAnalysisView unmounts/remounts
    //   5. URL ?variant= param already cleaned on first mount -> lost
    setAllGenes([])
    setTotalVariants(0)
    setImpactByAcmg(EMPTY_IMPACT)
    setLoadProgress(0)
    setError(null)
    setIsLoading(true)

    getCached<VariantsDiskData>('variant-summaries', sessionId).then(diskData => {
      // Guard: session may have changed during async IndexedDB read
      if (currentSessionId.current !== sessionId) return

      if (diskData) {
        console.log('[VariantsResultsContext] Disk cache hit: ' + diskData.allGenes.length + ' genes')
        setAllGenes(diskData.allGenes)
        setTotalVariants(diskData.totalVariants)
        setImpactByAcmg(diskData.impactByAcmg)
        setLoadProgress(100)
        setIsLoading(false)
      } else {
        console.log('[VariantsResultsContext] Disk cache miss for ' + sessionId)
        setIsLoading(false)
      }
    }).catch(() => {
      // IndexedDB unavailable, allow network fetch
      if (currentSessionId.current === sessionId) {
        setIsLoading(false)
      }
    })
  }, [sessionId, saveToMemoryCache, clearState])

  // ============================================================
  // Load gene summaries (instant, ~330KB)
  // ============================================================
  const loadAllVariants = useCallback(async (sid: string) => {
    // Quick check: if data already loaded (from disk cache), skip
    if (allGenesRef.current.length > 0 && currentSessionId.current === sid) {
      console.log('[VariantsResultsContext] Data already loaded, skipping fetch')
      return
    }

    setIsLoading(true)
    setLoadProgress(0)
    setError(null)
    setAllGenes([])
    setImpactByAcmg(EMPTY_IMPACT)

    try {
      const summaryUrl = API_BASE_URL + '/sessions/' + sid + '/variants/summaries'
      let summaryGenes: GeneAggregated[] = []
      let totalVariantsCount = 0
      let loadedImpactByAcmg: ImpactByAcmg = EMPTY_IMPACT

      try {
        const response = await fetch(summaryUrl)

        if (!response.ok) {
          throw new Error('Summaries not available: HTTP ' + response.status)
        } else {
          await streamNdjson(
            summaryUrl,
            (meta) => {
              totalVariantsCount = meta.total_variants
              if (meta.impact_by_acmg) {
                loadedImpactByAcmg = meta.impact_by_acmg
              }
            },
            (gene) => {
              summaryGenes.push({ ...gene, variants: [] })
            },
            (loaded, total) => {
              const progress = total > 0 ? Math.round((loaded / total) * 100) : 0
              setLoadProgress(progress)
            },
          )

          console.log('[VariantsResultsContext] Summaries loaded: ' + summaryGenes.length + ' genes')
        }
      } catch (e) {
        console.error('[VariantsResultsContext] Summaries fetch failed:', e)
        setError('Failed to load gene summaries')
        setIsLoading(false)
        return
      }

      // Render immediately
      setAllGenes(summaryGenes)
      setTotalVariants(totalVariantsCount)
      setImpactByAcmg(loadedImpactByAcmg)
      setLoadProgress(100)
      setIsLoading(false)

      // Persist to IndexedDB (async, non-blocking)
      setCache<VariantsDiskData>('variant-summaries', sid, {
        allGenes: summaryGenes,
        totalVariants: totalVariantsCount,
        impactByAcmg: loadedImpactByAcmg,
      }).catch(() => {})

    } catch (err) {
      console.error('[VariantsResultsContext] Loading failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsLoading(false)
    }
  }, [])

  // ============================================================
  // Load variants for a single gene (on-demand, <50ms)
  // ============================================================
  const loadGeneVariants = useCallback(async (sid: string, geneSymbol: string) => {
    try {
      const url = API_BASE_URL + '/sessions/' + sid + '/variants/by-gene/' + encodeURIComponent(geneSymbol)
      const response = await fetch(url)

      if (!response.ok) {
        console.error('[VariantsResultsContext] Failed to load variants for ' + geneSymbol)
        return
      }

      const data = await response.json()
      const variants = data.variants || []

      setAllGenes(prev =>
        prev.map(g =>
          g.gene_symbol === geneSymbol
            ? { ...g, variants }
            : g
        )
      )
    } catch (err) {
      console.error('[VariantsResultsContext] Gene variants load error:', err)
    }
  }, [])

  const clearVariants = useCallback(() => {
    clearState()
  }, [clearState])

  const filterByGene = useCallback((geneSymbol: string) => {
    return allGenes.filter(g => g.gene_symbol === geneSymbol)
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
        impactByAcmg,
        isLoading,
        loadProgress,
        error,
        loadAllVariants,
        loadGeneVariants,
        clearVariants,
        filterByGene,
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
