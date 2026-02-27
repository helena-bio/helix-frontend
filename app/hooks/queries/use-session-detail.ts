/**
 * Session Detail Query Hooks
 *
 * React Query hooks for fetching single session and QC metrics from server.
 * These replace reading QC data from UploadContext -- server is the source of truth.
 *
 * Usage:
 *   useSessionDetail(sessionId) -- fetches AnalysisSession (status, filename, genome_build)
 *   useSessionQC(sessionId)     -- fetches QCMetrics (total_variants, ti_tv_ratio, etc.)
 */

import { useQuery } from '@tanstack/react-query'
import { getSession, getQCMetrics } from '@/lib/api/variant-analysis'
import type { AnalysisSession, QCMetrics } from '@/types/variant.types'

export const sessionDetailKeys = {
  all: ['session-detail'] as const,
  detail: (id: string) => ['session-detail', id] as const,
  qc: (id: string) => ['session-qc', id] as const,
}

/**
 * Fetch single session by ID.
 * Returns AnalysisSession with status, filename, genome_build, etc.
 *
 * FIX: placeholderData explicitly undefined so React Query does NOT
 * return stale data from a previous query key when sessionId changes.
 * Without this, switching from session A to null briefly returns A's data.
 */
export function useSessionDetail(sessionId: string | null) {
  return useQuery<AnalysisSession>({
    queryKey: sessionDetailKeys.detail(sessionId!),
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: undefined,
  })
}

/**
 * Fetch QC metrics for a validated session.
 * Returns total_variants, ti_tv_ratio, mean_depth, qc_passed, etc.
 * Only enable when session is known to be validated.
 */
export function useSessionQC(sessionId: string | null) {
  return useQuery<QCMetrics>({
    queryKey: sessionDetailKeys.qc(sessionId!),
    queryFn: () => getQCMetrics(sessionId!),
    enabled: !!sessionId,
    staleTime: 60 * 1000,
    retry: 2,
  })
}
