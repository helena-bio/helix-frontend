/**
 * Hook for fetching individual HPO term with definition
 * Used for lazy loading definitions when expanding cards
 */

import { useQuery } from '@tanstack/react-query'
import { getHPOTerm } from '@/lib/api/hpo'

export function useHPOTerm(hpoId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['hpo-term', hpoId],
    queryFn: () => getHPOTerm(hpoId!),
    enabled: enabled && !!hpoId,
    staleTime: Infinity, // HPO definitions don't change
    gcTime: 1000 * 60 * 60, // Cache for 1 hour
  })
}
