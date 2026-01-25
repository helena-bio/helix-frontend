/**
 * Screening Service API Client
 * 
 * Communicates with screening-service for age-aware variant prioritization
 */

const SCREENING_API_URL = process.env.NEXT_PUBLIC_SCREENING_API_URL || 'http://localhost:9002'

export interface ScreeningRequest {
  session_id: string
  
  // Demographics (required)
  age_years?: number
  age_days?: number
  sex: 'male' | 'female'
  
  // Recommended
  ethnicity?: string
  has_family_history?: boolean
  indication?: string
  consanguinity?: boolean
  
  // Optional
  screening_mode?: string
  patient_hpo_terms?: string[]
  sample_type?: string
  is_pregnant?: boolean
  has_parental_samples?: boolean
  has_affected_sibling?: boolean
  
  // Filtering
  max_tier1_results?: number
  min_total_score?: number
  include_tier4?: boolean
}

export interface VariantResult {
  variant_id: string
  gene_symbol: string
  hgvs_protein: string | null
  consequence: string
  acmg_class: 'Pathogenic' | 'Likely Pathogenic' | 'VUS'
  
  // Scores
  total_score: number
  constraint_score: number
  deleteriousness_score: number
  phenotype_score: number
  dosage_score: number
  consequence_score: number
  compound_het_score: number
  age_relevance_score: number
  
  // Boosts
  acmg_boost: number
  ethnicity_boost: number
  family_history_boost: number
  de_novo_boost: number
  
  // Classification
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4'
  age_group: string
  screening_mode: string
  justification: string
  clinical_actionability: 'immediate' | 'monitoring' | 'future' | 'research'
}

export interface ScreeningSummary {
  session_id: string
  total_variants_analyzed: number
  pathogenic_count: number
  likely_pathogenic_count: number
  vus_count: number
  tier1_count: number
  tier2_count: number
  tier3_count: number
  tier4_count: number
  processing_time_seconds: number
  
  // Patient context
  age_group: string
  sex: string
  ethnicity: string | null
  screening_mode: string
  has_phenotype: boolean
  has_family_history: boolean
  is_trio: boolean
  is_pregnant: boolean
}

export interface ScreeningResponse {
  summary: ScreeningSummary
  tier1_results: VariantResult[]
  tier2_results: VariantResult[]
  tier3_results: VariantResult[]
  tier4_results: VariantResult[]
  started_at: string
  completed_at: string
}

/**
 * Run screening analysis on variants
 */
export async function runScreening(request: ScreeningRequest): Promise<ScreeningResponse> {
  const response = await fetch(`${SCREENING_API_URL}/api/v1/screening/screen`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Screening failed' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Get available ethnicity options
 */
export async function getEthnicities(): Promise<Record<string, string>> {
  const response = await fetch(`${SCREENING_API_URL}/api/v1/screening/ethnicities`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch ethnicities')
  }
  
  return response.json()
}

/**
 * Get available screening modes
 */
export async function getScreeningModes(): Promise<Record<string, string>> {
  const response = await fetch(`${SCREENING_API_URL}/api/v1/screening/modes`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch screening modes')
  }
  
  return response.json()
}

/**
 * Get age group definitions
 */
export async function getAgeGroups(): Promise<Record<string, string>> {
  const response = await fetch(`${SCREENING_API_URL}/api/v1/screening/age-groups`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch age groups')
  }
  
  return response.json()
}

/**
 * Get sample type options
 */
export async function getSampleTypes(): Promise<Record<string, string>> {
  const response = await fetch(`${SCREENING_API_URL}/api/v1/screening/sample-types`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch sample types')
  }
  
  return response.json()
}
