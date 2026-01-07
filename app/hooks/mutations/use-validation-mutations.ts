/**
 * Validation Mutations
 * React Query mutations for VCF validation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { startValidation } from '@/lib/api/variant-analysis'
import { toast } from 'sonner'

/**
 * Start VCF validation mutation
 */
export function useStartValidation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      return startValidation(sessionId)
    },
    onSuccess: (data) => {
      toast.success('Validation started', {
        description: 'Checking VCF file format...',
      })
    },
    onError: (error: Error) => {
      toast.error('Validation failed to start', {
        description: error.message,
      })
    },
  })
}
