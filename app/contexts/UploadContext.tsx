/**
 * Upload Context - Background Upload Management (REFACTORED)
 *
 * TRANSIENT PIPELINE TRACKER ONLY. Does NOT hold QC results.
 * Server is the source of truth for session data (via React Query).
 *
 * Manages:
 * - File compression (Web Worker)
 * - XHR upload with progress
 * - Server-side validation polling
 *
 * After validation succeeds:
 * - Phase goes to 'idle' (not 'qc_results')
 * - completedSessionId is set for reference
 * - React Query caches invalidated so UI picks up validated session
 * - localStorage cleared (server has the data now)
 *
 * Mounted in providers.tsx (root level), so upload continues
 * even when user navigates away from /upload page.
 *
 * SINGLE UPLOAD: Only one upload at a time.
 */

'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { uploadVCFFile, startValidation, getTaskStatus } from '@/lib/api/variant-analysis'
import {
  compressFile,
  shouldCompress,
  isCompressionSupported,
} from '@/lib/utils/file-compression'
import { invalidateSessionCaches } from '@/lib/cache/invalidate-session-caches'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'helix_upload_state'
const POLL_INTERVAL = 2000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UploadPhase =
  | 'idle'
  | 'compressing'
  | 'uploading'
  | 'validating'
  | 'error'
// REMOVED: 'qc_results' -- QC data comes from server via React Query

/** Subset of state that survives page refresh */
interface PersistedState {
  phase: UploadPhase
  fileName: string | null
  caseName: string | null
  fileSize: number | null
  sessionId: string | null
  taskId: string | null
  errorMessage: string | null
  wasCompressed: boolean
}

export interface UploadContextType {
  // State
  phase: UploadPhase
  fileName: string | null
  caseName: string | null
  fileSize: number | null
  sessionId: string | null
  taskId: string | null
  errorMessage: string | null
  wasCompressed: boolean
  compressionProgress: number
  uploadProgress: number
  validationProgress: number

  // Computed
  isActive: boolean
  currentProgress: number

  // Reference to last completed upload (for sidebar link)
  completedSessionId: string | null

  // Actions
  startUpload: (file: File, caseName: string, retainFile: boolean) => void
  resetUpload: () => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const UploadContext = createContext<UploadContextType | undefined>(undefined)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function UploadProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  // Core state
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const [fileName, setFileName] = useState<string | null>(null)
  const [caseName, setCaseName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [wasCompressed, setWasCompressed] = useState(false)

  // Completed session reference (persists until next upload)
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null)

  // Progress (not persisted - transient UI state)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationProgress, setValidationProgress] = useState(0)

  // Refs
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // -----------------------------------------------------------------------
  // localStorage persistence helpers
  // -----------------------------------------------------------------------

