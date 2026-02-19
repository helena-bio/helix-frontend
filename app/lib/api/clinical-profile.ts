/**
 * Clinical Profile API Client
 *
 * Save/load complete clinical profile as NDJSON on disk.
 * Endpoint: /sessions/{id}/clinical-profile (variant analysis service)
 *
 * Replaces the old postgres-based phenotype endpoints.
 */

import { get, post, del } from './client'
import type { HPOTerm } from './hpo'
import type {
  Demographics,
  EthnicityData,
  ClinicalContext,
  ReproductiveContext,
  SampleInfo,
  ConsentPreferences,
} from '@/types/clinical-profile.types'

/**
 * Modules enablement (persisted with profile)
 */
export interface ModulesData {
  enable_screening: boolean
  enable_phenotype_matching: boolean
  enable_clinical_report?: boolean
}

/**
 * Phenotype data (HPO terms + clinical notes)
 */
export interface PhenotypeData {
  hpo_terms: HPOTerm[]
  clinical_notes?: string
}

/**
 * Full clinical profile request (sent to backend)
 */
export interface ClinicalProfileRequest {
  demographics: Demographics
  modules?: ModulesData
  ethnicity?: EthnicityData
  clinical_context?: ClinicalContext
  reproductive?: ReproductiveContext
  sample_info?: SampleInfo
  consent?: ConsentPreferences
  phenotype?: PhenotypeData
}

/**
 * Clinical profile as loaded from disk (backend response)
 */
export interface ClinicalProfileResponse {
  session_id: string
  saved_at: number
  version: string
  demographics?: Demographics
  modules?: ModulesData
  ethnicity?: EthnicityData
  clinical_context?: ClinicalContext
  reproductive?: ReproductiveContext
  sample_info?: SampleInfo
  consent?: ConsentPreferences
  phenotype?: PhenotypeData
}

/**
 * Save complete clinical profile to disk (NDJSON)
 */
export async function saveClinicalProfile(
  sessionId: string,
  data: ClinicalProfileRequest
): Promise<{ message: string; session_id: string; saved_at: number }> {
  return post(`/sessions/${sessionId}/clinical-profile`, data)
}

/**
 * Load clinical profile from disk (NDJSON)
 * Returns null-like 404 handled by caller
 */
export async function getClinicalProfile(
  sessionId: string
): Promise<ClinicalProfileResponse | null> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost'
    const { tokenUtils } = await import('@/lib/auth/token')
    const token = tokenUtils.get()

    const response = await fetch(`${API_URL}/sessions/${sessionId}/clinical-profile`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    if (response.status === 404) return null
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const text = await response.text()
    const lines = text.trim().split('\n').filter(Boolean)

    // Parse NDJSON: merge all typed records into a single response object
    const result: Partial<ClinicalProfileResponse> = {}

    for (const line of lines) {
      try {
        const record = JSON.parse(line)
        switch (record.type) {
          case 'metadata':
            result.session_id = record.session_id
            result.saved_at = record.saved_at
            result.version = record.version
            break
          case 'demographics':
            result.demographics = record.data
            break
          case 'modules':
            result.modules = record.data
            break
          case 'ethnicity':
            result.ethnicity = record.data
            break
          case 'clinical_context':
            result.clinical_context = record.data
            break
          case 'reproductive':
            result.reproductive = record.data
            break
          case 'sample_info':
            result.sample_info = record.data
            break
          case 'consent':
            result.consent = record.data
            break
          case 'phenotype':
            result.phenotype = record.data
            break
        }
      } catch {
        // Skip malformed lines
      }
    }

    return result as ClinicalProfileResponse
  } catch (error: any) {
    if (error?.status === 404 || error?.message?.includes('404')) {
      return null
    }
    throw error
  }
}

/**
 * Delete clinical profile from disk
 */
export async function deleteClinicalProfile(
  sessionId: string
): Promise<{ session_id: string; deleted: boolean; message: string }> {
  return del(`/sessions/${sessionId}/clinical-profile`)
}
