/**
 * CasesList Component
 *
 * Expandable list of user's analysis cases in the sidebar.
 * - Search filtering (client-side)
 * - Click completed case to load into analysis view
 * - Inline rename (pencil icon -> input -> Enter/Escape)
 * - Delete with inline confirmation
 * - Status indicator per case
 * - Active case highlighted
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
} from 'lucide-react'
import { useSession } from '@/contexts/SessionContext'
import { useJourney } from '@/contexts/JourneyContext'
import { useCases } from '@/hooks/queries/use-cases'
import { useRenameCase, useDeleteCase } from '@/hooks/mutations/use-case-mutations'
import { Button } from '@helix/shared/components/ui/button'
import { cn } from '@helix/shared/lib/utils'
import type { AnalysisSession } from '@/types/variant.types'


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
    case 'processing':
      return <Loader2 className="h-3 w-3 text-orange-500 animate-spin shrink-0" />
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
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


export function CasesList() {
  const router = useRouter()
  const { currentSessionId, setCurrentSessionId } = useSession()
  const { skipToAnalysis, resetJourney } = useJourney()
  const { data, isLoading } = useCases()
  const renameMutation = useRenameCase()
  const deleteMutation = useDeleteCase()

  const [isOpen, setIsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const cases = data?.sessions ?? []

  const filteredCases = cases.filter((c) => {
    if (!searchQuery) return true
    const name = getCaseDisplayName(c).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  // Load completed case into analysis view
  // NOTE: Only router.push -- layout URL sync handles setCurrentSessionId
  const handleCaseClick = useCallback((session: AnalysisSession) => {
    if (session.status !== 'completed') return
    if (session.id === currentSessionId) return

    skipToAnalysis()
    router.push(`/analysis?session=${session.id}`)
  }, [currentSessionId, skipToAnalysis, router])

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
        if (sessionId === currentSessionId) {
          setCurrentSessionId(null)
          router.push('/')
        }
      },
    })
  }, [deleteMutation, currentSessionId, setCurrentSessionId, router])

  const handleNewCase = useCallback(() => {
    setCurrentSessionId(null)
    resetJourney()
    router.push('/upload')
  }, [setCurrentSessionId, resetJourney, router])

  return (
    <div className="py-1">
      {/* Section header */}
      <button
        className="w-full flex items-center justify-between px-3 py-1.5 text-ml font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
        onClick={() => setIsOpen(!isOpen)}
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
        <div className="mt-1 space-y-1 px-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-2 text-base bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleNewCase}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="ml-2 text-base">New Case</span>
          </Button>

          {/* Cases list */}
          <div className="overflow-y-auto space-y-0.5 scrollbar-thin">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCases.length === 0 ? (
              <p className="text-md text-muted-foreground px-2 py-3 text-center">
                {searchQuery ? 'No matches' : 'No cases yet'}
              </p>
            ) : (
              filteredCases.map((session) => {
                const isActive = session.id === currentSessionId
                const isCompleted = session.status === 'completed'
                const isEditing = editingId === session.id
                const isDeleting = deletingId === session.id

                return (
                  <div
                    key={session.id}
                    className={cn(
                      "group relative rounded-md px-2 py-1.5 transition-colors",
                      isActive && "bg-secondary",
                      isCompleted && !isActive && "hover:bg-accent cursor-pointer",
                      !isCompleted && "opacity-60"
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
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {formatRelativeDate(session.created_at)}
                          </p>
                        </div>
                        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                          <button
                            className="p-0.5 rounded hover:bg-accent"
                            onClick={(e) => handleStartRename(e, session)}
                            title="Rename"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            className="p-0.5 rounded hover:bg-destructive/10"
                            onClick={(e) => handleDelete(e, session.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
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
