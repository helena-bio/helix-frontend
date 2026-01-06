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
  variant: (sessionId: string, variantId: string) => 
    [...variantAnalysisKeys.variants(sessionId), variantId] as const,
}

// Sessions
export function useSessions(): UseQueryResult<AnalysisSession[], Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.sessions(),
    queryFn: () => api.listSessions(),
    staleTime: 30 * 1000,
  })
}

export function useSession(
  sessionId: string,
  enabled: boolean = true
): UseQueryResult<AnalysisSession, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.session(sessionId),
    queryFn: () => api.getSession(sessionId),
    enabled: enabled && !!sessionId,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  })
}

// QC Metrics
export function useQCMetrics(
  sessionId: string,
  enabled: boolean = true
): UseQueryResult<QCMetrics, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.qc(sessionId),
    queryFn: () => api.getQCMetrics(sessionId),
    enabled: enabled && !!sessionId,
    staleTime: 10 * 60 * 1000,
    retry: 3,
  })
}

// Variants List
export function useVariants(
  sessionId: string,
  filters?: VariantFilters,
  enabled: boolean = true
): UseQueryResult<VariantsResponse, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.variantsList(sessionId, filters),
    queryFn: () => api.getVariants(sessionId, filters),
    enabled: enabled && !!sessionId,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  })
}

// Single Variant
export function useVariant(
  sessionId: string,
  variantId: string,
  enabled: boolean = true
): UseQueryResult<Variant, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.variant(sessionId, variantId),
    queryFn: () => api.getVariant(sessionId, variantId),
    enabled: enabled && !!sessionId && !!variantId,
    staleTime: 10 * 60 * 1000,
    retry: 3,
  })
}

// Health Check
export function useVariantAnalysisHealth(): UseQueryResult<{ status: string; version: string }, Error> {
  return useQuery({
    queryKey: [...variantAnalysisKeys.all, 'health'],
    queryFn: () => api.healthCheck(),
    staleTime: 60 * 1000,
    retry: 1,
  })
}
