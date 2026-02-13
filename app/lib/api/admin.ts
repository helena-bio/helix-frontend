/**
 * Admin API
 *
 * Endpoints for organization team management.
 * All endpoints require admin role.
 */
import { get, put, post, del } from './client'

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

export interface AdminResetPasswordResponse {
  temporary_password: string
  user_email: string
  message: string
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

export async function adminResetPassword(
  userId: string,
): Promise<AdminResetPasswordResponse> {
  return post<AdminResetPasswordResponse>(`/admin/team/${userId}/reset-password`, {})
}

export async function removeMember(
  userId: string,
): Promise<void> {
  return del<void>(`/admin/team/${userId}`)
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
