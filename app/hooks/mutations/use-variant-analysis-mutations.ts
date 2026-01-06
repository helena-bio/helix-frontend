/**
 * Variant Analysis Mutation Hooks
 * React Query hooks for POST/PUT/DELETE operations
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import * as api from '@/lib/api/variant-analysis'
import { variantAnalysisKeys } from '@/hooks/queries/use-variant-analysis-queries'
import type { 
  AnalysisSession,
  ACMGClassificationRequest,
  ACMGClassificationResponse,
  ExportRequest
} from '@/types/variant.types'

// Create Session
export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation<AnalysisSession, Error, { filename: string }>({
    mutationFn: ({ filename }) => api.createSession(filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantAnalysisKeys.sessions() })
    },
  })
}

// Upload VCF
export function useUploadVCF() {
  const queryClient = useQueryClient()

  return useMutation<{ session_id: string; message: string }, Error, { file: File; sessionId?: string }>({
    mutationFn: ({ file, sessionId }) => api.uploadVCF(file, sessionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: variantAnalysisKeys.session(data.session_id) 
      })
      queryClient.invalidateQueries({ queryKey: variantAnalysisKeys.sessions() })
    },
  })
}

// Validate VCF
export function useValidateVCF() {
  const queryClient = useQueryClient()

  return useMutation<{ status: string; qc_metrics: any }, Error, { sessionId: string }>({
    mutationFn: ({ sessionId }) => api.validateVCF(sessionId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: variantAnalysisKeys.session(variables.sessionId) 
      })
      queryClient.setQueryData(
        variantAnalysisKeys.qc(variables.sessionId),
        data.qc_metrics
      )
    },
  })
}

// Classify Variant (ACMG)
export function useClassifyVariant() {
  const queryClient = useQueryClient()

  return useMutation<ACMGClassificationResponse, Error, { sessionId: string; request: ACMGClassificationRequest }>({
    mutationFn: ({ sessionId, request }) => api.classifyVariant(sessionId, request),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: variantAnalysisKeys.variants(variables.sessionId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: variantAnalysisKeys.variant(variables.sessionId, data.variant_id) 
      })
    },
  })
}

// Export Variants
export function useExportVariants() {
  return useMutation<Blob, Error, { sessionId: string; request: ExportRequest }>({
    mutationFn: ({ sessionId, request }) => api.exportVariants(sessionId, request),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `variants_export.${variables.request.format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    },
  })
}

// Composite Hook: Upload + Validate Flow
export interface UploadAndValidateParams {
  file: File
  sessionId?: string
}

export function useUploadAndValidate() {
  const uploadMutation = useUploadVCF()
  const validateMutation = useValidateVCF()

  return {
    upload: uploadMutation.mutateAsync,
    validate: validateMutation.mutateAsync,
    
    uploadAndValidate: async (params: UploadAndValidateParams) => {
      const uploadResult = await uploadMutation.mutateAsync(params)
      const validateResult = await validateMutation.mutateAsync({
        sessionId: uploadResult.session_id,
      })
      
      return {
        sessionId: uploadResult.session_id,
        qcMetrics: validateResult.qc_metrics,
      }
    },
    
    isLoading: uploadMutation.isPending || validateMutation.isPending,
    error: uploadMutation.error || validateMutation.error,
  }
}
