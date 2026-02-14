/**
 * Platform Admin API client.
 * All endpoints require is_platform_admin JWT claim.
 */
import { tokenUtils } from '@/lib/auth/token'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008'

function authHeaders(): Record<string, string> {
  const token = tokenUtils.get()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export interface PlatformOverview {
  total_organizations: number
  active_organizations: number
  suspended_organizations: number
  total_users: number
  active_users: number
  pending_users: number
  suspended_users: number
}

export interface PlatformOrganization {
  id: string
  name: string
  slug: string
  partner_tier: string
  status: string
  logo_url: string | null
  website_url: string | null
  contact_email: string | null
  member_count: number
  created_at: string
  updated_at: string
}

export interface PlatformUser {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  is_platform_admin: boolean
  organization_id: string
  organization_name: string
  last_login_at: string | null
  created_at: string
}

export interface CreateOrganizationRequest {
  name: string
  slug: string
  partner_tier: string
  website_url?: string
  contact_email: string
}

export interface UpdateOrganizationRequest {
  name?: string
  partner_tier?: string
  status?: string
  website_url?: string
  contact_email?: string
  logo_url?: string
}

export const platformApi = {
  async getOverview(): Promise<PlatformOverview> {
    const res = await fetch(`${API_URL}/api/v1/platform/overview`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch overview (${res.status})`)
    return res.json()
  },

  async listOrganizations(): Promise<{ organizations: PlatformOrganization[]; total: number }> {
    const res = await fetch(`${API_URL}/api/v1/platform/organizations`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch organizations (${res.status})`)
    return res.json()
  },

  async getOrganization(id: string): Promise<PlatformOrganization> {
    const res = await fetch(`${API_URL}/api/v1/platform/organizations/${id}`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch organization (${res.status})`)
    return res.json()
  },

  async createOrganization(data: CreateOrganizationRequest): Promise<PlatformOrganization> {
    const res = await fetch(`${API_URL}/api/v1/platform/organizations`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || `Failed to create organization (${res.status})`)
    }
    return res.json()
  },

  async updateOrganization(id: string, data: UpdateOrganizationRequest): Promise<PlatformOrganization> {
    const res = await fetch(`${API_URL}/api/v1/platform/organizations/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || `Failed to update organization (${res.status})`)
    }
    return res.json()
  },

  async listUsers(): Promise<{ users: PlatformUser[]; total: number }> {
    const res = await fetch(`${API_URL}/api/v1/platform/users`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`)
    return res.json()
  },
}
