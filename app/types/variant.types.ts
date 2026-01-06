/**
 * Variant Analysis Domain Types
 * Production-ready type definitions for genetic variant data
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
  
  // ACMG Classification
  acmg_class: 'Pathogenic' | 'Likely Pathogenic' | 'VUS' | 'Likely Benign' | 'Benign'
  acmg_criteria: string[]
  
  // Population Frequency
  gnomad_af: number | null
  gnomad_ac: number | null
  gnomad_an: number | null
  
  // Functional Predictions
  cadd_score: number | null
  revel_score: number | null
  sift_prediction: string | null
  polyphen_prediction: string | null
  
  // ClinVar
  clinvar_significance: string | null
  clinvar_review_status: string | null
  clinvar_stars: number | null
  
  // Consequence
  consequence: string
  impact: 'HIGH' | 'MODERATE' | 'LOW' | 'MODIFIER'
  biotype: string
}

export interface QCMetrics {
  session_id: string
  total_variants: number
  snvs: number
  indels: number
  ti_tv_ratio: number
  heterozygosity_rate: number
  mean_coverage: number
  target_coverage: {
    '10x': number
    '20x': number
    '30x': number
  }
  genome_build: 'GRCh37' | 'GRCh38'
  created_at: string
}

export interface AnalysisSession {
  id: string
  filename: string
  file_size: number
  status: 'uploading' | 'validating' | 'processing' | 'completed' | 'failed'
  qc_metrics: QCMetrics | null
  created_at: string
  updated_at: string
}

// ACMG Classification Types
export interface ACMGClassificationRequest {
  variant_id: string
  manual_criteria?: string[]
  override_class?: string
}

export interface ACMGClassificationResponse {
  variant_id: string
  acmg_class: string
  acmg_criteria: string[]
  confidence_score: number
  evidence: Record<string, unknown>
}

// Export Types
export interface ExportRequest {
  format: 'csv' | 'json' | 'vcf'
  filters?: VariantFilters
  include_annotations?: boolean
}

// Variant Filters (reexport for mutations)
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
