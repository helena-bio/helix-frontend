/**
 * Variant Analysis API Client
 * Production-ready API endpoints for Helix Insight backend
 */

import { uploadFile, get, post } from './client'
import type {
  AnalysisSession,
  QCMetrics,
  Variant,
  VariantsResponse,
  VariantFilters
} from '@/types/variant.types'

/**
 * Upload VCF file and create session
 */
export async function uploadVCFFile(
  file: File,
  analysisType: string = 'germline',
  genomeBuild: string = 'GRCh38'
): Promise<AnalysisSession> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('analysis_type', analysisType)
  formData.append('genome_build', genomeBuild)

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/vcf`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Upload failed')
  }

  return response.json()
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<AnalysisSession> {
  return get<AnalysisSession>(`/sessions/${sessionId}`)
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
 * Get single variant detail
 */
export async function getVariant(
  sessionId: string,
  variantIdx: number
): Promise<{ variant: Variant }> {
  return get(`/sessions/${sessionId}/variants/${variantIdx}`)
}

/**
 * Get variant statistics
 */
export async function getVariantStatistics(
  sessionId: string
): Promise<{
  total_variants: number
  classification_breakdown: Record<string, number>
  tier_breakdown: Record<string, number>
  impact_breakdown: Record<string, number>
  top_genes: Array<{ gene_symbol: string; variant_count: number }>
}> {
  return get(`/sessions/${sessionId}/variants/statistics/summary`)
}
