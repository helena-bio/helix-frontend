/**
 * Publication Query Hook
 * Fetches publication details by PMID
 */
import { useQuery } from '@tanstack/react-query'
import { getPublication } from '@/lib/api/literature'
import type { Publication } from '@/types/literature.types'

export function usePublication(pmid: string | null) {
  return useQuery<Publication, Error>({
    queryKey: ['publication', pmid],
    queryFn: () => getPublication(pmid!),
    enabled: !!pmid,
    staleTime: 1000 * 60 * 30, // 30 minutes - publications don't change often
    gcTime: 1000 * 60 * 60, // 1 hour
  })
}
