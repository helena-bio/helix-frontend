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
 * 4. Auto-cleanup when session changes
 */

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react'
import type { GeneAggregated } from '@/types/variant.types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.helixinsight.bio'

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

  // Auto-cleanup when session changes or becomes null
  useEffect(() => {
    // Case 1: Session cleared - cleanup all data
    if (sessionId === null) {
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

    // Case 3: New session - clear old data
    console.log('[VariantsResultsContext] Session changed - clearing old data')
    currentSessionId.current = sessionId
    setAllGenes([])
    setTotalVariants(0)
    setLoadProgress(0)
    setError(null)
    setIsLoading(false)
  }, [sessionId])

  // Load all variants via streaming
  const loadAllVariants = useCallback(async (sessionId: string) => {
    setIsLoading(true)
    setLoadProgress(0)
    setError(null)
    setAllGenes([])

    try {
      console.log('[VariantsResultsContext] Starting streaming load...')

      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionId}/variants/stream/by-gene`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      console.log('[VariantsResultsContext] Response headers:', {
        contentType: response.headers.get('content-type'),
        contentEncoding: response.headers.get('content-encoding'),
      })

      // CRITICAL: Browser automatically decompresses based on Content-Encoding header!
      // Do NOT use DecompressionStream - it fails with our zlib streaming format.
      // Just read the body as text - browser handles decompression transparently.
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader()

      let buffer = ''
      let loadedGenes: GeneAggregated[] = []
      let totalGenesCount = 0
      let totalVariantsCount = 0

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
              totalVariantsCount = parsed.total_variants
              console.log(`[VariantsResultsContext] Streaming ${totalGenesCount} genes, ${totalVariantsCount} variants...`)
            } else if (parsed.type === 'gene') {
              loadedGenes.push(parsed.data)

              // Update progress every 100 genes
              if (loadedGenes.length % 100 === 0) {
                const progress = totalGenesCount > 0
                  ? Math.round((loadedGenes.length / totalGenesCount) * 100)
                  : 0
                setLoadProgress(progress)

                // Update state in batches for performance
                setAllGenes([...loadedGenes])
              }
            } else if (parsed.type === 'complete') {
              console.log(`[VariantsResultsContext] Streaming complete: ${parsed.total_streamed} genes loaded`)
            }
          } catch (e) {
            console.warn('[VariantsResultsContext] Failed to parse line:', e)
          }
        }
      }

      // Final update
      setAllGenes(loadedGenes)
      setTotalVariants(totalVariantsCount)
      setLoadProgress(100)
      setIsLoading(false)

      console.log(`[VariantsResultsContext] All data loaded locally: ${loadedGenes.length} genes`)

    } catch (err) {
      console.error('[VariantsResultsContext] Streaming failed:', err)
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
