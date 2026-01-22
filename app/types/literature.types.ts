/**
 * Literature Mining Service Types
 * Based on Clinical Search API specification
 */

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface LiteratureHPOTerm {
  id: string
  name: string
}

export interface LiteratureVariant {
  gene: string
  hgvs_protein?: string
  hgvs_cdna?: string
}

export interface ClinicalSearchRequest {
  patient_hpo_terms: LiteratureHPOTerm[]
  genes: string[]
  variants?: LiteratureVariant[]
  limit?: number
  min_year?: number
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface QuerySummary {
  genes_searched: number
  variants_searched: number
  phenotypes_searched: number
  publications_scanned: number
  search_time_ms: number
}

export interface LiteratureEvidence {
  gene_mentions: string[]
  variant_matches: string[]
  phenotype_matches: string[]
  has_exact_variant: boolean
  has_functional_data: boolean
  publication_type: string
  max_gene_mentions: number
  evidence_strength: 'STRONG' | 'MODERATE' | 'SUPPORTING' | 'WEAK'
}

export interface PublicationResult {
  pmid: string
  title: string
  abstract: string
  journal: string | null
  publication_date: string | null
  authors: string | null
  doi: string | null
  pmc_id: string | null
  relevance_score: number
  phenotype_score: number
  publication_type_score: number
  gene_centrality_score: number
  functional_data_score: number
  variant_score: number
  recency_score: number
  evidence: LiteratureEvidence
}

export interface ClinicalSearchResponse {
  query_summary: QuerySummary
  total_results: number
  results: PublicationResult[]
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export type LiteratureStatus = 'idle' | 'loading' | 'success' | 'error' | 'no_data'

export interface LiteratureSearchParams {
  genes: string[]
  hpoTerms: LiteratureHPOTerm[]
  variants?: LiteratureVariant[]
  limit?: number
  minYear?: number
}

export interface GenePublicationGroup {
  gene: string
  publications: PublicationResult[]
  strongCount: number
  moderateCount: number
  supportingCount: number
  weakCount: number
  bestScore: number
}
