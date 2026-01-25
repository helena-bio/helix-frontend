/**
 * Clinical Profile API Client
 *
 * Functions for managing patient clinical profiles including demographics,
 * ethnicity, family history, and phenotype data.
 */

import {
  ClinicalProfile,
  SaveClinicalProfileRequest,
  SaveClinicalProfileResponse,
} from '@/types/clinical-profile.types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001'

/**
 * Save or update clinical profile for a session
 */
export async function saveClinicalProfile(
  sessionId: string,
  data: SaveClinicalProfileRequest
): Promise<SaveClinicalProfileResponse> {
  const url = `${API_URL}/phenotype/api/sessions/${sessionId}/clinical-profile`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Failed to save clinical profile: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get clinical profile for a session
 */
export async function getClinicalProfile(sessionId: string): Promise<ClinicalProfile | null> {
  const url = `${API_URL}/phenotype/api/sessions/${sessionId}/clinical-profile`
  const response = await fetch(url)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to get clinical profile: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Delete clinical profile for a session
 */
export async function deleteClinicalProfile(
  sessionId: string
): Promise<{ deleted: boolean; message: string }> {
  const url = `${API_URL}/phenotype/api/sessions/${sessionId}/clinical-profile`
  const response = await fetch(url, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete clinical profile: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Update only demographics
 */
export async function updateDemographics(
  sessionId: string,
  demographics: SaveClinicalProfileRequest['demographics']
): Promise<SaveClinicalProfileResponse> {
  const url = `${API_URL}/phenotype/api/sessions/${sessionId}/clinical-profile/demographics`
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(demographics),
  })

  if (!response.ok) {
    throw new Error(`Failed to update demographics: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Update only phenotype data
 */
export async function updatePhenotype(
  sessionId: string,
  phenotype: SaveClinicalProfileRequest['phenotype']
): Promise<SaveClinicalProfileResponse> {
  const url = `${API_URL}/phenotype/api/sessions/${sessionId}/clinical-profile/phenotype`
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(phenotype),
  })

  if (!response.ok) {
    throw new Error(`Failed to update phenotype: ${response.statusText}`)
  }

  return response.json()
}
