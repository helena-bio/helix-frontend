/**
 * Variant Analysis API Client
 * Production-ready API endpoints for Helix Insight backend
 */

import { uploadFileWithProgress, get, post, patch, put, del } from './client'
import type {
  AnalysisSession,
  QCMetrics,
  Variant,
  VariantsResponse,
  VariantFilters,
  GeneAggregatedResponse,
  GeneAggregatedFilters,
  CaseNote,
  VariantOverride,
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
    organization_id: '',
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
    owner_name: null,
      pathogenic_count: 0,
      likely_pathogenic_count: 0,
  }
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<AnalysisSession> {
  return get<AnalysisSession>(`/sessions/${sessionId}`)
}

/**
 * List cases (sessions) for the authenticated user's organization.
 * mine=true: only my cases. mine=false: all org cases.
 */
export async function listCases(
  options: {
    mine?: boolean
    status?: string
    limit?: number
    offset?: number
  } = {}
): Promise<{ sessions: AnalysisSession[]; total_count: number; statistics: Record<string, any> }> {
  const { mine = true, status, limit = 100, offset = 0 } = options
  const params = new URLSearchParams()
  params.append('mine', String(mine))
  if (status) params.append('status', status)
  params.append('limit', String(limit))
  params.append('offset', String(offset))

  return get(`/sessions?${params.toString()}`)
}

/**
 * Rename a case (update case_label).
 */
export async function renameCase(
  sessionId: string,
  caseLabel: string
): Promise<AnalysisSession> {
  return patch<AnalysisSession>(`/sessions/${sessionId}`, { case_label: caseLabel })
}

/**
 * Delete a case (soft delete).
 */
export async function deleteCase(
  sessionId: string
): Promise<{ session_id: string; deleted: boolean; message: string }> {
  return del(`/sessions/${sessionId}`)
}

/**
 * Reassign case ownership to another org member.
 */
export async function reassignCase(
  sessionId: string,
  newOwnerId: string
): Promise<AnalysisSession> {
  return post<AnalysisSession>(`/sessions/${sessionId}/reassign`, { owner_id: newOwnerId })
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
 * Start processing pipeline with configurable filtering preset.
 *
 * @param filteringPreset - Quality filtering preset:
 *   strict (default): quality>=30, depth>=20, GQ>=30
 *   balanced: quality>=20, depth>=15, GQ>=20
 *   permissive: quality>=10, depth>=10, GQ>=10
 */
export async function startProcessing(
  sessionId: string,
  vcfFilePath: string,
  filteringPreset: string = 'strict'
): Promise<{ task_id: string; session_id: string; status: string }> {
  return post(`/tasks/pipeline/start/${sessionId}`, {
    vcf_file_path: vcfFilePath,
    filtering_preset: filteringPreset,
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

/**
 * Get variants for a single gene (on-demand, for lazy gene expansion)
 * Direct DuckDB query, typically <50ms
 */
export async function getGeneVariants(
  sessionId: string,
  geneSymbol: string
): Promise<{ gene_symbol: string; variant_count: number; variants: any[] }> {
  return get(`/sessions/${sessionId}/variants/by-gene/${encodeURIComponent(geneSymbol)}`)
}

// =============================================================================
// Collaboration API
// =============================================================================

/**
 * List notes for a case, optionally filtered by variant.
 */
export async function listNotes(
  sessionId: string,
  variantIdx?: number
): Promise<{ notes: CaseNote[]; total_count: number }> {
  const params = new URLSearchParams()
  if (variantIdx !== undefined) params.append('variant_idx', String(variantIdx))
  const qs = params.toString()
  return get(`/sessions/${sessionId}/notes${qs ? `?${qs}` : ''}`)
}

/**
 * Add a note to a case or variant.
 */
export async function createNote(
  sessionId: string,
  text: string,
  variantIdx?: number
): Promise<CaseNote> {
  return post<CaseNote>(`/sessions/${sessionId}/notes`, {
    text,
    variant_idx: variantIdx ?? null,
  })
}

/**
 * Update a note. Author only.
 */
export async function updateNote(
  sessionId: string,
  noteId: string,
  text: string
): Promise<CaseNote> {
  return put<CaseNote>(`/sessions/${sessionId}/notes/${noteId}`, { text })
}

/**
 * Delete a note. Author only.
 */
export async function deleteNote(
  sessionId: string,
  noteId: string
): Promise<void> {
  return del(`/sessions/${sessionId}/notes/${noteId}`)
}

/**
 * List variant overrides for a case, optionally filtered by variant.
 */
export async function listOverrides(
  sessionId: string,
  variantIdx?: number
): Promise<{ overrides: VariantOverride[]; total_count: number }> {
  const params = new URLSearchParams()
  if (variantIdx !== undefined) params.append('variant_idx', String(variantIdx))
  const qs = params.toString()
  return get(`/sessions/${sessionId}/overrides${qs ? `?${qs}` : ''}`)
}

/**
 * Reclassify a variant with clinical justification.
 */
export async function createOverride(
  sessionId: string,
  variantIdx: number,
  newClass: string,
  reason: string
): Promise<VariantOverride> {
  return post<VariantOverride>(`/sessions/${sessionId}/overrides`, {
    variant_idx: variantIdx,
    new_class: newClass,
    reason,
  })
}

// =============================================================================
// Review Board API
// =============================================================================

/**
 * List starred variants for a case.
 */
export async function listReviewBoard(
  sessionId: string
): Promise<{ items: import('@/types/variant.types').ReviewBoardItem[]; total_count: number }> {
  return get(`/sessions/${sessionId}/review-board`)
}

/**
 * Star a variant (add to review board). Case owner only.
 */
export async function starVariant(
  sessionId: string,
  variantIdx: number
): Promise<import('@/types/variant.types').ReviewBoardItem> {
  return post(`/sessions/${sessionId}/review-board`, { variant_idx: variantIdx })
}

/**
 * Unstar a variant (remove from review board). Case owner only.
 */
export async function unstarVariant(
  sessionId: string,
  variantIdx: number
): Promise<void> {
  return del(`/sessions/${sessionId}/review-board/${variantIdx}`)
}