  const persist = useCallback((updates: Partial<PersistedState>) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const current = raw ? JSON.parse(raw) : {}
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...updates }))
    } catch {
      // localStorage full or unavailable - non-fatal
    }
  }, [])

  const clearPersisted = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // -----------------------------------------------------------------------
  // Validation polling (runs in context, independent of components)
  // -----------------------------------------------------------------------

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startPolling = useCallback((tid: string, sid: string) => {
    stopPolling()

    pollRef.current = setInterval(async () => {
      try {
        const status = await getTaskStatus(tid)

        // Update progress
        if (status.info?.progress) {
          setValidationProgress(status.info.progress)
        }

        // Terminal state
        if (status.ready) {
          stopPolling()

          if (status.successful) {
            // -- KEY CHANGE: go idle, let React Query handle QC data --
            const totalVariants = status.result?.total_variants || 0

            setCompletedSessionId(sid)
            setPhase('idle')
            clearPersisted()

            // Invalidate React Query caches so UI picks up validated session
            invalidateSessionCaches(queryClient, sid)

            toast.success('File validated successfully', {
              description: `${totalVariants.toLocaleString()} variants found`,
            })
          } else if (status.failed) {
            const error = status.result?.error || 'Validation failed'
            setPhase('error')
            setErrorMessage(error)
            persist({ phase: 'error', errorMessage: error })
          }
        }
      } catch {
        // Network blip - keep polling, next interval will retry
      }
    }, POLL_INTERVAL)
  }, [stopPolling, clearPersisted, persist, queryClient])

  // -----------------------------------------------------------------------
  // Hydrate persisted state on mount
  // -----------------------------------------------------------------------

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return

      const saved: PersistedState = JSON.parse(raw)

      // Restore all persistable fields
      if (saved.fileName) setFileName(saved.fileName)
      if (saved.caseName) setCaseName(saved.caseName)
      if (saved.fileSize) setFileSize(saved.fileSize)
      if (saved.sessionId) setSessionId(saved.sessionId)
      if (saved.taskId) setTaskId(saved.taskId)
      if (saved.wasCompressed) setWasCompressed(saved.wasCompressed)

      // Phase-specific recovery
      if (saved.phase === 'compressing' || saved.phase === 'uploading') {
        // File object is gone after refresh - cannot resume
        setPhase('error')
        setErrorMessage('Upload was interrupted. Please upload the file again.')
        persist({ phase: 'error', errorMessage: 'Upload was interrupted. Please upload the file again.' })
      } else if (saved.phase === 'validating' && saved.taskId && saved.sessionId) {
        // Server-side task still running - resume polling
        setPhase('validating')
        startPolling(saved.taskId, saved.sessionId)
      } else if (saved.phase === 'error') {
        setPhase('error')
        setErrorMessage(saved.errorMessage || 'Unknown error')
      }
      // else: idle or unknown - stay idle
      // REMOVED: 'qc_results' recovery -- server has the data
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup on unmount
  useEffect(() => stopPolling, [stopPolling])

  // -----------------------------------------------------------------------
  // Start upload pipeline (compression -> upload -> validation)
  // -----------------------------------------------------------------------

  const startUpload = useCallback((
    file: File,
    name: string,
    retainFile: boolean,
  ) => {
    // Reset everything before starting
    stopPolling()
    setFileName(file.name)
    setCaseName(name)
    setFileSize(file.size)
    setSessionId(null)
    setTaskId(null)
    setErrorMessage(null)
    setWasCompressed(false)
    setCompletedSessionId(null)
    setCompressionProgress(0)
    setUploadProgress(0)
    setValidationProgress(0)

    // Persistent baseline for this upload
    const base: PersistedState = {
      phase: 'idle',
      fileName: file.name,
      caseName: name,
      fileSize: file.size,
      sessionId: null,
      taskId: null,
      errorMessage: null,
      wasCompressed: false,
    }

    // Run the async pipeline (not awaited - fire and forget)
    ;(async () => {
      try {
        let fileToUpload = file
        let compressed = false

        // Step 1: Compression (if needed)
        if (isCompressionSupported() && shouldCompress(file)) {
          setPhase('compressing')
          persist({ ...base, phase: 'compressing' })

          fileToUpload = await compressFile(file, (progress) => {
            setCompressionProgress(progress)
          })
          compressed = true
          setWasCompressed(true)
          base.wasCompressed = true
        }

        // Step 2: Upload to server
        setPhase('uploading')
        persist({ ...base, phase: 'uploading' })

        const uploadResult = await uploadVCFFile(
          fileToUpload,
          'germline',
          'GRCh38',
          name,
          retainFile,
          (progress) => {
            setUploadProgress(progress)
          },
        )

        const sid = uploadResult.id
        setSessionId(sid)
        setUploadProgress(100)
        base.sessionId = sid

        // Invalidate cases list so sidebar picks up the new session
        invalidateSessionCaches(queryClient, sid)

        // Step 3: Start server-side validation
        setPhase('validating')
        persist({ ...base, phase: 'validating', sessionId: sid })

        const validationResult = await startValidation(sid)
        const tid = validationResult.task_id
        setTaskId(tid)
        persist({ ...base, phase: 'validating', sessionId: sid, taskId: tid })

        // Step 4: Poll for validation completion
        startPolling(tid, sid)

      } catch (error) {
        const err = error as Error
        setPhase('error')
        setErrorMessage(err.message)
        persist({ ...base, phase: 'error', errorMessage: err.message })
        toast.error('Upload failed', { description: err.message })
      }
    })()
  }, [stopPolling, persist, startPolling, queryClient])

  // -----------------------------------------------------------------------
  // Reset (clear everything, return to idle)
  // -----------------------------------------------------------------------

  const resetUpload = useCallback(() => {
    stopPolling()
    setPhase('idle')
    setFileName(null)
    setCaseName(null)
    setFileSize(null)
    setSessionId(null)
    setTaskId(null)
    setErrorMessage(null)
    setWasCompressed(false)
    setCompletedSessionId(null)
    setCompressionProgress(0)
    setUploadProgress(0)
    setValidationProgress(0)
    clearPersisted()
  }, [stopPolling, clearPersisted])

  // -----------------------------------------------------------------------
  // Computed values
  // -----------------------------------------------------------------------

  // CHANGED: isActive only during pipeline execution, NOT idle/error
  const isActive = phase === 'compressing' || phase === 'uploading' || phase === 'validating'

  const currentProgress = (() => {
    switch (phase) {
      case 'compressing': return compressionProgress
      case 'uploading': return uploadProgress
      case 'validating': return validationProgress || 10
      default: return 0
    }
  })()

  // -----------------------------------------------------------------------
  // Provide
  // -----------------------------------------------------------------------

  const value: UploadContextType = {
    phase,
    fileName,
    caseName,
    fileSize,
    sessionId,
    taskId,
    errorMessage,
    wasCompressed,
    compressionProgress,
    uploadProgress,
    validationProgress,
    isActive,
    currentProgress,
    completedSessionId,
    startUpload,
    resetUpload,
  }

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUploadContext(): UploadContextType {
  const context = useContext(UploadContext)
  if (!context) {
    throw new Error('useUploadContext must be used within UploadProvider')
  }
  return context
}
