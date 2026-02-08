/**
 * Variant Analysis Domain Types
 * Production-ready type definitions matching backend API and DuckDB schema
 */

export interface Variant {
  variant_idx: number
  session_id: string
  chromosome: string
  position: number
  reference_allele: string
  alternate_allele: string
  variant_type: number | null
  rsid: string | null
  gene_symbol: string | null
  gene_id: string | null
  transcript_id: string | null
  hgvs_genomic: string | null
  hgvs_cdna: string | null
  hgvs_protein: string | null
  consequence: string | null
  impact: string | null
  biotype: string | null
  exon_number: string | null
  domains: string | null
  genotype: string | null
  quality: number | null
  depth: number | null
  allelic_depth: number | null
  genotype_quality: number | null
  filter_status: string | null
  global_af: number | null
  global_ac: number | null
  global_an: number | null
  global_hom: number | null
  af_grpmax: number | null
  popmax: string | null
  clinical_significance: string | null
  review_status: string | null
  review_stars: number | null
  clinvar_variation_id: string | null
  clinvar_rsid: string | null
  disease_name: string | null
  hgvsp: number | null
  sift_pred: string | null
  sift_score: number | null
  alphamissense_pred: string | null
  alphamissense_score: number | null
  metasvm_pred: string | null
  metasvm_score: number | null
  dann_score: number | null
  phylop100way_vertebrate: number | null
  gerp_rs: number | null
  pli: number | null
  oe_lof_upper: number | null
  oe_lof: number | null
  mis_z: number | null
  hpo_ids: string | null
  hpo_names: string | null
  hpo_count: number | null
  hpo_frequency_data: string | null
  hpo_disease_ids: string | null
  hpo_gene_id: string | null
  haploinsufficiency_score: number | null
  triplosensitivity_score: number | null
  acmg_class: string | null
  acmg_criteria: string | null
  confidence_score: number | null
  pass_quality_filter: boolean | null
  pass_frequency_filter: boolean | null
  pass_impact_filter: boolean | null
  is_final_candidate: boolean | null
  compound_het_candidate: boolean | null
  priority_score: number | null
  priority_tier: number | null
  is_flagged: boolean | null
  flag_reason: number | null
  processing_notes: number | null
  raw_data: string | null
}

export interface QCMetrics {
  session_id: string
  total_variants: number
  ti_tv_ratio: number
  het_hom_ratio: number
  mean_depth: number
  pct_bases_above_10x: number
  qc_passed: boolean
  failure_reasons: string[]
}

export interface AnalysisSession {
  id: string
  user_id: string
  case_label: string | null
  analysis_type: string
  status: 'pending' | 'validated' | 'processing' | 'completed' | 'failed'
  vcf_file_path: string | null
  original_filename: string | null
  genome_build: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  error_message: string | null
}

export interface VariantFilters {
  acmg_class?: string[]
  min_cadd?: number
  max_gnomad_af?: number
  genes?: string[]
  chromosomes?: string[]
  impact?: string[]
  page?: number
  page_size?: number
}

export interface VariantsResponse {
  variants: any[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
  has_next_page: boolean
  has_previous_page: boolean
}

// =============================================================================
// Gene Aggregated Types (NEW - matches backend /by-gene endpoint)
// =============================================================================

/**
 * Single variant within a gene group
 */
export interface VariantInGene {
  variant_idx: number
  chromosome: string
  position: number
  reference_allele: string
  alternate_allele: string
  consequence: string | null
  impact: string | null
  hgvs_protein: string | null
  hgvs_cdna: string | null
  acmg_class: string | null
  acmg_criteria: string | null
  confidence_score: number | null
  priority_score: number | null
  priority_tier: number | null
  gnomad_af: number | null
  clinvar_significance: string | null
  genotype: string | null
  depth: number | null
  quality: number | null
}

/**
 * Gene with aggregated variant data
 */
export interface GeneAggregated {
  gene_symbol: string
  variant_count: number
  best_acmg_class: string | null
  best_acmg_priority: number
  best_impact: string | null
  best_tier: number | null
  best_priority_score: number | null
  pathogenic_count: number
  likely_pathogenic_count: number
  vus_count: number
  likely_benign_count: number
  benign_count: number
  variants: VariantInGene[]
}

/**
 * Response from /by-gene endpoint
 */
export interface GeneAggregatedResponse {
  genes: GeneAggregated[]
  total_genes: number
  total_variants: number
  page: number
  page_size: number
  total_pages: number
  has_next_page: boolean
  has_previous_page: boolean
}

/**
 * Filters for /by-gene endpoint
 */
export interface GeneAggregatedFilters {
  acmg_class?: string[]
  impact?: string[]
  gene_symbol?: string
  page?: number
  page_size?: number
}

export * from "./literature.types"
