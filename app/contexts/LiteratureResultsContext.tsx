/**
 * Literature Context - Clinical Literature Search Results
 *
 * Automatically triggers literature search after phenotype matching completes.
 * Implements combined scoring that integrates clinical priority from phenotype matching.
 *
 * Combined Score Formula:
 * combined = (literature_relevance * 0.4) + (clinical_priority_normalized * 0.6)
 *
 * This ensures T1/T2 genes rank higher than T4 genes even with lower literature scores.
 *
 * Flow:
 * 1. MatchedPhenotypeContext completes matching (status='success')
 * 2. LiteratureResultsContext detects change and extracts genes from results
 * 3. Auto-triggers literature search with genes + patient HPO terms
 * 4. Results grouped by gene with combined scoring applied
 * 5. Results available for display and AI context
 */
'use client'

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
import { useClinicalProfileContext } from './ClinicalProfileContext'
import type {
  ClinicalSearchResponse,
  PublicationResult,
  LiteratureStatus,
  GenePublicationGroup,
  LiteratureHPOTerm,
  GeneClinicalData,
} from '@/types/literature.types'

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
// CONTEXT TYPE
// ============================================================================

interface LiteratureResultsContextValue {
  // Status
  status: LiteratureStatus
  isLoading: boolean
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
  children: ReactNode
}

export function LiteratureResultsProvider({ children }: LiteratureResultsProviderProps) {
  // State
  const [status, setStatus] = useState<LiteratureStatus>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [results, setResults] = useState<PublicationResult[]>([])
  const [querySummary, setQuerySummary] = useState<ClinicalSearchResponse['query_summary'] | null>(null)
  const [searchedGenes, setSearchedGenes] = useState<string[]>([])
  const [searchedHpoTerms, setSearchedHpoTerms] = useState<LiteratureHPOTerm[]>([])

  // Track what we've already searched to prevent duplicate searches
  const lastSearchKey = useRef<string>('')
  const isSearching = useRef<boolean>(false)

  // Get phenotype matching results and patient HPO terms
  const { status: matchingStatus, aggregatedResults } = usePhenotypeResults()
  const { hpoTerms } = useClinicalProfileContext()
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

  // Run literature search
  const runSearch = useCallback(async (
    genes: string[],
    hpoTerms: Array<{ hpo_id: string; name: string }>,
    variants?: Array<{ gene_symbol: string; hgvs_protein?: string; hgvs_cdna?: string }>,
    limit: number = 50
  ) => {
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

      console.log('[LiteratureResultsContext] Searching literature:', {
        genes: genes.length,
        hpoTerms: hpoTerms.length,
        variants: variants?.length || 0,
      })

      const response = await searchClinicalLiterature(request)

      console.log('[LiteratureResultsContext] Search complete:', {
        totalResults: response.total_results,
        searchTimeMs: response.query_summary.search_time_ms,
      })

      setResults(response.results)
      setQuerySummary(response.query_summary)
      setStatus(response.results.length > 0 ? 'success' : 'no_data')
    } catch (err) {
      console.error('[LiteratureResultsContext] Search failed:', err)
      setError(err as Error)
      setStatus('error')
    } finally {
      isSearching.current = false
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
    lastSearchKey.current = ''
  }, [])

  // Auto-trigger literature search when phenotype matching completes
  useEffect(() => {
    // Only trigger when matching is successful and we have results
    if (matchingStatus !== 'success' || !aggregatedResults || aggregatedResults.length === 0) {
      return
    }

    // Get patient HPO terms
    const patientHpoTerms = hpoTerms
    if (patientHpoTerms.length === 0) {
      console.log('[LiteratureResultsContext] No patient HPO terms, skipping auto-search')
      return
    }

    // Extract top genes from matching results (limit to top 10 by clinical score)
    const topGenes = aggregatedResults
      .slice(0, 10)
      .map(r => r.gene_symbol)

    // Create a key to detect if we need to search again
    const searchKey = `${topGenes.join(',')}_${patientHpoTerms.map(t => t.hpo_id).join(',')}`

    // Skip if we already searched with these parameters
    if (searchKey === lastSearchKey.current) {
      console.log('[LiteratureResultsContext] Already searched with these parameters, skipping')
      return
    }

    console.log('[LiteratureResultsContext] Auto-triggering literature search after phenotype matching')
    console.log('  Genes:', topGenes)
    console.log('  HPO terms:', patientHpoTerms.length)

    lastSearchKey.current = searchKey

    // Format HPO terms for the search
    const hpoTermsForSearch = patientHpoTerms.map(t => ({
      hpo_id: t.hpo_id,
      name: t.name,
    }))

    // Trigger search (without variants for now - simpler)
    runSearch(topGenes, hpoTermsForSearch, undefined, 50)
  }, [matchingStatus, aggregatedResults, runSearch])

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
    clearResults,
    getAISummary,
  }), [
    status,
    error,
    searchedGenes,
    searchedHpoTerms,
    results,
    querySummary,
    groupedByGene,
    counts,
    runSearch,
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
