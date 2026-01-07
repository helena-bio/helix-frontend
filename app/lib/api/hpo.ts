/**
 * HPO API Client
 *
 * Functions for searching and fetching HPO terms from Phenotype Matching Service.
 * Uses the same base API URL as other services, with /phenotype prefix.
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

  // Use /phenotype prefix for phenotype matching service
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
