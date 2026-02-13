/**
 * Admin API
 *
 * Endpoints for organization team management.
 * All endpoints require admin role.
 */

import { get, put, del } from './client'

// ============================================================================
// TYPES
// ============================================================================

export interface TeamMember {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  last_login_at: string | null
  created_at: string
}

export interface TeamMemberListResponse {
  members: TeamMember[]
  total: number
}

export interface OrgInvitation {
  id: string
  token: string
  email: string
  role: string
  status: string
  invited_by_name: string | null
  expires_at: string
  created_at: string
}

export interface OrgInvitationListResponse {
  invitations: OrgInvitation[]
  total: number
}

// ============================================================================
// TEAM MEMBERS
// ============================================================================

export async function fetchTeamMembers(
  skip: number = 0,
  limit: number = 100,
): Promise<TeamMemberListResponse> {
  return get<TeamMemberListResponse>(`/admin/team?skip=${skip}&limit=${limit}`)
}

export async function changeUserRole(
  userId: string,
  role: string,
): Promise<TeamMember> {
  return put<TeamMember>(`/admin/team/${userId}/role`, { role })
}

export async function changeUserStatus(
  userId: string,
  status: string,
): Promise<TeamMember> {
  return put<TeamMember>(`/admin/team/${userId}/status`, { status })
}

// ============================================================================
// INVITATIONS
// ============================================================================

export async function fetchOrgInvitations(
  skip: number = 0,
  limit: number = 100,
): Promise<OrgInvitationListResponse> {
  return get<OrgInvitationListResponse>(`/admin/invitations?skip=${skip}&limit=${limit}`)
}

export async function revokeInvitation(
  invitationId: string,
): Promise<void> {
  return del<void>(`/admin/invitations/${invitationId}`)
}
