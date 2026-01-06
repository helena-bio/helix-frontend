/**
 * Variant Analysis Service API Client
 * Port: 9001 (Development)
 * Endpoints from 2_variant_analysis_service_lld.md
 */

import { get, post, uploadFile } from './client'
import type { Variant, QCMetrics, AnalysisSession } from '@/types/variant.types'

const SERVICE_PORT = process.env.NEXT_PUBLIC_VARIANT_ANALYSIS_PORT || '9001'
const BASE_PATH = `/api/v1/variant-analysis`

// Session Management
export async function createSession(filename: string): Promise<AnalysisSession> {
  return post<AnalysisSession>(`${BASE_PATH}/sessions`, { filename })
}

export async function getSession(sessionId: string): Promise<AnalysisSession> {
  return get<AnalysisSession>(`${BASE_PATH}/sessions/${sessionId}`)
}

export async function listSessions(): Promise<AnalysisSession[]> {
  return get<AnalysisSession[]>(`${BASE_PATH}/sessions`)
}

// File Upload
export async function uploadVCF(
  file: File,
  sessionId?: string
): Promise<{ session_id: string; message: string }> {
  const additionalFields: Record<string, string> = {}
  if (sessionId) {
    additionalFields['session_id'] = sessionId
  }
  
  return uploadFile<{ session_id: string; message: string }>(
    `${BASE_PATH}/upload`,
    file,
    additionalFields
  )
}

// Validation & QC
export async function validateVCF(
  sessionId: string
): Promise<{ status: string; qc_metrics: QCMetrics }> {
  return post<{ status: string; qc_metrics: QCMetrics }>(
    `${BASE_PATH}/sessions/${sessionId}/validate`
  )
}

export async function getQCMetrics(sessionId: string): Promise<QCMetrics> {
  return get<QCMetrics>(`${BASE_PATH}/sessions/${sessionId}/qc`)
}

// Variant Retrieval
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
  variants: Variant[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export async function getVariants(
  sessionId: string,
  filters?: VariantFilters
): Promise<VariantsResponse> {
  const params = new URLSearchParams()
  
  if (filters) {
    if (filters.acmg_class) {
      filters.acmg_class.forEach(c => params.append('acmg_class', c))
    }
    if (filters.min_cadd) params.append('min_cadd', filters.min_cadd.toString())
    if (filters.max_gnomad_af) params.append('max_gnomad_af', filters.max_gnomad_af.toString())
    if (filters.genes) {
      filters.genes.forEach(g => params.append('gene', g))
    }
    if (filters.chromosomes) {
      filters.chromosomes.forEach(c => params.append('chromosome', c))
    }
    if (filters.impact) {
      filters.impact.forEach(i => params.append('impact', i))
    }
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.page_size) params.append('page_size', filters.page_size.toString())
  }
  
  const queryString = params.toString()
  const endpoint = queryString 
    ? `${BASE_PATH}/sessions/${sessionId}/variants?${queryString}`
    : `${BASE_PATH}/sessions/${sessionId}/variants`
  
  return get<VariantsResponse>(endpoint)
}

export async function getVariant(
  sessionId: string,
  variantId: string
): Promise<Variant> {
  return get<Variant>(`${BASE_PATH}/sessions/${sessionId}/variants/${variantId}`)
}

// ACMG Classification
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

export async function classifyVariant(
  sessionId: string,
  request: ACMGClassificationRequest
): Promise<ACMGClassificationResponse> {
  return post<ACMGClassificationResponse>(
    `${BASE_PATH}/sessions/${sessionId}/classify`,
    request
  )
}

// Export
export interface ExportRequest {
  format: 'csv' | 'json' | 'vcf'
  filters?: VariantFilters
  include_annotations?: boolean
}

export async function exportVariants(
  sessionId: string,
  request: ExportRequest
): Promise<Blob> {
  // Special handling for file downloads
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}${BASE_PATH}/sessions/${sessionId}/export`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  )
  
  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`)
  }
  
  return response.blob()
}

// Health Check
export async function healthCheck(): Promise<{ status: string; version: string }> {
  return get<{ status: string; version: string }>(`/health`)
}
