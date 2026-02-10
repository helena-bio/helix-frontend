/**
 * HPO API Client
 *
 * Functions for searching and fetching HPO terms from Phenotype Matching Service.
 * Includes session-based phenotype matching with DuckDB backing.
 */

import type { PatientPhenotype, SavePhenotypeRequest, SavePhenotypeResponse } from './clinical-profile'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001'

export interface HPOTerm {
  hpo_id: string
  name: string
  definition?: string
  synonyms?: string[]
}

export interface HPOSearchResponse {
  terms: HPOTerm[]
  total: number
  query: string
}

export interface ExtractedTerm {
  hpo_id: string
  hpo_name: string
  start: number
  length: number
  negated: boolean
}

export interface ExtractHPOResponse {
  terms: ExtractedTerm[]
  original_text: string
  total: number
}

export async function searchHPOTerms(
  query: string,
  limit: number = 10
): Promise<HPOSearchResponse> {
  if (!query || query.length < 2) {
    return { terms: [], total: 0, query }
  }

  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  })

  const url = API_URL + '/phenotype/api/hpo/search?' + params.toString()
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('HPO search failed: ' + response.statusText)
  }

  return response.json()
}

export async function getHPOTerm(termId: string): Promise<HPOTerm> {
  const url = API_URL + '/phenotype/api/hpo/term/' + termId
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('HPO term not found: ' + termId)
  }

  return response.json()
}

export async function extractHPOFromText(text: string): Promise<ExtractHPOResponse> {
  if (!text || text.length < 3) {
    return { terms: [], original_text: text, total: 0 }
  }

  const url = API_URL + '/phenotype/api/hpo/extract'
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    throw new Error('HPO extraction failed: ' + response.statusText)
  }

  return response.json()
}

// Legacy functions - deprecated, use clinical-profile.ts instead
export async function savePhenotype(
  sessionId: string,
  data: SavePhenotypeRequest
): Promise<SavePhenotypeResponse> {
  const url = API_URL + '/phenotype/api/sessions/' + sessionId + '/phenotype'
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to save phenotype: ' + response.statusText)
  }

  return response.json()
}

export async function getPhenotype(sessionId: string): Promise<PatientPhenotype | null> {
  const url = API_URL + '/phenotype/api/sessions/' + sessionId + '/phenotype'
  const response = await fetch(url)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error('Failed to get phenotype: ' + response.statusText)
  }

  return response.json()
}

export async function deletePhenotype(sessionId: string): Promise<{ deleted: boolean; message: string }> {
  const url = API_URL + '/phenotype/api/sessions/' + sessionId + '/phenotype'
  const response = await fetch(url, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete phenotype: ' + response.statusText)
  }

  return response.json()
}

// ============================================
// SESSION-BASED PHENOTYPE MATCHING API
// Reads variants from DuckDB, saves results back
// ============================================

export interface RunSessionMatchingRequest {
  sessionId: string
  patientHpoIds: string[]
}

export interface RunSessionMatchingResponse {
  session_id: string
  patient_hpo_count: number
  variants_analyzed: number
  variants_with_hpo: number
  tier_1_count: number
  tier_2_count: number
  tier_3_count: number
  tier_4_count: number
  incidental_findings_count: number
  saved_to_duckdb: boolean
  message: string
}

export interface MatchSummaryResponse {
  session_id: string
  has_results: boolean
  variants_analyzed?: number
  tier_1_count?: number
  tier_2_count?: number
  tier_3_count?: number
  incidental_findings_count?: number
  tier_4_count?: number
}

export interface SimilarityMatch {
  patient_hpo_id: string
  patient_hpo_name: string
  best_match_hpo_id: string | null
  best_match_hpo_name: string | null
  similarity_score: number
}

export interface SessionMatchResult {
  variant_idx: number
  gene_symbol?: string
  phenotype_match_score: number
  matched_terms: number
  total_patient_terms: number
  total_variant_terms: number
  clinical_priority_score: number
  clinical_tier: string
  acmg_class?: string
  impact?: string
  gnomad_af?: number
  consequence?: string
  hgvs_protein?: string
  hgvs_cdna?: string
  chromosome?: string
  position?: number
  reference_allele?: string
  alternate_allele?: string
  genotype?: string
  rsid?: string
  individual_matches: SimilarityMatch[]
}

export interface SessionMatchResultsResponse {
  session_id: string
  patient_hpo_count: number
  variants_analyzed: number
  tier_1_count: number
  tier_2_count: number
  incidental_findings_count: number
  tier_3_count: number
  tier_4_count: number
  results: SessionMatchResult[]
}

/**
 * Run phenotype matching for a session.
 * Reads variants directly from DuckDB and saves results back.
 * This is the preferred method - no need to transfer variants over HTTP.
 */
export async function runSessionPhenotypeMatching(
  request: RunSessionMatchingRequest
): Promise<RunSessionMatchingResponse> {
  const url = API_URL + '/phenotype/api/sessions/' + request.sessionId + '/matching/run'
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patient_hpo_ids: request.patientHpoIds,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || 'Phenotype matching failed')
  }

  return response.json()
}

/**
 * Get phenotype matching summary for a session.
 */
export async function getMatchingSummary(sessionId: string): Promise<MatchSummaryResponse> {
  const url = API_URL + '/phenotype/api/sessions/' + sessionId + '/matching/summary'
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to get matching summary: ' + response.statusText)
  }

  return response.json()
}

/**
 * Get phenotype matching results for a session.
 */
export async function getMatchingResults(sessionId: string): Promise<SessionMatchResultsResponse> {
  const url = API_URL + '/phenotype/api/sessions/' + sessionId + '/matching/results'
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to get matching results: ' + response.statusText)
  }

  return response.json()
}

// ============================================
// ON-DEMAND GENE VARIANTS (Summary-first architecture)
// ============================================

export interface PhenotypeGeneVariantsResponse {
  gene_symbol: string
  variant_count: number
  variants: SessionMatchResult[]
}

/**
 * Fetch phenotype match variants for a single gene on-demand.
 * Called when user expands a gene card in PhenotypeMatchingView.
 */
export async function getPhenotypeGeneVariants(
  sessionId: string,
  geneSymbol: string
): Promise<PhenotypeGeneVariantsResponse> {
  const url = `${API_URL}/phenotype/api/sessions/${sessionId}/phenotype/by-gene/${encodeURIComponent(geneSymbol)}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to load variants for ${geneSymbol}: ${response.statusText}`)
  }

  return response.json()
}
