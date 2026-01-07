/**
 * HPO API Client
 * 
 * Functions for searching and fetching HPO terms from Phenotype Matching Service.
 */

import { apiClient } from './client'

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

  const response = await apiClient.get<HPOSearchResponse>(
    `/hpo/search?${params.toString()}`,
    {
      baseURL: process.env.NEXT_PUBLIC_PHENOTYPE_API_URL || 'http://localhost:9004/api',
    }
  )

  return response
}

/**
 * Get HPO term by ID.
 */
export async function getHPOTerm(termId: string): Promise<HPOTerm> {
  const response = await apiClient.get<HPOTerm>(
    `/hpo/term/${termId}`,
    {
      baseURL: process.env.NEXT_PUBLIC_PHENOTYPE_API_URL || 'http://localhost:9004/api',
    }
  )

  return response
}
