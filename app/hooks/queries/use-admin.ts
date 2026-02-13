/**
 * Admin Query Hooks
 *
 * React Query hooks for admin team management data.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchTeamMembers, fetchOrgInvitations } from '@/lib/api/admin'

export function useTeamMembers() {
  return useQuery({
    queryKey: ['admin', 'team-members'],
    queryFn: () => fetchTeamMembers(),
    staleTime: 30_000,
  })
}

export function useOrgInvitations() {
  return useQuery({
    queryKey: ['admin', 'invitations'],
    queryFn: () => fetchOrgInvitations(),
    staleTime: 30_000,
  })
}
