/**
 * Phenotype Matching Mutation Hooks
 *
 * Hooks for matching patient phenotypes against variant phenotypes.
 */
import { useMutation } from '@tanstack/react-query'
import {
  matchVariantPhenotypes,
  runSessionPhenotypeMatching,
  MatchVariantPhenotypesRequest,
  MatchVariantPhenotypesResponse,
  RunSessionMatchingRequest,
  RunSessionMatchingResponse,
} from '@/lib/api/hpo'

/**
 * Hook for matching variants (old API - transfers variants over HTTP)
 */
export function usePhenotypeMatching() {
  return useMutation<
    MatchVariantPhenotypesResponse,
    Error,
    MatchVariantPhenotypesRequest
  >({
    mutationFn: matchVariantPhenotypes,
  })
}

/**
 * Hook for session-based phenotype matching (new API - reads from DuckDB)
 * This is the preferred method - no need to transfer variants over HTTP
 */
export function useRunPhenotypeMatching() {
  return useMutation<
    RunSessionMatchingResponse,
    Error,
    RunSessionMatchingRequest
  >({
    mutationFn: runSessionPhenotypeMatching,
  })
}
