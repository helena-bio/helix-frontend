/**
 * Variant Analysis Query Hooks
 * React Query hooks for GET operations
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import * as api from '@/lib/api/variant-analysis'
import type {
  Variant,
  QCMetrics,
  AnalysisSession,
  VariantsResponse,
  VariantFilters
} from '@/types/variant.types'

// Query Keys Factory
export const variantAnalysisKeys = {
  all: ['variant-analysis'] as const,
  sessions: () => [...variantAnalysisKeys.all, 'sessions'] as const,
  session: (id: string) => [...variantAnalysisKeys.sessions(), id] as const,
  qc: (sessionId: string) => [...variantAnalysisKeys.session(sessionId), 'qc'] as const,
  variants: (sessionId: string) => [...variantAnalysisKeys.session(sessionId), 'variants'] as const,
  variantsList: (sessionId: string, filters?: VariantFilters) =>
    [...variantAnalysisKeys.variants(sessionId), 'list', filters] as const,
  variant: (sessionId: string, variantIdx: number) =>
    [...variantAnalysisKeys.variants(sessionId), variantIdx] as const,
}

// Session
export function useSession(
  sessionId: string,
  options?: { enabled?: boolean }
): UseQueryResult<AnalysisSession, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.session(sessionId),
    queryFn: () => api.getSession(sessionId),
    enabled: (options?.enabled ?? true) && !!sessionId,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  })
}

// QC Metrics
export function useQCMetrics(
  sessionId: string,
  options?: { enabled?: boolean }
): UseQueryResult<QCMetrics, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.qc(sessionId),
    queryFn: () => api.getQCMetrics(sessionId),
    enabled: (options?.enabled ?? true) && !!sessionId,
    staleTime: 10 * 60 * 1000,
    retry: 3,
  })
}

// Variants List
export function useVariants(
  sessionId: string,
  filters?: VariantFilters,
  options?: { enabled?: boolean }
): UseQueryResult<VariantsResponse, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.variantsList(sessionId, filters),
    queryFn: () => api.getVariants(sessionId, filters),
    enabled: (options?.enabled ?? true) && !!sessionId,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  })
}

// Single Variant
export function useVariant(
  sessionId: string,
  variantIdx: number,
  options?: { enabled?: boolean }
): UseQueryResult<{ variant: Variant }, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.variant(sessionId, variantIdx),
    queryFn: () => api.getVariant(sessionId, variantIdx),
    enabled: (options?.enabled ?? true) && !!sessionId,
    staleTime: 10 * 60 * 1000,
    retry: 3,
  })
}
