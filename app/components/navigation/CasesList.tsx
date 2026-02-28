/**
 * CasesList Component
 *
 * Expandable list of analysis cases in the sidebar.
 * - My Cases / All Cases toggle (org-wide visibility)
 * - Search filtering (client-side)
 * - Click completed case -> /analysis?session=<id>
 * - Click pending/validated case -> /upload?session=<id>
 * - Inline rename (pencil icon -> input -> Enter/Escape)
 * - Delete with inline confirmation
 * - Status indicator per case
 * - Active case highlighted
 * - Owner name shown for other users' cases
 *
 * UPLOAD ENTRY:
 * - Shows ONLY during active upload (compressing/uploading/validating)
 * - After validation completes, session appears in cases list via API
 * - No more 'qc_results' state in sidebar
 *
 * SESSION MANAGEMENT:
 * - Navigation is via router.push ONLY
 * - Layout URL sync effect handles context update
 * - No direct setCurrentSessionId calls (prevents race condition)
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  User,
} from 'lucide-react'
import { useSession } from '@/contexts/SessionContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCases } from '@/hooks/queries/use-cases'
import { useRenameCase, useDeleteCase } from '@/hooks/mutations/use-case-mutations'
import { Button } from '@helix/shared/components/ui/button'
import { cn } from '@helix/shared/lib/utils'
import type { AnalysisSession } from '@/types/variant.types'
import { useUploadContext } from '@/contexts/UploadContext'


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

function StatusDot({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
    case 'profiling':
      return <Loader2 className="h-3 w-3 text-purple-500 animate-spin shrink-0" />
    case 'processed':
      return <CheckCircle2 className="h-3 w-3 text-orange-500 shrink-0" />
    case 'processing':
      return <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
    case 'uploaded':
      return <Clock className="h-3 w-3 text-amber-500 shrink-0" />
    default:
      return <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
  }
}

function getCaseDisplayName(session: AnalysisSession): string {
  if (session.case_label) return session.case_label
  if (session.original_filename) {
    return session.original_filename.replace(/\.vcf(\.gz)?$/i, '')
  }
  return session.id.slice(0, 8)
}

interface CasesListProps {
  isOpen: boolean
  onToggle: () => void
}

export function CasesList({ isOpen, onToggle }: CasesListProps) {
  const router = useRouter()
  const { currentSessionId, setCurrentSessionId, setSelectedModule } = useSession()
  // JourneyContext not needed -- step is derived from URL
  const { user } = useAuth()

  const upload = useUploadContext()
  const [showAll, setShowAll] = useState(false)
  const { data, isLoading } = useCases(!showAll)
  const renameMutation = useRenameCase()
  const deleteMutation = useDeleteCase()

  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const cases = data?.sessions ?? []

  const filteredCases = cases.filter((c) => {
    // Hide session being actively uploaded (shown as upload entry instead)
    if (upload.isActive && upload.sessionId && c.id === upload.sessionId) return false
    if (!searchQuery) return true
    const name = getCaseDisplayName(c).toLowerCase()
    const owner = (c.owner_name || '').toLowerCase()
    return name.includes(searchQuery.toLowerCase()) || owner.includes(searchQuery.toLowerCase())
  })

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  // Status-based routing -- no task_id check (session lifecycle refactor)
  const handleCaseClick = useCallback((session: AnalysisSession) => {
    if (session.id === currentSessionId) return

    // Has variants and past profile -- analysis view
    if (['profiling', 'completed'].includes(session.status)) {
      setSelectedModule('analysis')
      router.push(`/analysis?session=${session.id}`)
      return
    }

    // Processed -- needs clinical profile
    if (session.status === 'processed') {
      router.push(`/upload?session=${session.id}&step=profile`)
      return
    }

    // Processing -- show pipeline progress
    if (session.status === 'processing') {
      router.push(`/upload?session=${session.id}&step=processing`)
      return
    }

    // All other (created, uploaded, failed) -> upload flow
    router.push(`/upload?session=${session.id}`)
  }, [currentSessionId, setSelectedModule, router])

  const handleStartRename = useCallback((e: React.MouseEvent, session: AnalysisSession) => {
    e.stopPropagation()
    setEditingId(session.id)
    setEditValue(getCaseDisplayName(session))
  }, [])

  const handleSaveRename = useCallback((sessionId: string) => {
    const trimmed = editValue.trim()
    if (!trimmed) {
      setEditingId(null)
      return
    }
    renameMutation.mutate(
      { sessionId, caseLabel: trimmed },
      { onSettled: () => setEditingId(null) }
    )
  }, [editValue, renameMutation])

  const handleCancelRename = useCallback(() => {
    setEditingId(null)
    setEditValue('')
  }, [])

  const handleDelete = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    setDeletingId(sessionId)
  }, [])

  const handleConfirmDelete = useCallback((sessionId: string) => {
    deleteMutation.mutate(sessionId, {
      onSettled: () => {
        setDeletingId(null)
        if (sessionId === upload.sessionId) {
          upload.resetUpload()
        }
        if (sessionId === currentSessionId) {
          setCurrentSessionId(null)
          router.push('/')
        }
      },
    })
  }, [deleteMutation, currentSessionId, setCurrentSessionId, router, upload])

  const handleNewCase = useCallback(() => {
    router.push('/upload')
  }, [router])

  return (
    <div className="py-1">
      {/* Section header */}
      <button
        className="w-full flex items-center justify-between px-3 py-1.5 text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
        onClick={onToggle}
      >
        <span>Cases</span>
        <div className="flex items-center gap-1.5">
          {cases.length > 0 && (
            <span className="text-xs font-normal normal-case tracking-normal bg-muted rounded-full px-1.5 py-0.5">
              {cases.length}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              !isOpen && "-rotate-90"
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="mt-1 space-y-1.5 px-2">

          {/* My/All toggle */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
            <button
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded text-md transition-colors",
                !showAll ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setShowAll(false)}
            >
              <User className="h-4 w-4" />
              Mine
            </button>
            <button
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded text-md transition-colors",
                showAll ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setShowAll(true)}
            >
              <Users className="h-4 w-4" />
              Team
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-2 text-md bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Cases list */}
          <div className="overflow-y-auto space-y-0.5 scrollbar-thin">

            {/* Active upload entry -- ONLY during compressing/uploading/validating */}
            {upload.isActive && (
              <div
                className="group/upload relative rounded-md px-2 py-1.5 cursor-pointer transition-colors bg-primary/5 border border-primary/20 hover:bg-primary/10"
                onClick={() => {
                  upload.sessionId
                    ? router.push(`/upload?session=${upload.sessionId}`)
                    : router.push('/upload')
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-md font-medium truncate leading-tight">
                        {upload.caseName || upload.fileName || "Uploading..."}
                      </p>
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/upload:opacity-100 transition-opacity">
                        <button
                          className="p-0.5 rounded hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); upload.resetUpload() }}
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm text-muted-foreground">
                        {upload.phase === "compressing" && "Compressing..."}
                        {upload.phase === "uploading" && `Uploading ${upload.uploadProgress}%`}
                        {upload.phase === "validating" && "Validating..."}
                      </span>
                    </div>
                    <div className="mt-1 h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${upload.currentProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCases.length === 0 ? (
              <p className="text-md text-muted-foreground px-2 py-3 text-center">
                {searchQuery ? 'No matches' : showAll ? 'No cases in organization' : 'No cases yet'}
              </p>
            ) : (
              filteredCases.map((session) => {
                const isActive = session.id === currentSessionId
                const isCompleted = session.status === 'completed'
                const isClickable = true // All statuses are now clickable
                const isOwner = session.user_id === user?.id
                const isEditing = editingId === session.id
                const isDeleting = deletingId === session.id

                return (
                  <div
                    key={session.id}
                      className={cn(
                        "group/case relative rounded-md px-2 transition-colors",
                        session.status === 'processing'
                          ? "py-1.5 bg-primary/5 border border-primary/20 hover:bg-primary/10 cursor-pointer"
                          : cn(
                              "py-1",
                              isActive && "bg-secondary",
                              !isActive && "hover:bg-accent cursor-pointer",
                              !isCompleted && !isActive && !['uploaded', 'processed', 'profiling'].includes(session.status) && "opacity-70 hover:opacity-100"
                            )
                      )}
                    onClick={() => handleCaseClick(session)}
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <span className="text-md text-destructive flex-1 truncate">Delete?</span>
                        <button
                          className="p-0.5 rounded hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); handleConfirmDelete(session.id) }}
                        >
                          <Check className="h-4 w-4 text-destructive" />
                        </button>
                        <button
                          className="p-0.5 rounded hover:bg-accent"
                          onClick={(e) => { e.stopPropagation(); setDeletingId(null) }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(session.id)
                            if (e.key === 'Escape') handleCancelRename()
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 h-6 px-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <button
                          className="p-0.5 rounded hover:bg-accent"
                          onClick={(e) => { e.stopPropagation(); handleSaveRename(session.id) }}
                        >
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        </button>
                        <button
                          className="p-0.5 rounded hover:bg-accent"
                          onClick={(e) => { e.stopPropagation(); handleCancelRename() }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <StatusDot status={session.status} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-md font-medium truncate leading-tight">
                            {getCaseDisplayName(session)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-sm text-muted-foreground">
                              {formatRelativeDate(session.created_at)}
                            </span>
                            {showAll && session.owner_name && (
                              <span className="text-sm text-muted-foreground truncate">
                                &middot; {session.owner_name}
                              </span>
                            )}
                            {session.status === 'uploaded' && (
                              <span className="text-sm text-amber-600 font-medium">
                                &middot; Ready to process
                              </span>
                            )}
                            {session.status === 'created' && (
                              <span className="text-sm text-muted-foreground">
                                &middot; Validating...
                              </span>
                            )}
                            {session.status === 'processing' && (
                              <span className="text-sm text-primary font-medium">
                                &middot; Processing...
                              </span>
                            )}
                            {session.status === 'processed' && (
                              <span className="text-sm text-orange-500 font-medium">
                                &middot; Needs Profile
                              </span>
                            )}
                            {session.status === 'profiling' && (
                              <span className="text-sm text-purple-500">
                                &middot; Analyzing...
                              </span>
                            )}
                            {session.status === 'failed' && (
                              <span className="text-sm text-destructive">
                                &middot; Failed
                              </span>
                            )}
                          </div>
                            {session.status === 'processing' && (
                              <div className="mt-1 h-1 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '100%' }} />
                              </div>
                            )}
                        </div>
                        <div className={cn("items-center gap-0.5 shrink-0", isOwner ? "hidden group-hover/case:flex" : "hidden")}>
                          <button
                            className="p-0.5 rounded hover:bg-accent"
                            onClick={(e) => handleStartRename(e, session)}
                            title="Rename"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            className="p-0.5 rounded hover:bg-destructive/10"
                            onClick={(e) => handleDelete(e, session.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
