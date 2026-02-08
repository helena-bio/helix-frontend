/**
 * Variant Analysis API Client
 * Production-ready API endpoints for Helix Insight backend
 */

import { uploadFileWithProgress, get, post } from './client'
import type {
  AnalysisSession,
  QCMetrics,
  Variant,
  VariantsResponse,
  VariantFilters,
  GeneAggregatedResponse,
  GeneAggregatedFilters,
} from '@/types/variant.types'

/**
 * Backend upload response (uses session_id)
 */
interface UploadVCFBackendResponse {
  session_id: string
  filename: string
  file_size: number
  file_path: string
  analysis_type: string
  genome_build: string
  status: string
  message: string
}

/**
 * Upload VCF file and create session with progress tracking
 * Transforms backend response to match AnalysisSession type
 */
export async function uploadVCFFile(
  file: File,
  analysisType: string = 'germline',
  genomeBuild: string = 'GRCh38',
  caseLabel: string = '',
  onProgress?: (progress: number) => void
): Promise<AnalysisSession> {
  const response = await uploadFileWithProgress<UploadVCFBackendResponse>(
    '/upload/vcf',
    file,
    {
      analysis_type: analysisType,
      genome_build: genomeBuild,
      case_label: caseLabel,
    },
    onProgress
  )

  // Transform backend response to AnalysisSession
  return {
    id: response.session_id,
    user_id: '',
    case_label: caseLabel || file.name.replace(/\.vcf(\.gz)?$/, ''),
    analysis_type: response.analysis_type,
    status: response.status as AnalysisSession['status'],
    vcf_file_path: response.file_path,
    original_filename: file.name,
    genome_build: response.genome_build,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    error_message: null,
  }
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<AnalysisSession> {
  return get<AnalysisSession>(`/sessions/${sessionId}`)
}

/**
 * Start VCF validation task
 * This validates the VCF file format before processing
 */
export async function startValidation(
  sessionId: string
): Promise<{ task_id: string; session_id: string; status: string; message: string }> {
  return post(`/tasks/validate/${sessionId}`, {})
}

/**
 * Start processing pipeline
 */
export async function startProcessing(
  sessionId: string,
  vcfFilePath: string
): Promise<{ task_id: string; session_id: string; status: string }> {
  return post(`/tasks/pipeline/start/${sessionId}`, {
    vcf_file_path: vcfFilePath,
  })
}

/**
 * Get task status (for polling)
 */
export async function getTaskStatus(
  taskId: string
): Promise<{
  task_id: string
  status: string
  info: Record<string, any>
  ready: boolean
  successful?: boolean
  failed?: boolean
  result?: any
}> {
  return get(`/tasks/${taskId}/status`)
}

/**
 * Get QC metrics
 */
export async function getQCMetrics(sessionId: string): Promise<QCMetrics> {
  return get<QCMetrics>(`/sessions/${sessionId}/qc`)
}

/**
 * Get variants with filters
 */
export async function getVariants(
  sessionId: string,
  filters?: VariantFilters
): Promise<VariantsResponse> {
  const params = new URLSearchParams()

  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.page_size) params.append('page_size', String(filters.page_size))

  if (filters?.acmg_class?.length) {
    filters.acmg_class.forEach(c => params.append('acmg_class', c))
  }

  if (filters?.genes?.length) {
    filters.genes.forEach(g => params.append('gene_symbol', g))
  }

  if (filters?.chromosomes?.length) {
    filters.chromosomes.forEach(chr => params.append('chromosomes', chr))
  }

  if (filters?.impact?.length) {
    filters.impact.forEach(i => params.append('impact', i))
  }

  if (filters?.min_cadd) params.append('min_confidence', String(filters.min_cadd))
  if (filters?.max_gnomad_af) params.append('max_gnomad_af', String(filters.max_gnomad_af))

  const queryString = params.toString()
  const url = `/sessions/${sessionId}/variants${queryString ? `?${queryString}` : ''}`

  return get<VariantsResponse>(url)
}

/**
 * Get variants grouped by gene with aggregated statistics
 * Backend handles sorting by ACMG priority, tier, and variant count
 */
export async function getVariantsByGene(
  sessionId: string,
  filters?: GeneAggregatedFilters
): Promise<GeneAggregatedResponse> {
  const params = new URLSearchParams()

  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.page_size) params.append('page_size', String(filters.page_size))

  if (filters?.acmg_class?.length) {
    filters.acmg_class.forEach(c => params.append('acmg_class', c))
  }

  if (filters?.impact?.length) {
    filters.impact.forEach(i => params.append('impact', i))
  }

  if (filters?.gene_symbol) {
    params.append('gene_symbol', filters.gene_symbol)
  }

  const queryString = params.toString()
  const url = `/sessions/${sessionId}/variants/by-gene${queryString ? `?${queryString}` : ''}`

  return get<GeneAggregatedResponse>(url)
}

/**
 * Get single variant detail
 */
export async function getVariant(
  sessionId: string,
  variantIdx: number
): Promise<{ variant: Variant }> {
  return get(`/sessions/${sessionId}/variants/${variantIdx}`)
}

/**
 * Statistics filter options
 */
export interface StatisticsFilters {
  acmg_class?: string[]
}

/**
 * Get variant statistics with optional ACMG filter
 * When acmg_class is provided, impact_breakdown is filtered by that ACMG class
 */
export async function getVariantStatistics(
  sessionId: string,
  filters?: StatisticsFilters
): Promise<{
  total_variants: number
  classification_breakdown: Record<string, number>
  tier_breakdown: Record<string, number>
  impact_breakdown: Record<string, number>
  top_genes: Array<{ gene_symbol: string; variant_count: number }>
}> {
  const params = new URLSearchParams()

  if (filters?.acmg_class?.length) {
    filters.acmg_class.forEach(c => params.append('acmg_class', c))
  }

  const queryString = params.toString()
  const url = `/sessions/${sessionId}/variants/statistics/summary${queryString ? `?${queryString}` : ''}`

  return get(url)
}
