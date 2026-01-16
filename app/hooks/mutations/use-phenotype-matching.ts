/**
 * Phenotype Matching Mutation Hook
 *
 * Session-based phenotype matching that reads from DuckDB.
 */
import { useMutation } from '@tanstack/react-query'
import {
  runSessionPhenotypeMatching,
  RunSessionMatchingRequest,
  RunSessionMatchingResponse,
} from '@/lib/api/hpo'

/**
 * Hook for session-based phenotype matching.
 * Reads variants from DuckDB, computes matches, saves results back to DuckDB.
 */
export function useRunPhenotypeMatching() {
  return useMutation
    RunSessionMatchingResponse,
    Error,
    RunSessionMatchingRequest
  >({
    mutationFn: runSessionPhenotypeMatching,
  })
}
