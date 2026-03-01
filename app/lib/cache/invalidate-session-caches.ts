/**
 * Centralized session cache invalidation.
 *
 * Call this whenever a session's status changes to ensure ALL components
 * see consistent state. Invalidates:
 * 1. React Query caches (session detail, cases list, clinical profile, QC)
 * 2. Does NOT touch Context memory caches or IndexedDB -- those are
 *    keyed by sessionId and auto-update on session change.
 */
import { QueryClient } from '@tanstack/react-query'
import { variantAnalysisKeys } from '@/hooks/queries/use-variant-analysis-queries'
import { sessionDetailKeys } from '@/hooks/queries/use-session-detail'
import { casesKeys } from '@/hooks/queries/use-cases'

export function invalidateSessionCaches(
  queryClient: QueryClient,
  sessionId: string
): void {
  // Session-specific queries
  queryClient.invalidateQueries({ queryKey: variantAnalysisKeys.session(sessionId) })
  queryClient.invalidateQueries({ queryKey: sessionDetailKeys.detail(sessionId) })
  queryClient.invalidateQueries({ queryKey: sessionDetailKeys.qc(sessionId) })
  queryClient.invalidateQueries({ queryKey: ['clinical-profile', sessionId] })

  // Cases list (sidebar) -- prefix match invalidates both mine=true and mine=false
  queryClient.invalidateQueries({ queryKey: casesKeys.all })
}
