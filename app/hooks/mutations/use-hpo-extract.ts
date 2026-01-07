/**
 * HPO Extract Mutation Hook
 *
 * React Query mutation for extracting HPO terms from free text.
 */

import { useMutation } from '@tanstack/react-query'
import { extractHPOFromText, type ExtractHPOResponse } from '@/lib/api/hpo'

export function useHPOExtract() {
  return useMutation<ExtractHPOResponse, Error, string>({
    mutationFn: (text: string) => extractHPOFromText(text),
  })
}
