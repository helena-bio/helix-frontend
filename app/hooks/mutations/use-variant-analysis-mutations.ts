/**
 * Variant Analysis Mutations
 * React Query mutations for upload and processing
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadVCFFile, startProcessing, reprocessSession } from '@/lib/api/variant-analysis'
import { useSession } from '@/contexts/SessionContext'
import { casesKeys } from '@/hooks/queries/use-cases'
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
      queryClient.invalidateQueries({ queryKey: casesKeys.all })
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
 * Start processing pipeline mutation with configurable filtering preset
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
      queryClient.invalidateQueries({
        queryKey: ['session', variables.sessionId]
      })
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
