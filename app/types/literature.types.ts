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
  include_evidence_details?: boolean
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
// PUBLICATION DETAIL TYPES (from AI Service literature API)
// ============================================================================

export interface GeneMention {
  gene_symbol: string
  gene_id: string | null
  mention_count: number
  association_type: string | null
  confidence_score: number | null
}

export interface VariantMention {
  gene_symbol: string
  hgvs_cdna: string | null
  hgvs_protein: string | null
  normalized_variant: string | null
  clinical_significance: string | null
  evidence_type: string | null
  sentence_text: string | null
  confidence_score: number | null
}

export interface Publication {
  pmid: string
  title: string
  abstract: string | null
  authors: string | null
  journal: string | null
  publication_date: string | null
  publication_types: string | null
  mesh_terms: string | null
  doi: string | null
  pmc_id: string | null
  is_retracted: boolean
  gene_mentions: GeneMention[]
  variant_mentions: VariantMention[]
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

/**
 * Clinical priority data from Phenotype Matching
 */
export interface GeneClinicalData {
  clinicalScore: number      // 0-100 from phenotype matching
  clinicalTier: string       // T1, T2, T3, T4
  phenotypeRank: number      // Rank in phenotype matching results
}

/**
 * Gene publication group with combined scoring
 *
 * Combined Score Formula:
 * combined = (literature_relevance * 0.4) + (clinical_priority * 0.6)
 *
 * This ensures clinically relevant genes (T1/T2) rank higher even if
 * they have slightly lower literature scores.
 */
export interface GenePublicationGroup {
  gene: string
  publications: PublicationResult[]
  strongCount: number
  moderateCount: number
  supportingCount: number
  weakCount: number
  // Literature score (best publication relevance, 0-1)
  bestScore: number
  // Clinical data from phenotype matching (optional - may not exist for all genes)
  clinicalScore?: number     // 0-100
  clinicalTier?: string      // T1, T2, T3, T4
  phenotypeRank?: number     // Rank in phenotype matching
  // Combined score (0-1) - used for sorting
  combinedScore: number
}
