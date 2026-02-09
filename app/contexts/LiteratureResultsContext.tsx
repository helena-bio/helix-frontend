'use client'

/**
 * Literature Context - Session-Based Streaming Architecture
 *
 * NEW WORKFLOW (matching Phenotype pattern):
 * 1. runSearch() - triggers backend computation, saves to DuckDB + exports NDJSON.gz
 * 2. loadAllLiteratureResults() - streams results from pre-generated file
 * 3. Progressive loading with progress tracking
 *
 * Flow:
 * - ClinicalAnalysis Stage 3: Explicitly called after phenotype matching
 * - runSearch(genes, hpoTerms) -> loadAllLiteratureResults(sessionId)
 * - Results stream directly to context
 * - Combined scoring with phenotype clinical priority (60% clinical + 40% literature)
 * - Session cache: switching cases restores instantly (max 3 cached)
 * - Auto-cleanup when session becomes null
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode
} from 'react'
import {
  searchClinicalLiterature,
  buildLiteratureSearchRequest,
} from '@/lib/api/literature'
import { usePhenotypeResults } from './PhenotypeResultsContext'
import type {
  ClinicalSearchResponse,
  PublicationResult,
  LiteratureStatus,
  GenePublicationGroup,
  LiteratureHPOTerm,
  GeneClinicalData,
} from '@/types/literature.types'

const LITERATURE_API_URL = process.env.NEXT_PUBLIC_LITERATURE_API_URL || 'http://localhost:9004'

// Session cache
const MAX_CACHED_SESSIONS = 3

// ============================================================================
// SCORING WEIGHTS
// ============================================================================

/**
 * Weight for clinical priority score in combined calculation.
 * Higher weight = clinical relevance dominates ranking.
 */
const CLINICAL_WEIGHT = 0.6

/**
 * Weight for literature relevance score in combined calculation.
 */
const LITERATURE_WEIGHT = 0.4

// ============================================================================
// CACHE TYPE
// ============================================================================

