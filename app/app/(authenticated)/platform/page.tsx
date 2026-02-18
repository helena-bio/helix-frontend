"use client"

/**
 * Platform Admin Page
 *
 * Full platform visibility and control panel.
 * Layout matches Settings: centered max-w-5xl, left text nav, right content.
 * Only accessible by users with is_platform_admin flag.
 *
 * Sections:
 * - Overview: key metrics cards
 * - Organizations: CRUD with search, create/edit modals
 * - Users: cross-org user list with search
 * - Activity: audit log (placeholder)
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Users2,
  Clock,
  UserX,
  Shield,
  ExternalLink,
  Plus,
  Activity,
  ArrowLeft,
  X,
  Loader2,
  Search,
  Pencil,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { platformApi } from '@/lib/api/platform'
import type {
  PlatformOverview,
  PlatformOrganization,
  PlatformUser,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
} from '@/lib/api/platform'
import { Button } from '@helix/shared/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@helix/shared/lib/utils'


type Section = 'overview' | 'organizations' | 'users' | 'activity'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'organizations', label: 'Organizations' },
  { id: 'users', label: 'Users' },
  { id: 'activity', label: 'Activity' },
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
  if (mins < 60) return mins + 'm ago'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + 'd ago'
  return formatDate(dateStr)
}

const TIER_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'founding_partner', label: 'Founding Partner' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
]

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}


// =========================================================================
// MODAL BACKDROP
// =========================================================================

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}


// =========================================================================
// ORGANIZATION FORM MODAL (Create + Edit)
// =========================================================================

interface OrgFormProps {
  org?: PlatformOrganization | null
  onClose: () => void
  onSaved: () => void
}

function OrgFormModal({ org, onClose, onSaved }: OrgFormProps) {
  const isEdit = !!org
  const [name, setName] = useState(org?.name || '')
  const [slug, setSlug] = useState(org?.slug || '')
  const [tier, setTier] = useState(org?.partner_tier || 'standard')
  const [orgStatus, setOrgStatus] = useState(org?.status || 'active')
  const [contactEmail, setContactEmail] = useState(org?.contact_email || '')
  const [websiteUrl, setWebsiteUrl] = useState(org?.website_url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [autoSlug, setAutoSlug] = useState(!isEdit)

  const handleNameChange = (value: string) => {
    setName(value)
    if (autoSlug && !isEdit) {
      setSlug(slugify(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setAutoSlug(false)
    setSlug(slugify(value))
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Organization name is required'); return }
    if (!slug.trim()) { setError('Slug is required'); return }
    if (!contactEmail.trim()) { setError('Contact email is required'); return }

    setSaving(true)
    setError('')

    try {
      if (isEdit && org) {
        await platformApi.updateOrganization(org.id, {
          name: name.trim(),
          partner_tier: tier,
          status: orgStatus,
          contact_email: contactEmail.trim(),
          website_url: websiteUrl.trim() || undefined,
        })
      } else {
        await platformApi.createOrganization({
          name: name.trim(),
          slug: slug.trim(),
          partner_tier: tier,
          contact_email: contactEmail.trim(),
          website_url: websiteUrl.trim() || undefined,
        })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            {isEdit ? 'Edit Organization' : 'New Organization'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-md font-medium text-muted-foreground mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Cell Genetics"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-11"
            />
          </div>

          <div>
            <label className="block text-md font-medium text-muted-foreground mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="cell-genetics"
              disabled={isEdit}
              className={cn(
                "w-full px-3 py-2 border border-border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary h-11",
                isEdit ? "bg-muted/30 text-muted-foreground" : "bg-background text-foreground"
              )}
            />
            {!isEdit && (
              <p className="text-sm text-muted-foreground mt-1">URL-friendly identifier. Cannot be changed later.</p>
            )}
          </div>

          <div>
            <label className="block text-md font-medium text-muted-foreground mb-1">Contact email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="office@example.com"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-11"
            />
          </div>

          <div>
            <label className="block text-md font-medium text-muted-foreground mb-1">Website</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="example.com"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-11"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-md font-medium text-muted-foreground mb-1">Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-11"
              >
                {TIER_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {isEdit && (
              <div className="flex-1">
                <label className="block text-md font-medium text-muted-foreground mb-1">Status</label>
                <select
                  value={orgStatus}
                  onChange={(e) => setOrgStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-11"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <p className="text-base text-destructive">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Organization'}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-border rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}


// =========================================================================
// OVERVIEW
// =========================================================================

function OverviewContent() {
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
    { label: 'Organizations', value: data.total_organizations, sub: data.active_organizations + ' active', icon: Building2 },
    { label: 'Total Users', value: data.total_users, sub: data.active_users + ' active', icon: Users2 },
    { label: 'Pending Users', value: data.pending_users, sub: 'Awaiting activation', icon: Clock },
    { label: 'Suspended', value: data.suspended_users + data.suspended_organizations, sub: data.suspended_users + ' users, ' + data.suspended_organizations + ' orgs', icon: UserX },
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Platform Metrics</h3>
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="border border-border rounded-lg p-5 bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold">{card.label}</span>
              </div>
              <p className="text-xl font-semibold tracking-tight">{card.value}</p>
              <p className="text-md text-muted-foreground mt-1">{card.sub}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}


// =========================================================================
// ORGANIZATIONS
// =========================================================================

interface OrgCardProps {
  org: PlatformOrganization
  onEdit: (org: PlatformOrganization) => void
  onSwitch: (org: PlatformOrganization) => void
  isSwitching: string | null
}

function OrgCard({ org, onEdit, onSwitch, isSwitching }: OrgCardProps) {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const tier = TIER_CONFIG[org.partner_tier] || TIER_CONFIG.standard
  const stat = STATUS_CONFIG[org.status] || STATUS_CONFIG.active
  const isOwnOrg = user?.organization_id === org.id

  return (
    <Card className="gap-0 py-0">
      <CardHeader
        className="py-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-base font-semibold">{org.name}</span>
            <Badge variant="outline" className={cn("text-sm", tier.color)}>
              {tier.label}
            </Badge>
            <Badge variant="outline" className={cn("text-sm", stat.color)}>
              {stat.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-md text-muted-foreground">
              {org.member_count} member{org.member_count !== 1 ? 's' : ''}
            </span>
            <span className="text-md text-muted-foreground">
              {formatDate(org.created_at)}
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-base">
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Contact Email</p>
              <p className="font-medium">{org.contact_email || 'Not set'}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Website</p>
              {org.website_url ? (
                <a href={org.website_url.startsWith('http') ? org.website_url : 'https://' + org.website_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">
                  {org.website_url}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <p className="font-medium text-muted-foreground">Not set</p>
              )}
            </div>
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Slug</p>
              <p className="font-medium font-mono text-md">{org.slug}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Members</p>
              <p className="font-medium">{org.member_count} user{org.member_count !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="pt-2 pb-3 border-t flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="text-sm"
              onClick={(e) => { e.stopPropagation(); onEdit(org) }}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Edit Organization
            </Button>
            {!isOwnOrg && org.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                className="text-sm"
                disabled={isSwitching !== null}
                onClick={(e) => { e.stopPropagation(); onSwitch(org) }}
              >
                {isSwitching === org.id ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Eye className="h-3 w-3 mr-1" />
                )}
                View as Organization
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function OrganizationsContent() {
  const { switchOrganization } = useAuth()
  const [orgs, setOrgs] = useState<PlatformOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editOrg, setEditOrg] = useState<PlatformOrganization | null>(null)
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null)
  const [switchError, setSwitchError] = useState('')

  const loadOrgs = useCallback(() => {
    setLoading(true)
    platformApi.listOrganizations()
      .then((res) => setOrgs(res.organizations))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadOrgs() }, [loadOrgs])

  const filtered = search.trim()
    ? orgs.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        (o.contact_email || '').toLowerCase().includes(search.toLowerCase()) ||
        o.slug.toLowerCase().includes(search.toLowerCase())
      )
    : orgs

  const handleSaved = () => {
    setShowCreate(false)
    setEditOrg(null)
    loadOrgs()
  }

  const handleSwitch = async (org: PlatformOrganization) => {
    setSwitchingOrgId(org.id)
    setSwitchError('')
    try {
      await switchOrganization(org.id)
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'Failed to switch')
      setSwitchingOrgId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Organizations</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Organization
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organizations..."
          className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10"
        />
      </div>

      {switchError && (
        <p className="text-base text-destructive">{switchError}</p>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">
              {search ? 'No matching organizations' : 'No organizations found'}
            </p>
            <p className="text-md text-muted-foreground">
              {search ? 'Try a different search term.' : 'Create your first organization to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-base text-muted-foreground">
            {filtered.length} organization{filtered.length !== 1 ? 's' : ''}
            {search && ' matching filter'}
          </p>
          {filtered.map((org) => (
            <OrgCard
              key={org.id}
              org={org}
              onEdit={setEditOrg}
              onSwitch={handleSwitch}
              isSwitching={switchingOrgId}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <OrgFormModal onClose={() => setShowCreate(false)} onSaved={handleSaved} />
      )}
      {editOrg && (
        <OrgFormModal org={editOrg} onClose={() => setEditOrg(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}


// =========================================================================
// USERS
// =========================================================================

interface UserCardProps {
  user: PlatformUser
}

function UserCard({ user: u }: UserCardProps) {
  const { avatarVersion } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const stat = STATUS_CONFIG[u.status] || STATUS_CONFIG.active
  const roleLabel = u.role.charAt(0).toUpperCase() + u.role.slice(1)

  return (
    <Card className="gap-0 py-0">
      <CardHeader
        className="py-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar fullName={u.full_name} userId={u.id} size="md" version={avatarVersion} />
            <span className="text-base font-semibold">{u.full_name}</span>
            {u.is_platform_admin && (
              <Shield className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            )}
            <Badge variant="outline" className={cn("text-sm", stat.color)}>
              {stat.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-md text-muted-foreground">{u.organization_name}</span>
            <span className="text-md text-muted-foreground">{formatRelative(u.last_login_at)}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-base">
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Email</p>
              <p className="font-medium">{u.email}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Organization</p>
              <p className="font-medium">{u.organization_name}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Role</p>
              <p className="font-medium">{roleLabel}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Last Login</p>
              <p className="font-medium">{formatRelative(u.last_login_at)}</p>
            </div>
            {u.is_platform_admin && (
              <div>
                <p className="text-md text-muted-foreground mb-0.5">Platform Role</p>
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-amber-600" />
                  <p className="font-medium">Platform Administrator</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 pb-3 border-t flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Profile
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function UsersContent() {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    platformApi.listUsers()
      .then((res) => setUsers(res.users))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? users.filter((u) =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.organization_name.toLowerCase().includes(search.toLowerCase())
      )
    : users

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">All Users</h3>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users2 className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">
              {search ? 'No matching users' : 'No users found'}
            </p>
            <p className="text-md text-muted-foreground">
              {search ? 'Try a different search term.' : 'Invite members to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-base text-muted-foreground">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''}
            {search && ' matching filter'}
          </p>
          {filtered.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  )
}

// =========================================================================
// ACTIVITY (placeholder)
// =========================================================================

function ActivityContent() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Activity Log</h3>
      <div className="border border-border rounded-lg p-8 text-center">
        <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-base text-muted-foreground">Cross-organization audit log coming soon.</p>
      </div>
    </div>
  )
}


// =========================================================================
// MAIN
// =========================================================================

export default function PlatformPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<Section>('overview')

  if (!user?.is_platform_admin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-base text-muted-foreground">Access denied. Platform administrator required.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => router.push('/')}
            className="text-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-3xl font-semibold text-foreground">Platform</h2>
        </div>
        <p className="text-base text-muted-foreground mb-8 ml-7">System-wide visibility and control</p>

        <div className="flex gap-8">
          {/* Left navigation */}
          <nav className="w-44 shrink-0 space-y-1">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-base transition-colors",
                  activeSection === section.id
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {/* Right content */}
          <div className="flex-1 min-w-0">
            {activeSection === 'overview' && <OverviewContent />}
            {activeSection === 'organizations' && <OrganizationsContent />}
            {activeSection === 'users' && <UsersContent />}
            {activeSection === 'activity' && <ActivityContent />}
          </div>
        </div>
      </div>
    </div>
  )
}
