/**
 * API Response Types
 * Matching backend service responses
 */

// Variant Analysis Service Types
export interface Case {
  case_id: string
  patient_age?: number
  sex?: string
  sequencing_type: 'wes' | 'wgs' | 'panel'
  genome_build: string
  status: string
  created_at: string
  updated_at: string
}

export interface Variant {
  variant_id: string
  case_id: string
  chromosome: string
  position: number
  reference_allele: string
  alternate_allele: string
  gene_symbol: string
  hgvs_genomic?: string
  hgvs_cdna?: string
  hgvs_protein?: string
  acmg_class: string
  gnomad_af?: number
  clinvar_significance?: string
  consequence: string
}

export interface UploadVCFResponse {
  case_id: string
  status: string
  total_variants: number
  message: string
}

export interface AnalysisResults {
  case_id: string
  total_variants: number
  pathogenic_count: number
  likely_pathogenic_count: number
  vus_count: number
  variants: Variant[]
}
