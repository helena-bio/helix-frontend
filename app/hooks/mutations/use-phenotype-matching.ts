/**
 * Phenotype Matching Mutation Hook
 *
 * Hook for matching patient phenotypes against variant phenotypes.
 */

import { useMutation } from '@tanstack/react-query'
import {
  matchVariantPhenotypes,
  MatchVariantPhenotypesRequest,
  MatchVariantPhenotypesResponse,
} from '@/lib/api/hpo'

export function usePhenotypeMatching() {
  return useMutation <
    MatchVariantPhenotypesResponse,
    Error,
    MatchVariantPhenotypesRequest
  >({
    mutationFn: matchVariantPhenotypes,
  })
}
