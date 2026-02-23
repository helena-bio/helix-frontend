"use client"

/**
 * Reference Databases Dashboard
 *
 * Full visibility and control over all reference databases powering
 * variant analysis. Displays status, freshness, validation results,
 * and provides update/rebuild actions.
 *
 * Integrated as a tab in the Platform admin page.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Database,
  HardDrive,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  ArrowDownToLine,
  Layers,
  Table2,
  Shield,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@helix/shared/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@helix/shared/lib/utils'
import {
  preprocessingApi,
  type AllDatabasesResponse,
  type DatabaseStatus,
  type TaskStatus,
  type TaskCreatedResponse,
} from '@/lib/api/preprocessing'


// =========================================================================
// HELPERS
// =========================================================================

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '--'
  return n.toLocaleString()
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

function formatElapsed(seconds: number | null | undefined): string {
  if (seconds == null) return '--'
  if (seconds < 60) return Math.round(seconds) + 's'
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins < 60) return mins + 'm ' + secs + 's'
  const hours = Math.floor(mins / 60)
  return hours + 'h ' + (mins % 60) + 'm'
}

const TIME_ESTIMATES: Record<string, string> = {
  gnomad_constraint: '< 1 min',
  clingen: '< 1 min',
  clinvar: '2-4 hours (VEP)',
  dbnsfp: '~30 min',
  gnomad: '1-2 hours',
  spliceai: '~1 hour',
  omim: '< 1 min',
  hpo: '< 1 min',
}


// =========================================================================
// FRESHNESS BADGE
// =========================================================================

const FRESHNESS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  current:       { label: 'Current',       color: 'bg-green-100 text-green-800 border-green-300',   icon: CheckCircle2 },
  stale:         { label: 'Stale',         color: 'bg-amber-100 text-amber-800 border-amber-300',   icon: AlertTriangle },
  not_loaded:    { label: 'Not Loaded',    color: 'bg-blue-100 text-blue-800 border-blue-300',      icon: ArrowDownToLine },
  not_converted: { label: 'Not Converted', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: Layers },
  missing:       { label: 'Missing',       color: 'bg-red-100 text-red-800 border-red-300',         icon: XCircle },
}

function FreshnessBadge({ status }: { status: string }) {
  const config = FRESHNESS_CONFIG[status] || FRESHNESS_CONFIG.missing
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn('text-sm gap-1', config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}


// =========================================================================
// CONFIRMATION DIALOG
// =========================================================================

interface ConfirmDialogProps {
  title: string
  message: string
  warning?: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

function ConfirmDialog({ title, message, warning, confirmLabel, onConfirm, onCancel, isLoading }: ConfirmDialogProps) {
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
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
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
// TASK PROGRESS PANEL
// =========================================================================

interface TaskPanelProps {
  task: TaskStatus
}

function TaskProgressPanel({ task }: TaskPanelProps) {
  const isRunning = task.status === 'started' || task.status === 'processing'
  const isFailed = task.status === 'failed'
  const isCompleted = task.status === 'completed'

  return (
    <Card className={cn(
      'border-2',
      isRunning && 'border-primary/40',
      isFailed && 'border-destructive/40',
      isCompleted && 'border-green-300',
    )}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isRunning && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {isFailed && <XCircle className="h-4 w-4 text-destructive" />}
            <span className="text-base font-semibold">
              {isRunning ? 'Processing...' : isFailed ? 'Task Failed' : 'Task Completed'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-md text-muted-foreground">
            {task.current_database && (
              <span>Current: <span className="font-medium text-foreground">{task.current_database}</span></span>
            )}
            {task.elapsed_seconds != null && (
              <span>Elapsed: {formatElapsed(task.elapsed_seconds)}</span>
            )}
          </div>
        </div>

        {task.message && (
          <p className={cn(
            'text-md mb-2',
            isFailed ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {task.message}
          </p>
        )}

        {task.databases && Object.keys(task.databases).length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {Object.entries(task.databases).map(([dbName, info]) => {
              const dbInfo = info as Record<string, unknown>
              const dbStatus = (dbInfo?.status as string) || 'pending'
              return (
                <div key={dbName} className="flex items-center gap-2 text-md">
                  {dbStatus === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />}
                  {dbStatus === 'processing' && <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />}
                  {dbStatus === 'failed' && <XCircle className="h-3 w-3 text-destructive shrink-0" />}
                  {dbStatus === 'pending' && <Clock className="h-3 w-3 text-muted-foreground shrink-0" />}
                  <span className={cn(
                    dbStatus === 'processing' && 'font-medium text-foreground',
                    dbStatus === 'completed' && 'text-muted-foreground',
                    dbStatus === 'failed' && 'text-destructive',
                    dbStatus === 'pending' && 'text-muted-foreground',
                  )}>
                    {dbName}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


// =========================================================================
// DATABASE CARD
// =========================================================================

interface DatabaseCardProps {
  db: DatabaseStatus
  onUpdate: (dbName: string) => void
  isTaskRunning: boolean
}

function DatabaseCard({ db, onUpdate, isTaskRunning }: DatabaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="gap-0 py-0">
      <CardHeader
        className="py-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-base font-semibold">{db.display_name}</span>
            {db.version && (
              <span className="text-md text-muted-foreground">v{db.version}</span>
            )}
            <FreshnessBadge status={db.freshness.status} />
            {db.vep_required && (
              <Badge variant="outline" className="text-sm bg-purple-50 text-purple-700 border-purple-300">VEP</Badge>
            )}
            {db.license_required && (
              <Badge variant="outline" className="text-sm bg-gray-100 text-gray-600 border-gray-300">
                <Shield className="h-3 w-3 mr-0.5" />License
              </Badge>
            )}
            {!db.validation.passed && (
              <Badge variant="outline" className="text-sm bg-red-50 text-red-700 border-red-300">
                <AlertTriangle className="h-3 w-3 mr-0.5" />Validation
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-md text-muted-foreground">
              {db.reference_db.loaded && db.reference_db.row_count != null && (
                <span>{formatNumber(db.reference_db.row_count)} rows</span>
              )}
              {db.parquet.exists && (
                <span>{db.parquet.total_size_human}</span>
              )}
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {db.description && (
            <p className="text-md text-muted-foreground">{db.description}</p>
          )}

          {db.freshness.suggested_action && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-md text-amber-800">{db.freshness.suggested_action}</p>
            </div>
          )}

          {/* Three-column status grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Source Files */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-md font-medium">Source Files</span>
              </div>
              <div className="space-y-1 text-md">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={db.source.exists ? 'text-green-700' : 'text-muted-foreground'}>{db.source.exists ? 'On disk' : 'Cleaned up'}</span>
                </div>
                {db.source.exists && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Files</span>
                      <span>{db.source.files_found}/{db.source.files_expected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span>{db.source.total_size_human}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Parquet */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-md font-medium">Parquet</span>
              </div>
              <div className="space-y-1 text-md">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={db.parquet.exists ? 'text-green-700' : 'text-red-600'}>{db.parquet.exists ? 'Ready' : 'Missing'}</span>
                </div>
                {db.parquet.exists && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Partitions</span>
                      <span>{db.parquet.partitions}/{db.parquet.partitions_expected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span>{db.parquet.total_size_human}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rows</span>
                      <span>{formatNumber(db.parquet.row_count)}</span>
                    </div>
                    {db.parquet.conversion_metadata?.elapsed_human && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Conversion</span>
                        <span>{db.parquet.conversion_metadata.elapsed_human}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Reference DB */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-md font-medium">Reference DB</span>
              </div>
              <div className="space-y-1 text-md">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={db.reference_db.loaded ? 'text-green-700' : 'text-red-600'}>{db.reference_db.loaded ? 'Loaded' : 'Not loaded'}</span>
                </div>
                {db.reference_db.loaded && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rows</span>
                      <span>{formatNumber(db.reference_db.row_count)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Columns</span>
                      <span>{db.reference_db.column_count}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Freshness details */}
          <div className="grid grid-cols-2 gap-4 text-md pt-2 border-t border-border">
            <div>
              <span className="text-muted-foreground">Source age</span>
              <p className="font-medium">{db.freshness.source_age_days != null ? db.freshness.source_age_days + ' days' : '--'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Parquet age</span>
              <p className="font-medium">{db.freshness.parquet_age_days != null ? db.freshness.parquet_age_days + ' days' : '--'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 pb-3 border-t flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="text-sm"
              disabled={isTaskRunning}
              onClick={(e) => { e.stopPropagation(); onUpdate(db.name) }}
            >
              <Play className="h-3 w-3 mr-1" />
              Update
            </Button>
            {db.source_url && (
              <a
                href={db.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-border rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                Source
              </a>
            )}
            <span className="text-sm text-muted-foreground ml-auto">
              Est: {TIME_ESTIMATES[db.name] || 'unknown'}
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  )
}


// =========================================================================
// MAIN COMPONENT
// =========================================================================

export function ReferenceDatabasesContent() {
  const [data, setData] = useState<AllDatabasesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTask, setActiveTask] = useState<TaskStatus | null>(null)
  const [confirmAction, setConfirmAction] = useState<'update-all' | 'rebuild' | null>(null)
  const [confirmDb, setConfirmDb] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadData = useCallback(async () => {
    try {
      const result = await preprocessingApi.getDatabases()
      setData(result)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  const startPolling = useCallback((taskId: string) => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const task = await preprocessingApi.getTask(taskId)
        setActiveTask(task)

        if (task.status === 'completed' || task.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
          loadData()
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = null
      }
    }, 3000)
  }, [loadData])

  const checkRunningTasks = useCallback(async () => {
    try {
      const tasks = await preprocessingApi.getTasks()
      const running = tasks.tasks.find(
        (t) => t.status === 'started' || t.status === 'processing'
      )
      if (running) {
        setActiveTask(running)
        startPolling(running.task_id)
      }
    } catch {
      // Ignore
    }
  }, [startPolling])

  useEffect(() => {
    loadData()
    checkRunningTasks()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [loadData, checkRunningTasks])

  // Actions
  const handleUpdateAll = async () => {
    setActionLoading(true)
    try {
      const result = await preprocessingApi.updateAll(false)
      setActiveTask({
        task_id: result.task_id, status: 'started', started_at: new Date().toISOString(),
        completed_at: null, elapsed_seconds: null, databases: {},
        current_database: null, current_step: 'initializing', log_tail: [],
        successful: null, failed: null, message: result.message || undefined,
      })
      startPolling(result.task_id)
      setConfirmAction(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRebuild = async () => {
    setActionLoading(true)
    try {
      const result = await preprocessingApi.rebuildReferenceDB()
      setActiveTask({
        task_id: result.task_id, status: 'started', started_at: new Date().toISOString(),
        completed_at: null, elapsed_seconds: null,
        databases: { reference_db: { status: 'processing' } },
        current_database: 'reference_db', current_step: 'rebuilding', log_tail: [],
        successful: null, failed: null, message: result.message || undefined,
      })
      startPolling(result.task_id)
      setConfirmAction(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start rebuild')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateDatabase = async (dbName: string) => {
    setConfirmDb(dbName)
  }

  const confirmDatabaseUpdate = async () => {
    if (!confirmDb) return
    setActionLoading(true)
    try {
      const result = await preprocessingApi.updateDatabase(confirmDb, false)
      setActiveTask({
        task_id: result.task_id, status: 'started', started_at: new Date().toISOString(),
        completed_at: null, elapsed_seconds: null,
        databases: { [confirmDb]: { status: 'pending' } },
        current_database: confirmDb, current_step: 'initializing', log_tail: [],
        successful: null, failed: null, message: result.message || undefined,
      })
      startPolling(result.task_id)
      setConfirmDb(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start')
    } finally {
      setActionLoading(false)
    }
  }

  const isTaskRunning = activeTask != null && (activeTask.status === 'started' || activeTask.status === 'processing')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Reference Databases</h3>
        <p className="text-base text-destructive">{error || 'Failed to load database status.'}</p>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Reference Databases</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={cn('h-3 w-3 mr-1', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-sm"
            disabled={isTaskRunning}
            onClick={() => setConfirmAction('rebuild')}
          >
            <HardDrive className="h-3 w-3 mr-1" />
            Rebuild Reference DB
          </Button>
          <Button
            variant="default"
            size="sm"
            className="text-sm"
            disabled={isTaskRunning}
            onClick={() => setConfirmAction('update-all')}
          >
            <Play className="h-3 w-3 mr-1" />
            Update All
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-md text-red-800">
          {error}
        </div>
      )}

      {/* Reference DB Summary */}
      <div className="border border-border rounded-lg bg-card divide-y divide-border">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="text-base font-medium">reference_db.duckdb</span>
          </div>
          <div className="flex items-center gap-4 text-md text-muted-foreground">
            <span>{data.reference_db.file_size_human}</span>
            <span>{data.reference_db.tables.length} tables</span>
            <span>{formatNumber(data.reference_db.total_rows)} total rows</span>
            <span>Updated {formatDate(data.reference_db.last_modified)}</span>
          </div>
        </div>
      </div>

      {/* Active Task */}
      {activeTask && <TaskProgressPanel task={activeTask} />}

      {/* Database Cards */}
      <div className="space-y-3">
        <p className="text-base text-muted-foreground">
          {data.databases.length} databases (sorted by processing priority)
        </p>
        {data.databases.map((db) => (
          <DatabaseCard
            key={db.name}
            db={db}
            onUpdate={handleUpdateDatabase}
            isTaskRunning={isTaskRunning}
          />
        ))}
      </div>

      {/* Confirm: Update All */}
      {confirmAction === 'update-all' && (
        <ConfirmDialog
          title="Update All Databases"
          message="This will check for updates and re-process all reference databases in priority order."
          warning="ClinVar with VEP enrichment takes 2-4 hours. The full pipeline may take 4-6 hours."
          confirmLabel="Start Update All"
          onConfirm={handleUpdateAll}
          onCancel={() => setConfirmAction(null)}
          isLoading={actionLoading}
        />
      )}

      {/* Confirm: Rebuild Reference DB */}
      {confirmAction === 'rebuild' && (
        <ConfirmDialog
          title="Rebuild Reference Database"
          message="This will rebuild reference_db.duckdb from existing parquet files. No re-download or re-conversion."
          warning="The reference database will be temporarily unavailable during rebuild (5-10 minutes). Active analysis sessions may fail."
          confirmLabel="Rebuild Now"
          onConfirm={handleRebuild}
          onCancel={() => setConfirmAction(null)}
          isLoading={actionLoading}
        />
      )}

      {/* Confirm: Single Database Update */}
      {confirmDb && (
        <ConfirmDialog
          title={'Update ' + confirmDb}
          message={'Re-download, convert, and load ' + confirmDb + ' into the reference database.'}
          warning={'Estimated time: ' + (TIME_ESTIMATES[confirmDb] || 'unknown')}
          confirmLabel="Start Update"
          onConfirm={confirmDatabaseUpdate}
          onCancel={() => setConfirmDb(null)}
          isLoading={actionLoading}
        />
      )}
    </div>
  )
}
