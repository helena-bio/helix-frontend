/**
 * Variant Analysis Mutations
 * React Query mutations for upload and processing
 *
 * ARCHITECTURE NOTE: useStartProcessing uses optimistic cache update
 * to immediately set session status to 'processing' + task_id.
 * This eliminates the race condition where CasesList reads stale
 * 'uploaded' status from React Query cache before backend updates.
 *
 * FIX: cancelQueries BEFORE setQueryData prevents in-flight refetches
 * from overwriting optimistic data. invalidateQueries is delayed by 5s
 * to give the Celery worker time to update status in PostgreSQL.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadVCFFile, startProcessing, reprocessSession } from '@/lib/api/variant-analysis'
import { useSession } from '@/contexts/SessionContext'
import { casesKeys } from '@/hooks/queries/use-cases'
import { invalidateSessionCaches } from '@/lib/cache/invalidate-session-caches'
import type { AnalysisSession } from '@/types/variant.types'
import { toast } from 'sonner'

/**
 * Upload VCF file mutation with progress tracking
 */
export function useUploadVCF() {
  const queryClient = useQueryClient()
  const { setCurrentSessionId } = useSession()

  return useMutation({
    mutationFn: async ({
      file,
      analysisType = 'germline',
      genomeBuild = 'GRCh38',
      caseLabel = '',
      retainFile = false,
      onProgress,
    }: {
      file: File
      analysisType?: string
      genomeBuild?: string
      caseLabel?: string
      retainFile?: boolean
      onProgress?: (progress: number) => void
    }) => {
      return uploadVCFFile(file, analysisType, genomeBuild, caseLabel, retainFile, onProgress)
    },
    onSuccess: (session: AnalysisSession) => {
      setCurrentSessionId(session.id)
      queryClient.setQueryData(['session', session.id], session)
      invalidateSessionCaches(queryClient, session.id)
      toast.success('File uploaded successfully', {
        description: `Session ${session.id} created`,
      })
    },
    onError: (error: Error) => {
      toast.error('Upload failed', {
        description: error.message,
      })
    },
  })
}

/**
 * Start processing pipeline mutation with configurable filtering preset.
 *
 * On success, performs optimistic cache update:
 * 1. CANCELS any in-flight queries to prevent stale data overwriting
 * 2. Updates session query data with status='processing' and task_id
 * 3. Updates cases list cache so sidebar immediately reflects processing state
 * 4. Delays invalidation by 5s to give Celery worker time to update PostgreSQL
 *
 * This eliminates the race condition where navigation reads stale 'uploaded'
 * status from cache before backend has updated to 'processing'.
 */
export function useStartProcessing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      vcfFilePath,
      filteringPreset = 'strict',
    }: {
      sessionId: string
      vcfFilePath: string
      filteringPreset?: string
    }) => {
      return startProcessing(sessionId, vcfFilePath, filteringPreset)
    },
    onSuccess: (data, variables) => {
      const { sessionId } = variables
      const taskId = data.task_id

      // Step 1: Cancel any in-flight queries BEFORE setting optimistic data.
      // This prevents a pending refetch from resolving AFTER our setQueryData
      // and overwriting the optimistic status with stale 'uploaded' from server.
      queryClient.cancelQueries({ queryKey: ['session', sessionId] })
      queryClient.cancelQueries({ queryKey: casesKeys.all })

      // Step 2: Optimistic update -- session detail cache
      queryClient.setQueryData<AnalysisSession>(
        ['session', sessionId],
        (old) => old ? { ...old, status: 'processing' as const, task_id: taskId } : old
      )

      // Step 3: Optimistic update -- ALL cases list queries (mine + team tabs)
      // casesKeys.all is ['cases'] which matches ['cases', 'list', {mine: true}]
      // and ['cases', 'list', {mine: false}] via prefix matching.
      queryClient.setQueriesData<{ sessions: AnalysisSession[]; total_count: number; statistics: Record<string, any> }>(
        { queryKey: casesKeys.all },
        (old) => {
          if (!old) return old
          return {
            ...old,
            sessions: old.sessions.map((s) =>
              s.id === sessionId
                ? { ...s, status: 'processing' as const, task_id: taskId }
                : s
            ),
          }
        }
      )

      // Step 4: Delay invalidation by 5 seconds to give Celery worker time
      // to pick up the task and update status to 'processing' in PostgreSQL.
      // Without this delay, the refetch would return stale 'uploaded' status
      // and overwrite our optimistic data.
      setTimeout(() => {
        invalidateSessionCaches(queryClient, sessionId)
      }, 5000)

      toast.success('Processing started', {
        description: 'Your file is being analyzed',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to start processing', {
        description: error.message,
      })
    },
  })
}

/**
 * Reprocess session mutation -- re-annotate and re-classify with latest reference data.
 * Returns 202 with task_id for polling via useTaskStatus.
 */
export function useReprocessSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      return reprocessSession(sessionId)
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['session', variables.sessionId]
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to start reprocessing', {
        description: error.message,
      })
    },
  })
}
