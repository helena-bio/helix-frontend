"use client"

/**
 * Platform Admin Page
 *
 * Full platform visibility and control panel.
 * Only accessible by users with is_platform_admin flag.
 * Sub-sections: Overview, Organizations, Users, Activity.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Building2,
  Users2,
  Activity,
  ArrowLeft,
  Globe,
  UserCheck,
  UserX,
  Clock,
  Shield,
  ExternalLink,
  Plus,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { platformApi } from '@/lib/api/platform'
import type {
  PlatformOverview,
  PlatformOrganization,
  PlatformUser,
} from '@/lib/api/platform'
import { cn } from '@helix/shared/lib/utils'


type Section = 'overview' | 'organizations' | 'users' | 'activity'

const NAV_ITEMS: { id: Section; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'organizations', label: 'Organizations', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users2 },
  { id: 'activity', label: 'Activity', icon: Activity },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  founding_partner: { label: 'Founding Partner', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  premium: { label: 'Premium', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  standard: { label: 'Standard', color: 'bg-gray-100 text-gray-700 border-gray-300' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 border-green-300' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-800 border-red-300' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-600 border-gray-300' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
}


// =========================================================================
// OVERVIEW SECTION
// =========================================================================

function OverviewSection() {
  const [data, setData] = useState<PlatformOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    platformApi.getOverview()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-md text-muted-foreground">Loading metrics...</div>
  }

  if (!data) {
    return <div className="text-md text-muted-foreground">Failed to load metrics.</div>
  }

  const cards = [
    {
      label: 'Organizations',
      value: data.total_organizations,
      sub: `${data.active_organizations} active`,
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      label: 'Total Users',
      value: data.total_users,
      sub: `${data.active_users} active`,
      icon: Users2,
      color: 'text-green-600',
    },
    {
      label: 'Pending Users',
      value: data.pending_users,
      sub: 'Awaiting activation',
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      label: 'Suspended',
      value: data.suspended_users + data.suspended_organizations,
      sub: `${data.suspended_users} users, ${data.suspended_organizations} orgs`,
      icon: UserX,
      color: 'text-red-600',
    },
  ]

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Platform Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="border border-border rounded-lg p-5 bg-card"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-md text-muted-foreground">{card.label}</span>
                <Icon className={cn("h-5 w-5", card.color)} />
              </div>
              <p className="text-3xl font-bold tracking-tight">{card.value}</p>
              <p className="text-md text-muted-foreground mt-1">{card.sub}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}


// =========================================================================
// ORGANIZATIONS SECTION
// =========================================================================

function OrganizationsSection() {
  const [orgs, setOrgs] = useState<PlatformOrganization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    platformApi.listOrganizations()
      .then((res) => setOrgs(res.organizations))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-md text-muted-foreground">Loading organizations...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Organizations</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          New Organization
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-muted/30 text-md text-muted-foreground font-medium">
          <div className="flex-1">Organization</div>
          <div className="w-36">Tier</div>
          <div className="w-24">Status</div>
          <div className="w-20 text-right">Members</div>
          <div className="w-28 text-right">Created</div>
        </div>

        {/* Rows */}
        {orgs.map((org) => {
          const tier = TIER_CONFIG[org.partner_tier] || TIER_CONFIG.standard
          const stat = STATUS_CONFIG[org.status] || STATUS_CONFIG.active

          return (
            <div
              key={org.id}
              className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium truncate">{org.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-md text-muted-foreground truncate">{org.contact_email}</p>
                  {org.website_url && (
                    
                      href={org.website_url.startsWith('http') ? org.website_url : `https://${org.website_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-md text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="w-36">
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-md border text-md font-medium",
                  tier.color
                )}>
                  {tier.label}
                </span>
              </div>

              <div className="w-24">
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-md border text-md font-medium",
                  stat.color
                )}>
                  {stat.label}
                </span>
              </div>

              <div className="w-20 text-right">
                <span className="text-base font-medium">{org.member_count}</span>
              </div>

              <div className="w-28 text-right">
                <span className="text-md text-muted-foreground">{formatDate(org.created_at)}</span>
              </div>
            </div>
          )
        })}

        {orgs.length === 0 && (
          <div className="px-5 py-8 text-center text-md text-muted-foreground">
            No organizations found.
          </div>
        )}
      </div>
    </div>
  )
}


// =========================================================================
// USERS SECTION
// =========================================================================

function UsersSection() {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    platformApi.listUsers()
      .then((res) => setUsers(res.users))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-md text-muted-foreground">Loading users...</div>
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">All Users</h2>

      <div className="border border-border rounded-lg overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-muted/30 text-md text-muted-foreground font-medium">
          <div className="flex-1">User</div>
          <div className="w-40">Organization</div>
          <div className="w-24">Role</div>
          <div className="w-24">Status</div>
          <div className="w-28 text-right">Last Login</div>
        </div>

        {/* Rows */}
        {users.map((u) => {
          const stat = STATUS_CONFIG[u.status] || STATUS_CONFIG.active
          const roleLabel = u.role.charAt(0).toUpperCase() + u.role.slice(1)

          return (
            <div
              key={u.id}
              className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-medium truncate">{u.full_name}</p>
                  {u.is_platform_admin && (
                    <Shield className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  )}
                </div>
                <p className="text-md text-muted-foreground truncate">{u.email}</p>
              </div>

              <div className="w-40">
                <p className="text-md text-muted-foreground truncate">{u.organization_name}</p>
              </div>

              <div className="w-24">
                <span className="text-md font-medium">{roleLabel}</span>
              </div>

              <div className="w-24">
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-md border text-md font-medium",
                  stat.color
                )}>
                  {stat.label}
                </span>
              </div>

              <div className="w-28 text-right">
                <span className="text-md text-muted-foreground">{formatRelative(u.last_login_at)}</span>
              </div>
            </div>
          )
        })}

        {users.length === 0 && (
          <div className="px-5 py-8 text-center text-md text-muted-foreground">
            No users found.
          </div>
        )}
      </div>
    </div>
  )
}


// =========================================================================
// ACTIVITY SECTION (placeholder)
// =========================================================================

function ActivitySection() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
      <div className="border border-border rounded-lg p-8 text-center">
        <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-base text-muted-foreground">Cross-organization audit log coming soon.</p>
      </div>
    </div>
  )
}


// =========================================================================
// MAIN PAGE
// =========================================================================

export default function PlatformPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<Section>('overview')

  // Guard: redirect non-platform admins
  if (!user?.is_platform_admin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-base text-muted-foreground">Access denied. Platform administrator required.</p>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Sub-navigation */}
      <div className="w-56 border-r border-border bg-card shrink-0 flex flex-col">
        <div className="px-4 pt-5 pb-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </button>
          <h1 className="text-lg font-semibold mt-3">Platform Admin</h1>
        </div>

        <nav className="px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-base transition-colors",
                  isActive
                    ? "bg-accent font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl">
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'organizations' && <OrganizationsSection />}
          {activeSection === 'users' && <UsersSection />}
          {activeSection === 'activity' && <ActivitySection />}
        </div>
      </div>
    </div>
  )
}
