/**
 * Literature Search Hook
 * Triggers clinical literature search with genes and HPO terms
 * Session-based: requires sessionId parameter
 */
import { useMutation } from '@tanstack/react-query'
import { searchClinicalLiterature, buildLiteratureSearchRequest } from '@/lib/api/literature'

interface RunLiteratureSearchParams {
  sessionId: string
  genes: string[]
  hpoTerms: Array<{ hpo_id: string; name: string }>
  variants?: Array<{ gene_symbol: string; hgvs_protein?: string; hgvs_cdna?: string }>
  limit?: number
}

export function useRunLiteratureSearch() {
  return useMutation({
    mutationFn: async (params: RunLiteratureSearchParams) => {
      const request = buildLiteratureSearchRequest(
        params.genes,
        params.hpoTerms,
        params.variants,
      )

      if (params.limit) {
        request.limit = params.limit
      }

      return searchClinicalLiterature(params.sessionId, request)
    },
  })
}
