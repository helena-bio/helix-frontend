/**
 * Variant Analysis Mutations
 * React Query mutations for upload and processing
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadVCFFile, startProcessing } from '@/lib/api/variant-analysis'
import { useAnalysis } from '@/contexts/AnalysisContext'
import type { AnalysisSession } from '@/types/variant.types'
import { toast } from 'sonner'

/**
 * Upload VCF file mutation
 */
export function useUploadVCF() {
  const queryClient = useQueryClient()
  const { setCurrentSessionId } = useAnalysis()

  return useMutation({
    mutationFn: async ({
      file,
      analysisType = 'germline',
      genomeBuild = 'GRCh38',
    }: {
      file: File
      analysisType?: string
      genomeBuild?: string
    }) => {
      return uploadVCFFile(file, analysisType, genomeBuild)
    },
    onSuccess: (session: AnalysisSession) => {
      // Set current session
      setCurrentSessionId(session.id)

      // Cache session data
      queryClient.setQueryData(['session', session.id], session)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })

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
 * Start processing pipeline mutation
 */
export function useStartProcessing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      vcfFilePath,
    }: {
      sessionId: string
      vcfFilePath: string
    }) => {
      return startProcessing(sessionId, vcfFilePath)
    },
    onSuccess: (data, variables) => {
      // Invalidate session to refetch status
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
