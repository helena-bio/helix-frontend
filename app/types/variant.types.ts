/**
 * Variant Analysis Domain Types
 * Production-ready type definitions matching backend API
 */

export interface Variant {
  id: string
  gene: string
  hgvs_cdna: string
  hgvs_protein: string
  chromosome: string
  position: number
  reference_allele: string
  alternate_allele: string
  genotype: string
  zygosity: 'Homozygous' | 'Heterozygous' | 'Hemizygous'
  acmg_class: 'Pathogenic' | 'Likely Pathogenic' | 'VUS' | 'Likely Benign' | 'Benign'
  acmg_criteria: string[]
  gnomad_af: number | null
  gnomad_ac: number | null
  gnomad_an: number | null
  cadd_score: number | null
  revel_score: number | null
  sift_prediction: string | null
  polyphen_prediction: string | null
  clinvar_significance: string | null
  clinvar_review_status: string | null
  clinvar_stars: number | null
  consequence: string
  impact: 'HIGH' | 'MODERATE' | 'LOW' | 'MODIFIER'
  biotype: string
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
  patient_id: string
  analysis_type: string
  status: 'created' | 'uploaded' | 'processing' | 'completed' | 'failed'
  vcf_file_path: string | null
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
