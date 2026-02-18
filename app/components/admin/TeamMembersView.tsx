"use client"

/**
 * Team Members View
 *
 * Admin panel for managing organization members and invitations.
 * Two tabs: Active members and Pending invitations.
 * Expandable card pattern matching dashboard CaseCard.
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
  Key,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTeamMembers, useOrgInvitations } from '@/hooks/queries/use-admin'
import { useChangeRole, useChangeStatus, useRevokeInvitation, useDeleteInvitation, useAdminResetPassword, useRemoveMember } from '@/hooks/mutations/use-admin-mutations'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@helix/shared/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  if (diffDays < 7) return diffDays + 'd ago'
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
  return 'Expires in ' + diffDays + 'd'
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
// MEMBER CARD
// ============================================================================

interface MemberCardProps {
  member: TeamMember
  currentUserId: string | undefined
  avatarVersion: number
}

function MemberCard({ member, currentUserId, avatarVersion }: MemberCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'activate' | 'remove' | null>(null)
  const changeRole = useChangeRole()
  const changeStatus = useChangeStatus()
  const resetPassword = useAdminResetPassword()
  const removeMemberMutation = useRemoveMember()

  const isSelf = member.id === currentUserId
  const role = roleConfig[member.role] || roleConfig.user
  const status = statusConfig[member.status] || statusConfig.pending
  const RoleIcon = role.icon

  const handleRoleChange = useCallback((newRole: string) => {
    if (newRole === member.role) return
    changeRole.mutate({ userId: member.id, role: newRole })
  }, [changeRole, member.id, member.role])

  const handleStatusChange = useCallback(() => {
    const newStatus = member.status === 'active' ? 'suspended' : 'active'
    changeStatus.mutate({ userId: member.id, status: newStatus })
    setConfirmAction(null)
  }, [changeStatus, member.id, member.status])

  const handleResetPassword = useCallback(() => {
    resetPassword.mutate(member.id, {
      onSuccess: (data) => {
        toast.success('Temporary password for ' + data.user_email + ': ' + data.temporary_password, { duration: 15000 })
      },
      onError: () => {
        toast.error("Failed to reset password")
      },
    })
  }, [resetPassword, member.id])

  const handleRemove = useCallback(() => {
    removeMemberMutation.mutate(member.id, {
      onSuccess: () => {
        toast.success(member.full_name + ' removed from organization')
      },
      onError: () => {
        toast.error("Failed to remove member")
      },
    })
    setConfirmAction(null)
  }, [removeMemberMutation, member.id, member.full_name])

  return (
    <Card className="gap-0 py-0">
      <CardHeader
        className="py-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar fullName={member.full_name} userId={member.id} size="md" version={avatarVersion} />
            <span className="text-base font-semibold">{member.full_name}</span>
            {isSelf && (
              <span className="text-xs text-muted-foreground">(you)</span>
            )}
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-medium",
              role.color
            )}>
              <RoleIcon className="h-3.5 w-3.5" />
              {role.label}
            </span>
            <Badge variant="outline" className={cn("text-sm", status.color)}>
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-md text-muted-foreground">
              {member.last_login_at ? formatRelativeDate(member.last_login_at) : 'Never'}
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-base">
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Email</p>
              <p className="font-medium">{member.email}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Role</p>
              <div className="flex items-center gap-1.5">
                <RoleIcon className="h-3.5 w-3.5" />
                <p className="font-medium">{role.label}</p>
              </div>
            </div>
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Status</p>
              <p className="font-medium capitalize">{member.status}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Last Active</p>
              <p className="font-medium">{member.last_login_at ? formatRelativeDate(member.last_login_at) : 'Never'}</p>
            </div>
          </div>

          {/* Actions */}
          {!isSelf && !confirmAction && (
            <div className="pt-2 pb-3 border-t flex items-center gap-2 flex-wrap">
              {/* Role buttons */}
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-md text-muted-foreground">Role:</span>
                {Object.entries(roleConfig).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <Button
                      key={key}
                      variant={member.role === key ? "default" : "outline"}
                      size="sm"
                      className="text-sm"
                      onClick={(e) => { e.stopPropagation(); handleRoleChange(key) }}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={(e) => { e.stopPropagation(); handleResetPassword() }}
                >
                  <Key className="h-3 w-3 mr-1" />
                  Reset Password
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-sm",
                    member.status === 'active'
                      ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                      : "text-green-700 hover:bg-green-50 hover:text-green-700"
                  )}
                  onClick={(e) => { e.stopPropagation(); setConfirmAction(member.status === 'active' ? 'suspend' : 'activate') }}
                >
                  {member.status === 'active' ? (
                    <><Ban className="h-3 w-3 mr-1" />Suspend</>
                  ) : (
                    <><UserCheck className="h-3 w-3 mr-1" />Activate</>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setConfirmAction('remove') }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* Confirm action */}
          {!isSelf && confirmAction && (
            <div className="pt-2 pb-3 border-t">
              <p className="text-base font-medium mb-1">
                {confirmAction === 'suspend' && 'Suspend this user?'}
                {confirmAction === 'activate' && 'Activate this user?'}
                {confirmAction === 'remove' && 'Remove this member?'}
              </p>
              <p className="text-md text-muted-foreground mb-3">
                {confirmAction === 'suspend' && 'They will not be able to log in or access any data.'}
                {confirmAction === 'activate' && 'They will regain access to the platform.'}
                {confirmAction === 'remove' && 'This action cannot be undone. All their data will remain but they will lose access.'}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={(e) => { e.stopPropagation(); setConfirmAction(null) }}
                >
                  Cancel
                </Button>
                <Button
                  variant={confirmAction === 'activate' ? 'default' : 'destructive'}
                  size="sm"
                  className="text-sm"
                  onClick={(e) => { e.stopPropagation(); confirmAction === 'remove' ? handleRemove() : handleStatusChange() }}
                >
                  {confirmAction === 'suspend' && 'Suspend'}
                  {confirmAction === 'activate' && 'Activate'}
                  {confirmAction === 'remove' && 'Remove'}
                </Button>
              </div>
            </div>
          )}

          {/* Self - no actions */}
          {isSelf && (
            <div className="pt-2 pb-3 border-t">
              <p className="text-md text-muted-foreground">This is your account. Manage your profile in Settings.</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}


// ============================================================================
// INVITATION CARD
// ============================================================================

interface InvitationCardProps {
  invitation: OrgInvitation
  onOpenInvite: () => void
}

function InvitationCard({ invitation, onOpenInvite }: InvitationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const revokeMutation = useRevokeInvitation()
  const deleteMutation = useDeleteInvitation()

  const isPending = invitation.status === 'pending'
  const isExpired = invitation.status === 'expired'
  const inviteLink = APP_URL + '/invite?token=' + invitation.token

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
    toast.success('Invite link copied')
    setTimeout(() => setCopied(false), 2000)
  }, [inviteLink])

  const handleRevoke = useCallback(() => {
    revokeMutation.mutate(invitation.id)
    setConfirmRevoke(false)
  }, [revokeMutation, invitation.id])

  const handleDelete = useCallback(() => {
    deleteMutation.mutate(invitation.id)
  }, [deleteMutation, invitation.id])

  const statusColor = isPending
    ? 'bg-orange-100 text-orange-900 border-orange-300'
    : isExpired
    ? 'bg-gray-100 text-gray-500 border-gray-300'
    : 'bg-green-100 text-green-900 border-green-300'

  const statusLabel = isPending
    ? formatExpiryDate(invitation.expires_at)
    : invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)

  return (
    <Card className={cn("gap-0 py-0", isExpired && "opacity-60")}>
      <CardHeader
        className="py-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-base font-semibold">{invitation.email}</span>
            <Badge variant="outline" className={cn("text-sm", roleConfig[invitation.role]?.color || '')}>
              {roleConfig[invitation.role]?.label || invitation.role}
            </Badge>
            <Badge variant="outline" className={cn("text-sm", statusColor)}>
              {statusLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-md text-muted-foreground">
              {formatRelativeDate(invitation.created_at)}
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-base">
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Email</p>
              <p className="font-medium">{invitation.email}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Invited By</p>
              <p className="font-medium">{invitation.invited_by_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Role</p>
              <p className="font-medium">{roleConfig[invitation.role]?.label || invitation.role}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground mb-0.5">Status</p>
              <p className="font-medium">{statusLabel}</p>
            </div>
          </div>

          {!confirmRevoke && (
            <div className="pt-2 pb-3 border-t flex items-center gap-2">
              {isPending && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    className="text-sm"
                    onClick={(e) => { e.stopPropagation(); handleCopy() }}
                  >
                    {copied ? <Check className="h-3 w-3 mr-1 text-green-400" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? 'Copied' : 'Copy Link'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setConfirmRevoke(true) }}
                  >
                    <Ban className="h-3 w-3 mr-1" />
                    Revoke
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); handleDelete() }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          )}

          {confirmRevoke && (
            <div className="pt-2 pb-3 border-t">
              <p className="text-base font-medium mb-1">Revoke this invitation?</p>
              <p className="text-md text-muted-foreground mb-3">The invite link will no longer work.</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={(e) => { e.stopPropagation(); setConfirmRevoke(false) }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-sm"
                  onClick={(e) => { e.stopPropagation(); handleRevoke() }}
                >
                  Revoke
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
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
            <h1 className="text-3xl font-semibold tracking-tight">Team Members</h1>
            <p className="text-base text-muted-foreground mt-1">
              Manage your organization's team
            </p>
          </div>

          {/* Tabs + Search + Invite */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5 shrink-0">
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-base transition-colors",
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
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-base transition-colors",
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
                className="w-full h-10 pl-9 pr-3 text-base bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Invite button */}
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </button>
          </div>

          {/* Content */}
          {activeTab === 'members' && (
            <>
              {membersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : sortedMembers.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-base font-medium mb-2">
                      {searchQuery ? 'No matching members' : 'No team members found'}
                    </p>
                    <p className="text-md text-muted-foreground">
                      {searchQuery ? 'Try a different search term.' : 'Invite members to get started.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <p className="text-base text-muted-foreground">
                    {sortedMembers.length} member{sortedMembers.length !== 1 ? 's' : ''}
                    {searchQuery && ' matching filter'}
                  </p>
                  {sortedMembers.map((member) => (
                    <MemberCard
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
              {invLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredInvitations.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Mail className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-base font-medium mb-2">
                      {searchQuery ? 'No matching invitations' : 'No invitations'}
                    </p>
                    <p className="text-md text-muted-foreground">
                      {searchQuery ? 'Try a different search term.' : ''}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => setInviteModalOpen(true)}
                        className="mt-3 text-md text-primary hover:underline"
                      >
                        Send your first invitation
                      </button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <p className="text-base text-muted-foreground">
                    {filteredInvitations.length} invitation{filteredInvitations.length !== 1 ? 's' : ''}
                    {searchQuery && ' matching filter'}
                  </p>
                  {filteredInvitations.map((inv) => (
                    <InvitationCard
                      key={inv.id}
                      invitation={inv}
                      onOpenInvite={() => setInviteModalOpen(true)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </>
  )
}
