/**
 * Case Mutation Hooks
 * Rename, delete, and reprocess operations for analysis cases (sessions).
 * Invalidates cases query on success for immediate UI update.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { renameCase, deleteCase, reprocessSession } from '@/lib/api/variant-analysis'
import { casesKeys } from '@/hooks/queries/use-cases'

export function useRenameCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, caseLabel }: { sessionId: string; caseLabel: string }) =>
      renameCase(sessionId, caseLabel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: casesKeys.all })
    },
  })
}

export function useDeleteCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => deleteCase(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: casesKeys.all })
    },
  })
}

export function useReprocessCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => reprocessSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: casesKeys.all })
    },
  })
}
