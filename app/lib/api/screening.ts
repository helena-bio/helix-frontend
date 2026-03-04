/**
 * Screening Service API Client
 *
 * Communicates with screening-service for age-aware variant prioritization
 * and gene panel management.
 */

const SCREENING_API_URL = process.env.NEXT_PUBLIC_SCREENING_API_URL || 'http://localhost:9002'
import { tokenUtils } from '@/lib/auth/token'

// ============================================================================
// Screening Request/Response Types
// ============================================================================

export interface CustomGeneInput {
  gene_symbol: string
  priority_score?: number
  age_group_relevance?: string
  disease_name?: string
  notes?: string
}

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

  // Gene Panels
  panel_ids?: string[]
  custom_genes?: CustomGeneInput[]

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

// ============================================================================
// Gene Panel Types
// ============================================================================

export interface GenePanelResponse {
  id: string
  name: string
  description: string | null
  panel_type: string
  is_builtin: boolean
  organization_id: string | null
  gene_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GenePanelGeneResponse {
  gene_symbol: string
  priority_score: number
  age_group_relevance: string | null
  disease_name: string | null
  notes: string | null
}

// ============================================================================
// Screening API Functions
// ============================================================================

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

// ============================================================================
// Gene Panel API Functions
// ============================================================================

/**
 * Fetch available gene panels for the current user.
 * Requires JWT token for organization-scoped visibility.
 */
export async function fetchGenePanels(token?: string | null): Promise<GenePanelResponse[]> {
  const resolvedToken = token ?? tokenUtils.get()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (resolvedToken) {
    headers['Authorization'] = `Bearer ${resolvedToken}`
  }

  const response = await fetch(`${SCREENING_API_URL}/api/v1/gene-panels/`, { headers })

  if (!response.ok) {
    throw new Error('Failed to fetch gene panels')
  }

  return response.json()
}

/**
 * Fetch genes within a specific panel
 */
export async function fetchPanelGenes(
  panelId: string,
  token?: string | null,
): Promise<GenePanelGeneResponse[]> {
  const resolvedToken = token ?? tokenUtils.get()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (resolvedToken) {
    headers['Authorization'] = `Bearer ${resolvedToken}`
  }

  const response = await fetch(
    `${SCREENING_API_URL}/api/v1/gene-panels/${panelId}/genes`,
    { headers },
  )

  if (!response.ok) {
    throw new Error('Failed to fetch panel genes')
  }

  return response.json()
}


// ============================================================================
// Gene Validation & Search
// ============================================================================

export interface GeneSearchResult {
  symbol: string
  is_alias: boolean
  approved_symbol: string
  message: string | null
}

export interface GeneValidationResult {
  valid: boolean
  symbol: string
  approved_symbol: string | null
  message: string | null
}

/**
 * Search gene symbols by prefix (autocomplete).
 * Returns matching HGNC-approved symbols.
 */
export async function searchGenes(
  query: string,
  limit: number = 10,
  token?: string | null,
): Promise<GeneSearchResult[]> {
  if (!query || query.length < 2) return []

  const resolvedToken = token ?? tokenUtils.get()
  const headers: Record<string, string> = {}
  if (resolvedToken) {
    headers['Authorization'] = `Bearer ${resolvedToken}`
  }

  const response = await fetch(
    `${SCREENING_API_URL}/api/v1/gene-panels/search-genes?q=${encodeURIComponent(query)}&limit=${limit}`,
    { headers },
  )

  if (!response.ok) return []
  return response.json()
}

/**
 * Validate a gene symbol against HGNC.
 */
export async function validateGene(
  symbol: string,
  token?: string | null,
): Promise<GeneValidationResult> {
  const resolvedToken = token ?? tokenUtils.get()
  const headers: Record<string, string> = {}
  if (resolvedToken) {
    headers['Authorization'] = `Bearer ${resolvedToken}`
  }

  const response = await fetch(
    `${SCREENING_API_URL}/api/v1/gene-panels/validate-gene/${encodeURIComponent(symbol)}`,
    { headers },
  )

  if (!response.ok) {
    return { valid: false, symbol, approved_symbol: null, message: 'Validation failed' }
  }
  return response.json()
}
