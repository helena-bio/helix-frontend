"use client"

/**
 * VariantsResultsContext - Summary-first with lazy gene expansion
 *
 * Architecture:
 * 1. Load gene summaries on case open (~50-100KB, <200ms) -> table renders instantly
 * 2. When user expands a gene, fetch variants on-demand (<50ms per gene)
 * 3. Session cache: LRU of 3 sessions (summaries + already-loaded gene variants)
 * 4. Empty state if summaries unavailable
 *
 * No Phase 2 bulk loading. Variants are fetched per-gene on demand.
 */

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react'
import type { GeneAggregated, ImpactByAcmg } from '@/types/variant.types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.helixinsight.bio'

const MAX_CACHED_SESSIONS = 3

interface VariantsCacheEntry {
  allGenes: GeneAggregated[]
  totalVariants: number
  impactByAcmg: ImpactByAcmg
}

interface VariantsResultsContextValue {
  // Data
  allGenes: GeneAggregated[]
  totalVariants: number
  impactByAcmg: ImpactByAcmg

  // Loading state
  isLoading: boolean
  loadProgress: number
  error: string | null

  // Actions
  loadAllVariants: (sessionId: string) => Promise<void>
  loadGeneVariants: (sessionId: string, geneSymbol: string) => Promise<void>
  clearVariants: () => void

  // Local operations
  filterByGene: (geneSymbol: string) => GeneAggregated[]
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

const EMPTY_IMPACT: ImpactByAcmg = {
  all: { HIGH: 0, MODERATE: 0, LOW: 0, MODIFIER: 0 },
}

// ============================================================
// NDJSON streaming parser (main thread, summaries are small)
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

  // Ref for tracking current session
  const currentSessionId = useRef<string | null>(null)

  // Refs mirroring state for cache saves
  const allGenesRef = useRef<GeneAggregated[]>([])
  const totalVariantsRef = useRef(0)
  const impactByAcmgRef = useRef<ImpactByAcmg>(EMPTY_IMPACT)

  useEffect(() => { allGenesRef.current = allGenes }, [allGenes])
  useEffect(() => { totalVariantsRef.current = totalVariants }, [totalVariants])
  useEffect(() => { impactByAcmgRef.current = impactByAcmg }, [impactByAcmg])

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
    setImpactByAcmg(EMPTY_IMPACT)
    setLoadProgress(0)
    setError(null)
    setIsLoading(false)
  }, [])

  // Session change: cache management
  useEffect(() => {
    const prevId = currentSessionId.current

    if (sessionId === null) {
      if (prevId && allGenesRef.current.length > 0) {
        saveToCache(prevId, {
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

    // Save current session to cache
    if (prevId && allGenesRef.current.length > 0) {
      saveToCache(prevId, {
        allGenes: allGenesRef.current,
        totalVariants: totalVariantsRef.current,
        impactByAcmg: impactByAcmgRef.current,
      })
    }

    currentSessionId.current = sessionId

    // Check cache
    const cached = sessionCache.current.get(sessionId)
    if (cached) {
      console.log('[VariantsResultsContext] Cache hit: ' + cached.allGenes.length + ' genes')
      sessionCache.current.delete(sessionId)
      sessionCache.current.set(sessionId, cached)
      setAllGenes(cached.allGenes)
      setTotalVariants(cached.totalVariants)
      setImpactByAcmg(cached.impactByAcmg)
      setLoadProgress(100)
      setError(null)
      setIsLoading(false)
      return
    }

    console.log('[VariantsResultsContext] Cache miss for ' + sessionId)
    clearState()
  }, [sessionId, saveToCache, clearState])

  // ============================================================
  // Load gene summaries (instant, ~50-100KB)
  // ============================================================
  const loadAllVariants = useCallback(async (sid: string) => {
    setIsLoading(true)
    setLoadProgress(0)
    setError(null)
    setAllGenes([])
    setImpactByAcmg(EMPTY_IMPACT)

    try {
      // Try summaries endpoint first
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

      // Summaries loaded - render immediately
      setAllGenes(summaryGenes)
      setTotalVariants(totalVariantsCount)
      setImpactByAcmg(loadedImpactByAcmg)
      setLoadProgress(100)
      setIsLoading(false)

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

      // Update the specific gene in allGenes with loaded variants
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

  // Clear variants
  const clearVariants = useCallback(() => {
    clearState()
  }, [clearState])

  // LOCAL OPERATIONS

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
