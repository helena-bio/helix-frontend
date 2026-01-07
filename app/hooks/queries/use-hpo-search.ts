/**
 * HPO Search Hook
 * 
 * React Query hook for searching HPO terms with debouncing.
 */

import { useQuery } from '@tanstack/react-query'
import { searchHPOTerms, type HPOSearchResponse } from '@/lib/api/hpo'

interface UseHPOSearchOptions {
  enabled?: boolean
  limit?: number
}

export function useHPOSearch(
  query: string,
  options: UseHPOSearchOptions = {}
) {
  const { enabled = true, limit = 10 } = options

  return useQuery<HPOSearchResponse>({
    queryKey: ['hpo', 'search', query, limit],
    queryFn: () => searchHPOTerms(query, limit),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes - HPO data doesn't change often
    gcTime: 1000 * 60 * 30, // 30 minutes
    placeholderData: (previousData) => previousData,
  })
}
