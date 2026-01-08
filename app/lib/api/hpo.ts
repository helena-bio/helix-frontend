/**
 * HPO API Client
 *
 * Functions for searching and fetching HPO terms from Phenotype Matching Service.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001'

export interface HPOTerm {
  hpo_id: string
  name: string
  definition?: string
  synonyms?: string[]
}

export interface HPOSearchResponse {
  terms: HPOTerm[]
  total: number
  query: string
}

export interface ExtractedTerm {
  hpo_id: string
  hpo_name: string
  start: number
  length: number
  negated: boolean
}

export interface ExtractHPOResponse {
  terms: ExtractedTerm[]
  original_text: string
  total: number
}

/**
 * Patient phenotype data structure
 */
export interface PatientPhenotype {
  id: string
  session_id: string
  hpo_terms: Array<{
    hpo_id: string
    name: string
    definition?: string
  }>
  clinical_notes: string
  term_count: number
}

export interface SavePhenotypeRequest {
  hpo_terms: Array<{
    hpo_id: string
    name: string
    definition?: string
  }>
  clinical_notes: string
}

export interface SavePhenotypeResponse extends PatientPhenotype {
  message: string
}

/**
 * Search HPO terms by query string.
 * Used for autocomplete functionality.
 */
export async function searchHPOTerms(
  query: string,
  limit: number = 10
): Promise<HPOSearchResponse> {
  if (!query || query.length < 2) {
    return { terms: [], total: 0, query }
  }

  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  })

  const url = API_URL + '/phenotype/api/hpo/search?' + params.toString()
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('HPO search failed: ' + response.statusText)
  }

  return response.json()
}

/**
 * Get HPO term by ID.
 */
export async function getHPOTerm(termId: string): Promise<HPOTerm> {
  const url = API_URL + '/phenotype/api/hpo/term/' + termId
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('HPO term not found: ' + termId)
  }

  return response.json()
}

/**
 * Extract HPO terms from clinical free text using NLP.
 */
export async function extractHPOFromText(text: string): Promise<ExtractHPOResponse> {
  if (!text || text.length < 3) {
    return { terms: [], original_text: text, total: 0 }
  }

  const url = API_URL + '/phenotype/api/hpo/extract'
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    throw new Error('HPO extraction failed: ' + response.statusText)
  }

  return response.json()
}

/**
 * Save patient phenotype data for a session.
 */
export async function savePhenotype(
  sessionId: string,
  data: SavePhenotypeRequest
): Promise<SavePhenotypeResponse> {
  const url = API_URL + '/phenotype/api/sessions/' + sessionId + '/phenotype'
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to save phenotype: ' + response.statusText)
  }

  return response.json()
}

/**
 * Get patient phenotype data for a session.
 */
export async function getPhenotype(sessionId: string): Promise<PatientPhenotype | null> {
  const url = API_URL + '/phenotype/api/sessions/' + sessionId + '/phenotype'
  const response = await fetch(url)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error('Failed to get phenotype: ' + response.statusText)
  }

  return response.json()
}

/**
 * Delete patient phenotype data for a session.
 */
export async function deletePhenotype(sessionId: string): Promise<{ deleted: boolean; message: string }> {
  const url = API_URL + '/phenotype/api/sessions/' + sessionId + '/phenotype'
  const response = await fetch(url, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete phenotype: ' + response.statusText)
  }

  return response.json()
}