interface LiteratureCacheEntry {
  results: PublicationResult[]
  querySummary: ClinicalSearchResponse['query_summary'] | null
  searchedGenes: string[]
  searchedHpoTerms: LiteratureHPOTerm[]
}

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface LiteratureResultsContextValue {
  // Status
  status: LiteratureStatus
  isLoading: boolean
  loadProgress: number
  error: Error | null

  // Search parameters (what was searched)
  searchedGenes: string[]
  searchedHpoTerms: LiteratureHPOTerm[]

  // Results
  results: PublicationResult[]
  totalResults: number
  querySummary: ClinicalSearchResponse['query_summary'] | null

  // Grouped by gene (sorted by combined score)
  groupedByGene: GenePublicationGroup[]

  // Counts by evidence strength
  strongCount: number
  moderateCount: number
  supportingCount: number
  weakCount: number

  // Actions
  runSearch: (
    genes: string[],
    hpoTerms: Array<{ hpo_id: string; name: string }>,
    variants?: Array<{ gene_symbol: string; hgvs_protein?: string; hgvs_cdna?: string }>,
    limit?: number
  ) => Promise<void>
  loadAllLiteratureResults: (sessionId: string) => Promise<void>
  clearResults: () => void

  // For AI context - formatted summary
  getAISummary: () => string
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Group publications by gene and apply combined scoring.
 *
 * Combined Score = (literature * 0.4) + (clinical * 0.6)
 *
 * This ensures clinically relevant genes (T1/T2 from phenotype matching)
 * rank higher than unlikely genes (T4) even if literature scores are similar.
 */
function groupPublicationsByGene(
  results: PublicationResult[],
  clinicalDataMap: Map<string, GeneClinicalData>
): GenePublicationGroup[] {
  const geneMap = new Map<string, PublicationResult[]>()

  // Group publications by gene
  results.forEach(pub => {
    pub.evidence.gene_mentions.forEach(gene => {
      if (!geneMap.has(gene)) {
        geneMap.set(gene, [])
      }
      geneMap.get(gene)!.push(pub)
    })
  })

  // Build groups with combined scoring
  const groups = Array.from(geneMap.entries()).map(([gene, publications]) => {
    const strongCount = publications.filter(p => p.evidence.evidence_strength === 'STRONG').length
    const moderateCount = publications.filter(p => p.evidence.evidence_strength === 'MODERATE').length
    const supportingCount = publications.filter(p => p.evidence.evidence_strength === 'SUPPORTING').length
    const weakCount = publications.filter(p => p.evidence.evidence_strength === 'WEAK').length
    const bestScore = Math.max(...publications.map(p => p.relevance_score))

    // Get clinical data for this gene
    const clinicalData = clinicalDataMap.get(gene)

    // Calculate combined score
    // Literature score is already 0-1, clinical score needs normalization (0-100 -> 0-1)
    const literatureNormalized = bestScore
    const clinicalNormalized = clinicalData ? clinicalData.clinicalScore / 100 : 0

    // Combined score: 60% clinical, 40% literature
    // If no clinical data, use only literature score
    const combinedScore = clinicalData
      ? (literatureNormalized * LITERATURE_WEIGHT) + (clinicalNormalized * CLINICAL_WEIGHT)
      : literatureNormalized

    return {
      gene,
      publications: publications.sort((a, b) => b.relevance_score - a.relevance_score),
      strongCount,
      moderateCount,
      supportingCount,
      weakCount,
      bestScore,
      clinicalScore: clinicalData?.clinicalScore,
      clinicalTier: clinicalData?.clinicalTier,
      phenotypeRank: clinicalData?.phenotypeRank,
      combinedScore,
    }
  })

  // Sort by combined score (descending)
  return groups.sort((a, b) => b.combinedScore - a.combinedScore)
}

function countByStrength(results: PublicationResult[]): {
  strong: number
  moderate: number
  supporting: number
  weak: number
} {
  return {
    strong: results.filter(r => r.evidence.evidence_strength === 'STRONG').length,
    moderate: results.filter(r => r.evidence.evidence_strength === 'MODERATE').length,
    supporting: results.filter(r => r.evidence.evidence_strength === 'SUPPORTING').length,
    weak: results.filter(r => r.evidence.evidence_strength === 'WEAK').length,
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const LiteratureResultsContext = createContext<LiteratureResultsContextValue | undefined>(undefined)

interface LiteratureResultsProviderProps {
  sessionId: string | null
  children: ReactNode
}

export function LiteratureResultsProvider({ sessionId, children }: LiteratureResultsProviderProps) {
  // State
  const [status, setStatus] = useState<LiteratureStatus>('idle')
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [results, setResults] = useState<PublicationResult[]>([])
  const [querySummary, setQuerySummary] = useState<ClinicalSearchResponse['query_summary'] | null>(null)
  const [searchedGenes, setSearchedGenes] = useState<string[]>([])
  const [searchedHpoTerms, setSearchedHpoTerms] = useState<LiteratureHPOTerm[]>([])

  // Refs for tracking
  const isSearching = useRef<boolean>(false)
  const currentSessionId = useRef<string | null>(null)

  // Refs mirroring state for cache saves
  const resultsRef = useRef<PublicationResult[]>([])
  const querySummaryRef = useRef<ClinicalSearchResponse['query_summary'] | null>(null)
  const searchedGenesRef = useRef<string[]>([])
  const searchedHpoTermsRef = useRef<LiteratureHPOTerm[]>([])

  useEffect(() => { resultsRef.current = results }, [results])
  useEffect(() => { querySummaryRef.current = querySummary }, [querySummary])
  useEffect(() => { searchedGenesRef.current = searchedGenes }, [searchedGenes])
  useEffect(() => { searchedHpoTermsRef.current = searchedHpoTerms }, [searchedHpoTerms])

  // Session cache
  const sessionCache = useRef<Map<string, LiteratureCacheEntry>>(new Map())

  const saveToCache = useCallback((id: string, entry: LiteratureCacheEntry) => {
    if (entry.results.length === 0) return

    sessionCache.current.set(id, entry)
    if (sessionCache.current.size > MAX_CACHED_SESSIONS) {
      const oldest = sessionCache.current.keys().next().value
      if (oldest) sessionCache.current.delete(oldest)
    }
  }, [])

  const getCurrentCacheEntry = useCallback((): LiteratureCacheEntry => ({
    results: resultsRef.current,
    querySummary: querySummaryRef.current,
    searchedGenes: searchedGenesRef.current,
    searchedHpoTerms: searchedHpoTermsRef.current,
  }), [])

  // Get phenotype matching results for combined scoring
  const { aggregatedResults } = usePhenotypeResults()

  // Build clinical data map from phenotype matching results
  const clinicalDataMap = useMemo(() => {
    const map = new Map<string, GeneClinicalData>()
    if (aggregatedResults) {
      aggregatedResults.forEach(result => {
        map.set(result.gene_symbol, {
          clinicalScore: result.best_clinical_score,
          clinicalTier: result.best_tier,
          phenotypeRank: result.rank,
        })
      })
    }
    return map
  }, [aggregatedResults])

  // Auto-cleanup and cache management when session changes
  useEffect(() => {
    const prevId = currentSessionId.current

    // Case 1: Session cleared
    if (sessionId === null) {
      if (prevId) saveToCache(prevId, getCurrentCacheEntry())
      console.log('[LiteratureResultsContext] Session cleared - resetting literature results')
      currentSessionId.current = null
      setResults([])
      setStatus('idle')
      setError(null)
      setLoadProgress(0)
      setQuerySummary(null)
      setSearchedGenes([])
      setSearchedHpoTerms([])
      return
    }

    // Case 2: Same session - do nothing
    if (sessionId === currentSessionId.current) return

    // Case 3: New session - save current, check cache
    if (prevId) saveToCache(prevId, getCurrentCacheEntry())

    currentSessionId.current = sessionId

    const cached = sessionCache.current.get(sessionId)
    if (cached) {
      console.log(`[LiteratureResultsContext] Cache hit for ${sessionId} - restoring ${cached.results.length} publications`)
      sessionCache.current.delete(sessionId)
      sessionCache.current.set(sessionId, cached)
      setResults(cached.results)
      setQuerySummary(cached.querySummary)
      setSearchedGenes(cached.searchedGenes)
      setSearchedHpoTerms(cached.searchedHpoTerms)
      setLoadProgress(100)
      setError(null)
      setStatus('success')
      return
    }

    console.log(`[LiteratureResultsContext] Cache miss for ${sessionId}`)
    setResults([])
    setStatus('idle')
    setError(null)
    setLoadProgress(0)
    setQuerySummary(null)
    setSearchedGenes([])
    setSearchedHpoTerms([])
  }, [sessionId, saveToCache, getCurrentCacheEntry])

  // Run literature search (trigger backend computation only)
  const runSearch = useCallback(async (
    genes: string[],
    hpoTerms: Array<{ hpo_id: string; name: string }>,
    variants?: Array<{ gene_symbol: string; hgvs_protein?: string; hgvs_cdna?: string }>,
    limit: number = 50
  ) => {
    console.log('[LiteratureResultsContext] runSearch called')
    console.log('  sessionId:', sessionId)
    console.log('  genes:', genes.length)
    console.log('  hpoTerms:', hpoTerms.length)

    if (!sessionId) {
      console.warn('[LiteratureResultsContext] Cannot run search - no session')
      return
    }

    if (genes.length === 0) {
      console.log('[LiteratureResultsContext] No genes provided, skipping search')
      setStatus('no_data')
      return
    }

    if (hpoTerms.length === 0) {
      console.log('[LiteratureResultsContext] No phenotypes provided, skipping search')
      setStatus('no_data')
      return
    }

    // Prevent concurrent searches
    if (isSearching.current) {
      console.log('[LiteratureResultsContext] Search already in progress, skipping')
      return
    }

    isSearching.current = true
    setStatus('loading')
    setError(null)
    setSearchedGenes(genes)
    setSearchedHpoTerms(hpoTerms.map(t => ({ id: t.hpo_id, name: t.name })))

    try {
      const request = buildLiteratureSearchRequest(genes, hpoTerms, variants)
      request.limit = limit

      console.log('[LiteratureResultsContext] Calling session literature search API...')
      const response = await searchClinicalLiterature(sessionId, request)

      console.log('[LiteratureResultsContext] Search complete:', {
        totalResults: response.total_results,
        searchTimeMs: response.query_summary.search_time_ms,
      })

      setQuerySummary(response.query_summary)

      if (response.results.length === 0) {
        console.warn('[LiteratureResultsContext] No publications found')
        setStatus('no_data')
        setResults([])
        return
      }

      // NOTE: Don't set results here - caller will call loadAllLiteratureResults()
      setStatus('success')
    } catch (err) {
      console.error('[LiteratureResultsContext] Search failed:', err)
      setError(err as Error)
      setStatus('error')
      throw err
    } finally {
      isSearching.current = false
    }
  }, [sessionId])

  // Load all literature results via streaming (like phenotype matching!)
  const loadAllLiteratureResults = useCallback(async (sessionId: string) => {
    setStatus('loading')
    setLoadProgress(0)
    setError(null)
    setResults([])

    try {
      console.log('[LiteratureResultsContext] Starting streaming load...')

      const response = await fetch(
        `${LITERATURE_API_URL}/api/v1/sessions/${sessionId}/literature/stream`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      console.log('[LiteratureResultsContext] Response headers:', {
        contentType: response.headers.get('content-type'),
        contentEncoding: response.headers.get('content-encoding'),
      })

      // Browser automatically decompresses based on Content-Encoding header
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader()

      let buffer = ''
      let loadedResults: PublicationResult[] = []
      let totalCount = 0

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
              totalCount = parsed.summary.total_results
              console.log(`[LiteratureResultsContext] Streaming ${totalCount} publications...`)
            } else if (parsed.type === 'result') {
              loadedResults.push(parsed.data)

              // Update progress every 10 results
              if (loadedResults.length % 10 === 0) {
                const progress = totalCount > 0
                  ? Math.round((loadedResults.length / totalCount) * 100)
                  : 0
                setLoadProgress(progress)

                // Update state in batches for performance
                setResults([...loadedResults])
              }
            } else if (parsed.type === 'complete') {
              console.log(`[LiteratureResultsContext] Streaming complete: ${parsed.total_streamed} publications loaded`)
            }
          } catch (e) {
            console.warn('[LiteratureResultsContext] Failed to parse line:', e)
          }
        }
      }

      // Final update
      setResults(loadedResults)
      setLoadProgress(100)
      setStatus('success')

      console.log(`[LiteratureResultsContext] All data loaded: ${loadedResults.length} publications`)

    } catch (err) {
      console.error('[LiteratureResultsContext] Streaming failed:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setStatus('error')
      throw err
    }
  }, [])

  // Clear results
  const clearResults = useCallback(() => {
    setStatus('idle')
    setError(null)
    setResults([])
    setQuerySummary(null)
    setSearchedGenes([])
    setSearchedHpoTerms([])
    setLoadProgress(0)
  }, [])

  // Computed values - apply combined scoring
  const groupedByGene = useMemo(
    () => groupPublicationsByGene(results, clinicalDataMap),
    [results, clinicalDataMap]
  )
  const counts = useMemo(() => countByStrength(results), [results])

  // Generate AI summary
  const getAISummary = useCallback((): string => {
    if (results.length === 0) {
      return 'No literature search results available.'
    }

    const lines: string[] = [
      `Literature Search Results Summary:`,
      `- Genes searched: ${searchedGenes.join(', ')}`,
      `- Phenotypes: ${searchedHpoTerms.map(t => t.name).join(', ')}`,
      `- Total publications found: ${results.length}`,
      `- Evidence breakdown: ${counts.strong} strong, ${counts.moderate} moderate, ${counts.supporting} supporting, ${counts.weak} weak`,
      ``,
      `Top genes by combined score (60% clinical priority + 40% literature relevance):`,
    ]

    // Add top 5 gene groups
    groupedByGene.slice(0, 5).forEach((group, idx) => {
      const tierInfo = group.clinicalTier ? ` [${group.clinicalTier}]` : ''
      const clinicalInfo = group.clinicalScore ? `, Clinical: ${group.clinicalScore.toFixed(0)}` : ''
      lines.push(`${idx + 1}. ${group.gene}${tierInfo}`)
      lines.push(`   - Combined: ${(group.combinedScore * 100).toFixed(0)}%, Literature: ${(group.bestScore * 100).toFixed(0)}%${clinicalInfo}`)
      lines.push(`   - Publications: ${group.publications.length} (${group.strongCount} strong, ${group.moderateCount} moderate)`)
    })

    if (groupedByGene.length > 5) {
      lines.push(``)
      lines.push(`... and ${groupedByGene.length - 5} more genes`)
    }

    return lines.join('\n')
  }, [results, searchedGenes, searchedHpoTerms, counts, groupedByGene])

  // Context value
  const value = useMemo<LiteratureResultsContextValue>(() => ({
    status,
    isLoading: status === 'loading',
    loadProgress,
    error,
    searchedGenes,
    searchedHpoTerms,
    results,
    totalResults: results.length,
    querySummary,
    groupedByGene,
    strongCount: counts.strong,
    moderateCount: counts.moderate,
    supportingCount: counts.supporting,
    weakCount: counts.weak,
    runSearch,
    loadAllLiteratureResults,
    clearResults,
    getAISummary,
  }), [
    status,
    loadProgress,
    error,
    searchedGenes,
    searchedHpoTerms,
    results,
    querySummary,
    groupedByGene,
    counts,
    runSearch,
    loadAllLiteratureResults,
    clearResults,
    getAISummary,
  ])

  return (
    <LiteratureResultsContext.Provider value={value}>
      {children}
    </LiteratureResultsContext.Provider>
  )
}

export function useLiteratureResults(): LiteratureResultsContextValue {
  const context = useContext(LiteratureResultsContext)
  if (!context) {
    throw new Error('useLiteratureResults must be used within LiteratureResultsProvider')
  }
  return context
}
