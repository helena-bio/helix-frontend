/**
 * Admin Mutation Hooks
 *
 * React Query mutations for admin team management actions.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  changeUserRole,
  changeUserStatus,
  revokeInvitation,
  adminResetPassword,
  removeMember,
  deleteInvitationPermanent,
} from '@/lib/api/admin'
import type { AdminResetPasswordResponse } from '@/lib/api/admin'

export function useChangeRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      changeUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'team-members'] })
    },
  })
}

export function useChangeStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      changeUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'team-members'] })
    },
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitations'] })
    },
  })
}

export function useAdminResetPassword() {
  return useMutation<AdminResetPasswordResponse, Error, string>({
    mutationFn: (userId: string) => adminResetPassword(userId),
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => removeMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'team-members'] })
    },
  })
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) => deleteInvitationPermanent(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitations'] })
    },
  })
}
