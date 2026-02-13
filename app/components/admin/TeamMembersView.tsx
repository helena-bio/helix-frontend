"use client"

/**
 * Team Members View
 *
 * Admin panel for managing organization members and invitations.
 * Two tabs: Active members and Pending invitations.
 * Actions dropdown: change role, reset password, suspend/activate, remove.
 *
 * Sort: current user (you) always displayed first.
 * Search: client-side filter by name or email.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  Users,
  Mail,
  Shield,
  ShieldCheck,
  Eye,
  Loader2,
  Check,
  X,
  Copy,
  UserPlus,
  Send,
  Ban,
  UserCheck,
  Search,
  MoreHorizontal,
  Key,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTeamMembers, useOrgInvitations } from '@/hooks/queries/use-admin'
import { useChangeRole, useChangeStatus, useRevokeInvitation, useAdminResetPassword, useRemoveMember } from '@/hooks/mutations/use-admin-mutations'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { InviteModal } from '@/components/navigation/InviteModal'
import { cn } from '@helix/shared/lib/utils'
import { toast } from 'sonner'
import type { TeamMember, OrgInvitation } from '@/lib/api/admin'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.helixinsight.bio'

type Tab = 'members' | 'invitations'

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  })
}

function formatExpiryDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'Expired'
  if (diffDays === 0) return 'Expires today'
  if (diffDays === 1) return 'Expires tomorrow'
  return `Expires in ${diffDays}d`
}

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Admin', icon: ShieldCheck, color: 'bg-amber-100 text-amber-900 border-amber-300' },
  user: { label: 'User', icon: Shield, color: 'bg-blue-100 text-blue-900 border-blue-300' },
  viewer: { label: 'Viewer', icon: Eye, color: 'bg-gray-100 text-gray-600 border-gray-300' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-900 border-green-300' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-900 border-red-300' },
  pending: { label: 'Pending', color: 'bg-orange-100 text-orange-900 border-orange-300' },
}

// ============================================================================
// MEMBER ROW
// ============================================================================

interface MemberRowProps {
  member: TeamMember
  currentUserId: string | undefined
  avatarVersion: number
}

function MemberRow({ member, currentUserId, avatarVersion }: MemberRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [roleSubmenuOpen, setRoleSubmenuOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'activate' | 'remove' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const changeRole = useChangeRole()
  const changeStatus = useChangeStatus()
  const resetPassword = useAdminResetPassword()
  const removeMemberMutation = useRemoveMember()

  const isSelf = member.id === currentUserId
  const role = roleConfig[member.role] || roleConfig.user
  const status = statusConfig[member.status] || statusConfig.pending
  const RoleIcon = role.icon

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
        setRoleSubmenuOpen(false)
        setConfirmAction(null)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleRoleChange = useCallback((newRole: string) => {
    if (newRole === member.role) return
    changeRole.mutate({ userId: member.id, role: newRole })
    setMenuOpen(false)
    setRoleSubmenuOpen(false)
  }, [changeRole, member.id, member.role])

  const handleStatusChange = useCallback(() => {
    const newStatus = member.status === 'active' ? 'suspended' : 'active'
    changeStatus.mutate({ userId: member.id, status: newStatus })
    setMenuOpen(false)
    setConfirmAction(null)
  }, [changeStatus, member.id, member.status])

  const handleResetPassword = useCallback(() => {
    resetPassword.mutate(member.id, {
      onSuccess: (data) => {
        toast.success(`Temporary password for ${data.user_email}: ${data.temporary_password}`, { duration: 15000 })
      },
      onError: () => {
        toast.error("Failed to reset password")
      },
    })
    setMenuOpen(false)
  }, [resetPassword, member.id])

  const handleRemove = useCallback(() => {
    removeMemberMutation.mutate(member.id, {
      onSuccess: () => {
        toast.success(`${member.full_name} removed from organization`)
      },
      onError: () => {
        toast.error("Failed to remove member")
      },
    })
    setMenuOpen(false)
    setConfirmAction(null)
  }, [removeMemberMutation, member.id, member.full_name])

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors">
      <UserAvatar fullName={member.full_name} userId={member.id} size="md" version={avatarVersion} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-base font-medium truncate">{member.full_name}</p>
          {isSelf && (
            <span className="text-xs text-muted-foreground">(you)</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
      </div>

      {/* Role badge (display only) */}
      <div className="w-24">
        <span className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-medium",
          role.color
        )}>
          <RoleIcon className="h-3.5 w-3.5" />
          {role.label}
        </span>
      </div>

      {/* Status badge */}
      <div className="w-24">
        <Badge variant="outline" className={cn("text-sm", status.color)}>
          {status.label}
        </Badge>
      </div>

      {/* Last login */}
      <span className="text-sm text-muted-foreground w-24 text-right shrink-0">
        {member.last_login_at ? formatRelativeDate(member.last_login_at) : 'Never'}
      </span>

      {/* Actions dropdown */}
      <div className="w-10 shrink-0 flex justify-end relative" ref={menuRef}>
        {!isSelf && (
          <>
            <button
              onClick={() => { setMenuOpen(!menuOpen); setRoleSubmenuOpen(false); setConfirmAction(null) }}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && !confirmAction && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 w-48 py-1">
                {/* Change Role */}
                <div
                  className="relative"
                  onMouseEnter={() => setRoleSubmenuOpen(true)}
                  onMouseLeave={() => setRoleSubmenuOpen(false)}
                >
                  <button className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                    <span className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" />
                      Change Role
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>

                  {roleSubmenuOpen && (
                    <div className="absolute left-full top-0 ml-1 bg-card border border-border rounded-lg shadow-lg z-50 w-36 py-1">
                      {Object.entries(roleConfig).map(([key, config]) => {
                        const Icon = config.icon
                        return (
                          <button
                            key={key}
                            onClick={() => handleRoleChange(key)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors",
                              member.role === key && "font-medium bg-accent/50"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {config.label}
                            {member.role === key && <Check className="h-3 w-3 ml-auto" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Reset Password */}
                <button
                  onClick={handleResetPassword}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <Key className="h-3.5 w-3.5" />
                  Reset Password
                </button>

                <div className="border-t border-border my-1" />

                {/* Suspend / Activate */}
                <button
                  onClick={() => setConfirmAction(member.status === 'active' ? 'suspend' : 'activate')}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors",
                    member.status === 'active'
                      ? "hover:bg-destructive/10 hover:text-destructive"
                      : "hover:bg-green-50 hover:text-green-700"
                  )}
                >
                  {member.status === 'active' ? (
                    <>
                      <Ban className="h-3.5 w-3.5" />
                      Suspend User
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5" />
                      Activate User
                    </>
                  )}
                </button>

                {/* Remove */}
                <button
                  onClick={() => setConfirmAction('remove')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Member
                </button>
              </div>
            )}

            {/* Confirmation inline */}
            {menuOpen && confirmAction && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 w-56 p-3">
                <p className="text-sm font-medium mb-1">
                  {confirmAction === 'suspend' && 'Suspend this user?'}
                  {confirmAction === 'activate' && 'Activate this user?'}
                  {confirmAction === 'remove' && 'Remove this member?'}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {confirmAction === 'suspend' && 'They will not be able to log in or access any data.'}
                  {confirmAction === 'activate' && 'They will regain access to the platform.'}
                  {confirmAction === 'remove' && 'This action cannot be undone. All their data will remain but they will lose access.'}
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-2.5 py-1 text-sm rounded border border-border hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAction === 'remove' ? handleRemove : handleStatusChange}
                    className={cn(
                      "px-2.5 py-1 text-sm rounded font-medium transition-colors",
                      confirmAction === 'activate'
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    )}
                  >
                    {confirmAction === 'suspend' && 'Suspend'}
                    {confirmAction === 'activate' && 'Activate'}
                    {confirmAction === 'remove' && 'Remove'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// INVITATION ROW
// ============================================================================

interface InvitationRowProps {
  invitation: OrgInvitation
}

function InvitationRow({ invitation }: InvitationRowProps) {
  const [copied, setCopied] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const revokeMutation = useRevokeInvitation()

  const isPending = invitation.status === 'pending'
  const isExpired = invitation.status === 'expired'
  const inviteLink = `${APP_URL}/invite?token=${invitation.token}`

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = inviteLink
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [inviteLink])

  const handleRevoke = useCallback(() => {
    revokeMutation.mutate(invitation.id)
    setConfirmRevoke(false)
  }, [revokeMutation, invitation.id])

  const statusColor = isPending
    ? 'bg-orange-100 text-orange-900 border-orange-300'
    : isExpired
    ? 'bg-gray-100 text-gray-500 border-gray-300'
    : 'bg-green-100 text-green-900 border-green-300'

  return (
    <div className={cn(
      "flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors",
      isExpired && "opacity-60"
    )}>
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Mail className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium truncate">{invitation.email}</p>
        <p className="text-sm text-muted-foreground">
          {invitation.invited_by_name ? `Invited by ${invitation.invited_by_name}` : 'Invited'}
          {' -- '}
          {formatRelativeDate(invitation.created_at)}
        </p>
      </div>

      {/* Role */}
      <div className="w-20">
        <Badge variant="outline" className={cn("text-sm", roleConfig[invitation.role]?.color || '')}>
          {roleConfig[invitation.role]?.label || invitation.role}
        </Badge>
      </div>

      {/* Status */}
      <div className="w-28">
        <Badge variant="outline" className={cn("text-sm", statusColor)}>
          {isPending ? formatExpiryDate(invitation.expires_at) : invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 w-24 shrink-0 justify-end">
        {isPending && (
          <>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Copy invite link"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {confirmRevoke ? (
              <div className="flex items-center gap-0.5">
                <button onClick={handleRevoke} className="p-1 rounded hover:bg-destructive/10" title="Confirm revoke">
                  <Check className="h-4 w-4 text-destructive" />
                </button>
                <button onClick={() => setConfirmRevoke(false)} className="p-1 rounded hover:bg-accent" title="Cancel">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRevoke(true)}
                className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Revoke invitation"
              >
                <Ban className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN VIEW
// ============================================================================

export function TeamMembersView() {
  const { user, avatarVersion } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('members')
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: teamData, isLoading: membersLoading } = useTeamMembers()
  const { data: invData, isLoading: invLoading } = useOrgInvitations()

  const members = teamData?.members ?? []
  const invitations = invData?.invitations ?? []
  const pendingCount = invitations.filter(i => i.status === 'pending').length

  // Sort: current user first, then alphabetical. Filter by search.
  const sortedMembers = useMemo(() => {
    const filtered = members.filter((m) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    })
    return filtered.sort((a, b) => {
      if (a.id === user?.id) return -1
      if (b.id === user?.id) return 1
      return a.full_name.localeCompare(b.full_name)
    })
  }, [members, user?.id, searchQuery])

  // Filter invitations by search
  const filteredInvitations = useMemo(() => {
    if (!searchQuery) return invitations
    const q = searchQuery.toLowerCase()
    return invitations.filter((i) => i.email.toLowerCase().includes(q))
  }, [invitations, searchQuery])

  return (
    <>
      <div className="flex flex-col min-h-full p-8">
        <div className="w-full max-w-4xl mx-auto space-y-4">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
            <p className="text-base text-muted-foreground mt-1">
              Manage your organization's team
            </p>
          </div>

          {/* Tabs + Search + Invite */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5 shrink-0">
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors",
                  activeTab === 'members'
                    ? "bg-background shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab('members')}
              >
                <Users className="h-4 w-4" />
                Active
                {members.length > 0 && (
                  <span className="text-xs bg-muted rounded-full px-1.5 py-0.5">{members.length}</span>
                )}
              </button>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors",
                  activeTab === 'invitations'
                    ? "bg-background shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab('invitations')}
              >
                <Send className="h-4 w-4" />
                Invitations
                {pendingCount > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-900 rounded-full px-1.5 py-0.5">{pendingCount}</span>
                )}
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={activeTab === 'members' ? 'Search members...' : 'Search invitations...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Invite button */}
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </button>
          </div>

          {/* Content */}
          <Card className="py-0 gap-0">
            <CardContent className="p-0">
              {activeTab === 'members' && (
                <>
                  {/* Column headers */}
                  <div className="flex items-center gap-4 px-4 py-2 border-b border-border text-sm text-muted-foreground font-medium">
                    <div className="w-8 shrink-0" />
                    <div className="flex-1">Member</div>
                    <div className="w-24">Role</div>
                    <div className="w-24">Status</div>
                    <div className="w-24 text-right">Last Active</div>
                    <div className="w-10" />
                  </div>

                  {membersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : sortedMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-base text-muted-foreground">
                        {searchQuery ? 'No matching members' : 'No team members found'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {sortedMembers.map((member) => (
                        <MemberRow
                          key={member.id}
                          member={member}
                          currentUserId={user?.id}
                          avatarVersion={avatarVersion}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'invitations' && (
                <>
                  {/* Column headers */}
                  <div className="flex items-center gap-4 px-4 py-2 border-b border-border text-sm text-muted-foreground font-medium">
                    <div className="w-8 shrink-0" />
                    <div className="flex-1">Email</div>
                    <div className="w-20">Role</div>
                    <div className="w-28">Status</div>
                    <div className="w-24" />
                  </div>

                  {invLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredInvitations.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-base text-muted-foreground">
                        {searchQuery ? 'No matching invitations' : 'No invitations'}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => setInviteModalOpen(true)}
                          className="mt-3 text-sm text-primary hover:underline"
                        >
                          Send your first invitation
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredInvitations.map((inv) => (
                        <InvitationRow key={inv.id} invitation={inv} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </>
  )
}
