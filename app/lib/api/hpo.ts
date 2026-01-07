/**
 * HPO API Client
 *
 * Functions for searching and fetching HPO terms from Phenotype Matching Service.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001'

export interface HPOTerm {
  id: string
  name: string
  definition?: string
  synonyms: string[]
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

  const response = await fetch(`${API_URL}/phenotype/api/hpo/search?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`HPO search failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get HPO term by ID.
 */
export async function getHPOTerm(termId: string): Promise<HPOTerm> {
  const response = await fetch(`${API_URL}/phenotype/api/hpo/term/${termId}`)

  if (!response.ok) {
    throw new Error(`HPO term not found: ${termId}`)
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

  const response = await fetch(`${API_URL}/phenotype/api/hpo/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    throw new Error(`HPO extraction failed: ${response.statusText}`)
  }

  return response.json()
}
