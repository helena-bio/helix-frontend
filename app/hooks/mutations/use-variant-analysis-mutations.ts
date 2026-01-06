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
export function useCreateSession(): UseMutationResult
  AnalysisSession,
  Error,
  { filename: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ filename }) => api.createSession(filename),
    onSuccess: () => {
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: variantAnalysisKeys.sessions() })
    },
  })
}

// Upload VCF
export function useUploadVCF(): UseMutationResult
  { session_id: string; message: string },
  Error,
  { file: File; sessionId?: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, sessionId }) => api.uploadVCF(file, sessionId),
    onSuccess: (data) => {
      // Invalidate session to refetch status
      queryClient.invalidateQueries({ 
        queryKey: variantAnalysisKeys.session(data.session_id) 
      })
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: variantAnalysisKeys.sessions() })
    },
  })
}

// Validate VCF
export function useValidateVCF(): UseMutationResult
  { status: string; qc_metrics: any },
  Error,
  { sessionId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId }) => api.validateVCF(sessionId),
    onSuccess: (data, variables) => {
      // Update session status
      queryClient.invalidateQueries({ 
        queryKey: variantAnalysisKeys.session(variables.sessionId) 
      })
      // Set QC metrics in cache
      queryClient.setQueryData(
        variantAnalysisKeys.qc(variables.sessionId),
        data.qc_metrics
      )
    },
  })
}

// Classify Variant (ACMG)
export function useClassifyVariant(): UseMutationResult
  ACMGClassificationResponse,
  Error,
  { sessionId: string; request: ACMGClassificationRequest }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, request }) => api.classifyVariant(sessionId, request),
    onSuccess: (data, variables) => {
      // Invalidate variants list to refetch with updated classification
      queryClient.invalidateQueries({ 
        queryKey: variantAnalysisKeys.variants(variables.sessionId) 
      })
      // Invalidate specific variant
      queryClient.invalidateQueries({ 
        queryKey: variantAnalysisKeys.variant(variables.sessionId, data.variant_id) 
      })
    },
  })
}

// Export Variants
export function useExportVariants(): UseMutationResult
  Blob,
  Error,
  { sessionId: string; request: ExportRequest }
> {
  return useMutation({
    mutationFn: ({ sessionId, request }) => api.exportVariants(sessionId, request),
    onSuccess: (blob, variables) => {
      // Trigger download
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
    
    // Combined flow
    uploadAndValidate: async (params: UploadAndValidateParams) => {
      // Step 1: Upload
      const uploadResult = await uploadMutation.mutateAsync(params)
      
      // Step 2: Validate
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
