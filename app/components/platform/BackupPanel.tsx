"use client"

/**
 * System Backup Panel
 *
 * Full backup management for the Helix Insight platform.
 * Supports quick/full/complete backups with real-time progress polling.
 * Displays backup history with size, duration, and delete actions.
 *
 * Integrated as a tab in the Platform admin page.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  HardDrive,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Database,
  FolderArchive,
  BookOpen,
} from 'lucide-react'
import { Button } from '@helix/shared/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@helix/shared/lib/utils'
import {
  backupApi,
  type BackupLevel,
  type BackupSummary,
  type BackupStatusResponse,
} from '@/lib/api/backup'


// =========================================================================
// HELPERS
// =========================================================================

function formatSize(bytes: number): string {
  if (bytes === 0) return '--'
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return bytes + ' B'
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '--'
  if (seconds < 60) return seconds + 's'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return mins + 'm ' + secs + 's'
  const hours = Math.floor(mins / 60)
  return hours + 'h ' + (mins % 60) + 'm'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return mins + 'm ago'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + 'd ago'
  return formatDate(dateStr)
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; icon: typeof Database; description: string }> = {
  quick:    { label: 'Quick',    color: 'bg-blue-100 text-blue-800 border-blue-300',   icon: Database,      description: 'PostgreSQL + session outputs + config' },
  full:     { label: 'Full',     color: 'bg-purple-100 text-purple-800 border-purple-300', icon: BookOpen,  description: 'Quick + literature database' },
  complete: { label: 'Complete', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: FolderArchive, description: 'Full + reference database (~31 GB)' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  success:       { label: 'Completed',    color: 'bg-green-100 text-green-800 border-green-300',   icon: CheckCircle2 },
  completed:     { label: 'Completed',    color: 'bg-green-100 text-green-800 border-green-300',   icon: CheckCircle2 },
  running:       { label: 'Running',      color: 'bg-blue-100 text-blue-800 border-blue-300',      icon: Loader2 },
  started:       { label: 'Starting',     color: 'bg-blue-100 text-blue-800 border-blue-300',      icon: Loader2 },
  failed:        { label: 'Failed',       color: 'bg-red-100 text-red-800 border-red-300',         icon: XCircle },
  'no-metadata': { label: 'Legacy',       color: 'bg-gray-100 text-gray-600 border-gray-300',      icon: Clock },
  unknown:       { label: 'Unknown',      color: 'bg-gray-100 text-gray-600 border-gray-300',      icon: Clock },
}


// =========================================================================
// CONFIRM DIALOG
// =========================================================================

interface ConfirmDialogProps {
  title: string
  message: string
  warning?: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  destructive?: boolean
}

function ConfirmDialog({ title, message, warning, confirmLabel, onConfirm, onCancel, isLoading, destructive }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-base text-muted-foreground mb-3">{message}</p>
        {warning && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-md text-amber-800">{warning}</p>
          </div>
        )}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-base font-medium transition-colors disabled:opacity-50",
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-border rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}


// =========================================================================
// PROGRESS PANEL
// =========================================================================

interface ProgressPanelProps {
  status: BackupStatusResponse
}

function BackupProgressPanel({ status }: ProgressPanelProps) {
  const isRunning = status.status === 'started' || status.status === 'running'
  const isFailed = status.status === 'failed'
  const isCompleted = status.status === 'completed'

  return (
    <Card className={cn(
      'border-2',
      isRunning && 'border-primary/40',
      isFailed && 'border-destructive/40',
      isCompleted && 'border-green-300',
    )}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isRunning && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {isFailed && <XCircle className="h-4 w-4 text-destructive" />}
            <span className="text-base font-semibold">
              {isRunning ? 'Backup in progress...' : isFailed ? 'Backup failed' : 'Backup completed'}
            </span>
          </div>
          <span className="text-md text-muted-foreground">{status.backup_id}</span>
        </div>

        {status.current_step && isRunning && (
          <p className="text-md text-muted-foreground mb-2">
            Step: {status.current_step}
          </p>
        )}

        {status.error && (
          <p className="text-md text-destructive mt-2">{status.error}</p>
        )}
      </CardContent>
    </Card>
  )
}


// =========================================================================
// BACKUP ROW
// =========================================================================

interface BackupRowProps {
  backup: BackupSummary
  onDelete: (backupId: string) => void
}

function BackupRow({ backup, onDelete }: BackupRowProps) {
  const levelConf = LEVEL_CONFIG[backup.level] || LEVEL_CONFIG.quick
  const statusConf = STATUS_CONFIG[backup.status] || STATUS_CONFIG.unknown
  const StatusIcon = statusConf.icon

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <StatusIcon className={cn(
          "h-4 w-4 shrink-0",
          backup.status === 'success' || backup.status === 'completed' ? 'text-green-600' :
          backup.status === 'failed' ? 'text-destructive' :
          backup.status === 'running' || backup.status === 'started' ? 'text-primary animate-spin' :
          'text-muted-foreground'
        )} />
        <span className="text-base font-medium w-64 truncate">{backup.backup_id}</span>
        <Badge variant="outline" className={cn("text-sm", levelConf.color)}>
          {levelConf.label}
        </Badge>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-md text-muted-foreground w-20 text-right">
          {formatSize(backup.total_size_bytes)}
        </span>
        <span className="text-md text-muted-foreground w-16 text-right">
          {formatDuration(backup.duration_seconds)}
        </span>
        <span className="text-md text-muted-foreground w-28 text-right">
          {formatRelative(backup.created_at)}
        </span>
        <button
          onClick={() => onDelete(backup.backup_id)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete backup"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}


// =========================================================================
// MAIN COMPONENT
// =========================================================================

export function BackupContent() {
  const [backups, setBackups] = useState<BackupSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeStatus, setActiveStatus] = useState<BackupStatusResponse | null>(null)
  const [confirmLevel, setConfirmLevel] = useState<BackupLevel | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadBackups = useCallback(async () => {
    try {
      const result = await backupApi.listBackups()
      setBackups(result.backups)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backups')
    } finally {
      setLoading(false)
    }
  }, [])

  const startPolling = useCallback((backupId: string) => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const status = await backupApi.getStatus(backupId)
        setActiveStatus(status)

        if (status.status === 'completed' || status.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
          // Keep status visible for 5 seconds, then clear and reload
          setTimeout(() => {
            setActiveStatus(null)
            loadBackups()
          }, 5000)
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = null
      }
    }, 3000)
  }, [loadBackups])

  useEffect(() => {
    loadBackups()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [loadBackups])

  // -- Actions --

  const handleStartBackup = async () => {
    if (!confirmLevel) return
    setActionLoading(true)
    try {
      const result = await backupApi.startBackup(confirmLevel)
      setActiveStatus({
        backup_id: result.backup_id,
        status: 'started',
        progress: 0,
        current_step: 'initializing',
        error: null,
      })
      startPolling(result.backup_id)
      setConfirmLevel(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start backup')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteBackup = async () => {
    if (!confirmDelete) return
    setActionLoading(true)
    try {
      await backupApi.deleteBackup(confirmDelete)
      setConfirmDelete(null)
      loadBackups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete backup')
    } finally {
      setActionLoading(false)
    }
  }

  const isRunning = activeStatus != null &&
    (activeStatus.status === 'started' || activeStatus.status === 'running')

  const lastCompleted = backups.find(
    (b) => b.status === 'success' || b.status === 'completed'
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">System Backup</h3>
        <Button
          variant="outline"
          size="sm"
          className="text-sm"
          onClick={loadBackups}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-md text-red-800">
          {error}
        </div>
      )}

      {/* Last backup summary + action buttons */}
      <div className="border border-border rounded-lg bg-card">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-base font-medium">
                {lastCompleted
                  ? 'Last backup: ' + formatRelative(lastCompleted.created_at) +
                    ' (' + lastCompleted.level + ') -- ' + formatSize(lastCompleted.total_size_bytes)
                  : 'No completed backups yet'}
              </span>
            </div>
          </div>

          {/* Backup level buttons */}
          <div className="flex items-start gap-3">
            {(['quick', 'full', 'complete'] as BackupLevel[]).map((level) => {
              const conf = LEVEL_CONFIG[level]
              const Icon = conf.icon
              return (
                <button
                  key={level}
                  disabled={isRunning}
                  onClick={() => setConfirmLevel(level)}
                  className={cn(
                    "flex flex-col items-start gap-1 px-4 py-3 rounded-lg border transition-colors text-left",
                    "hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed",
                    "border-border"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base font-medium">{conf.label} Backup</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{conf.description}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Active backup progress */}
      {activeStatus && <BackupProgressPanel status={activeStatus} />}

      {/* Backup history */}
      {backups.length > 0 && (
        <div className="border border-border rounded-lg bg-card divide-y divide-border">
          <div className="px-4 py-3">
            <span className="text-base font-medium text-foreground">
              Backup History ({backups.length})
            </span>
          </div>
          {backups.map((backup) => (
            <BackupRow
              key={backup.backup_id}
              backup={backup}
              onDelete={setConfirmDelete}
            />
          ))}
        </div>
      )}

      {/* Confirm: Start Backup */}
      {confirmLevel && (
        <ConfirmDialog
          title={LEVEL_CONFIG[confirmLevel].label + ' Backup'}
          message={'Start a ' + confirmLevel + ' backup? ' + LEVEL_CONFIG[confirmLevel].description + '.'}
          warning={
            confirmLevel === 'complete'
              ? 'Complete backup includes the reference database (~31 GB). This may take 30-60 minutes.'
              : confirmLevel === 'full'
              ? 'Full backup includes the literature database. This may take 10-20 minutes.'
              : 'Quick backup typically completes in 2-5 minutes.'
          }
          confirmLabel={'Start ' + LEVEL_CONFIG[confirmLevel].label + ' Backup'}
          onConfirm={handleStartBackup}
          onCancel={() => setConfirmLevel(null)}
          isLoading={actionLoading}
        />
      )}

      {/* Confirm: Delete Backup */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Backup"
          message={'Permanently delete backup "' + confirmDelete + '"? This cannot be undone.'}
          confirmLabel="Delete"
          onConfirm={handleDeleteBackup}
          onCancel={() => setConfirmDelete(null)}
          isLoading={actionLoading}
          destructive
        />
      )}
    </div>
  )
}
