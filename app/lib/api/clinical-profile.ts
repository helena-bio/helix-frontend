/**
 * Patient Phenotype API Client
 *
 * Functions for managing HPO terms and clinical notes.
 * Uses phenotype service endpoint: /sessions/{id}/phenotype
 */

import type { HPOTerm } from "./hpo"
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001'

export interface PatientPhenotype {
  id: string
  session_id: string
  hpo_terms: HPOTerm[]
  clinical_notes: string
  term_count: number
}

export interface SavePhenotypeRequest {
  hpo_terms: HPOTerm[]
  clinical_notes?: string
}

export interface SavePhenotypeResponse extends PatientPhenotype {
  message: string
}

/**
 * Get patient phenotype (HPO terms) for a session
 */
export async function getPatientPhenotype(sessionId: string): Promise<PatientPhenotype | null> {
  const url = `${API_URL}/phenotype/api/sessions/${sessionId}/phenotype`
  const response = await fetch(url)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to get patient phenotype: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Save patient phenotype (HPO terms) for a session
 */
export async function savePatientPhenotype(
  sessionId: string,
  data: SavePhenotypeRequest
): Promise<SavePhenotypeResponse> {
  const url = `${API_URL}/phenotype/api/sessions/${sessionId}/phenotype`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Failed to save patient phenotype: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Delete patient phenotype for a session
 */
export async function deletePatientPhenotype(
  sessionId: string
): Promise<{ session_id: string; deleted: boolean; message: string }> {
  const url = `${API_URL}/phenotype/api/sessions/${sessionId}/phenotype`
  const response = await fetch(url, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete patient phenotype: ${response.statusText}`)
  }

  return response.json()
}
