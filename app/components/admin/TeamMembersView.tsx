"use client"

/**
 * Team Members View
 *
 * Admin panel for managing organization members and invitations.
 * Two tabs: Active members and Pending invitations.
 * Actions: change role, suspend/activate, revoke invitation.
 */

import { useState, useCallback } from 'react'
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
  Clock,
  Ban,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTeamMembers, useOrgInvitations } from '@/hooks/queries/use-admin'
import { useChangeRole, useChangeStatus, useRevokeInvitation } from '@/hooks/mutations/use-admin-mutations'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { InviteModal } from '@/components/navigation/InviteModal'
import { cn } from '@helix/shared/lib/utils'
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
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'activate' | null>(null)
  const changeRole = useChangeRole()
  const changeStatus = useChangeStatus()

  const isSelf = member.id === currentUserId
  const role = roleConfig[member.role] || roleConfig.user
  const status = statusConfig[member.status] || statusConfig.pending
  const RoleIcon = role.icon

  const handleRoleChange = useCallback((newRole: string) => {
    changeRole.mutate({ userId: member.id, role: newRole })
    setRoleMenuOpen(false)
  }, [changeRole, member.id])

  const handleStatusChange = useCallback(() => {
    const newStatus = member.status === 'active' ? 'suspended' : 'active'
    changeStatus.mutate({ userId: member.id, status: newStatus })
    setConfirmAction(null)
  }, [changeStatus, member.id, member.status])

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

      {/* Role badge + menu */}
      <div className="relative">
        <button
          onClick={() => !isSelf && setRoleMenuOpen(!roleMenuOpen)}
          disabled={isSelf}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-medium transition-colors",
            role.color,
            !isSelf && "cursor-pointer hover:opacity-80",
            isSelf && "cursor-default"
          )}
        >
          <RoleIcon className="h-3.5 w-3.5" />
          {role.label}
        </button>

        {roleMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 w-36 py-1">
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
          </>
        )}
      </div>

      {/* Status badge */}
      <Badge variant="outline" className={cn("text-sm", status.color)}>
        {status.label}
      </Badge>

      {/* Last login */}
      <span className="text-sm text-muted-foreground w-24 text-right shrink-0">
        {member.last_login_at ? formatRelativeDate(member.last_login_at) : 'Never'}
      </span>

      {/* Suspend / Activate action */}
      {!isSelf && (
        <div className="w-24 shrink-0 flex justify-end">
          {confirmAction ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleStatusChange}
                className="p-1 rounded hover:bg-destructive/10"
                title="Confirm"
              >
                <Check className="h-4 w-4 text-destructive" />
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="p-1 rounded hover:bg-accent"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmAction(member.status === 'active' ? 'suspend' : 'activate')}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors",
                member.status === 'active'
                  ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  : "text-muted-foreground hover:text-green-700 hover:bg-green-50"
              )}
            >
              {member.status === 'active' ? (
                <>
                  <Ban className="h-3.5 w-3.5" />
                  Suspend
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  Activate
                </>
              )}
            </button>
          )}
        </div>
      )}
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

      <Badge variant="outline" className={cn("text-sm", roleConfig[invitation.role]?.color || '')}>
        {roleConfig[invitation.role]?.label || invitation.role}
      </Badge>

      <Badge variant="outline" className={cn("text-sm", statusColor)}>
        {isPending ? formatExpiryDate(invitation.expires_at) : invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
      </Badge>

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

  const { data: teamData, isLoading: membersLoading } = useTeamMembers()
  const { data: invData, isLoading: invLoading } = useOrgInvitations()

  const members = teamData?.members ?? []
  const invitations = invData?.invitations ?? []
  const pendingCount = invitations.filter(i => i.status === 'pending').length

  return (
    <>
      <div className="flex flex-col min-h-full p-8">
        <div className="w-full max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
              <p className="text-base text-muted-foreground mt-1">
                Manage your organization's team
              </p>
            </div>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </button>
          </div>

          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5 w-fit">
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
              <Clock className="h-4 w-4" />
              Pending Invitations
              {pendingCount > 0 && (
                <span className="text-xs bg-orange-100 text-orange-900 rounded-full px-1.5 py-0.5">{pendingCount}</span>
              )}
            </button>
          </div>

          <Card className="py-0 gap-0">
            <CardContent className="p-0">
              {activeTab === 'members' && (
                <>
                  <div className="flex items-center gap-4 px-4 py-2 border-b border-border text-sm text-muted-foreground font-medium">
                    <div className="w-8 shrink-0" />
                    <div className="flex-1">Member</div>
                    <div className="w-24">Role</div>
                    <div className="w-24">Status</div>
                    <div className="w-24 text-right">Last Active</div>
                    <div className="w-24" />
                  </div>

                  {membersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-base text-muted-foreground">No team members found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {members.map((member) => (
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
                  ) : invitations.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-base text-muted-foreground">No invitations</p>
                      <button
                        onClick={() => setInviteModalOpen(true)}
                        className="mt-3 text-sm text-primary hover:underline"
                      >
                        Send your first invitation
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {invitations.map((inv) => (
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
