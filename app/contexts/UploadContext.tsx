/**
 * Upload Context - Background Upload Management
 *
 * Manages the entire upload lifecycle independent of component mounting:
 * - File compression (Web Worker)
 * - XHR upload with progress
 * - Server-side validation polling
 * - QC results
 *
 * Mounted in providers.tsx (root level), so upload continues
 * even when user navigates away from /upload page.
 *
 * PERSISTENCE (localStorage key: 'helix_upload_state'):
 * - Saves: sessionId, taskId, phase, fileName, caseName, fileSize, qcResults
 * - On hydration: resumes validation polling if taskId exists
 * - File object cannot be persisted - upload is lost on page refresh
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
import { casesKeys } from '@/hooks/queries/use-cases'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'helix_upload_state'
const POLL_INTERVAL = 2000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QCResults {
  totalVariants: number
  sampleCount: number
  genomeBuild: string
}

export type UploadPhase =
  | 'idle'
  | 'compressing'
  | 'uploading'
  | 'validating'
  | 'qc_results'
  | 'error'

/** Subset of state that survives page refresh */
interface PersistedState {
  phase: UploadPhase
  fileName: string | null
  caseName: string | null
  fileSize: number | null
  sessionId: string | null
  taskId: string | null
  qcResults: QCResults | null
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
  qcResults: QCResults | null
  errorMessage: string | null
  wasCompressed: boolean
  compressionProgress: number
  uploadProgress: number
  validationProgress: number

  // Computed
  isActive: boolean
  currentProgress: number

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
  const [qcResults, setQcResults] = useState<QCResults | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [wasCompressed, setWasCompressed] = useState(false)

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

  const startPolling = useCallback((tid: string) => {
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
            const qc: QCResults = {
              totalVariants: status.result?.total_variants || 0,
              sampleCount: status.result?.sample_count || 1,
              genomeBuild: status.result?.genome_build || 'Unknown',
            }
            setQcResults(qc)
            setPhase('qc_results')
            persist({ phase: 'qc_results', qcResults: qc })

            toast.success('File validated successfully', {
              description: `${qc.totalVariants.toLocaleString()} variants found`,
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
  }, [stopPolling, persist])

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
      if (saved.qcResults) setQcResults(saved.qcResults)
      if (saved.wasCompressed) setWasCompressed(saved.wasCompressed)

      // Phase-specific recovery
      if (saved.phase === 'compressing' || saved.phase === 'uploading') {
        // File object is gone after refresh - cannot resume
        setPhase('error')
        setErrorMessage('Upload was interrupted. Please upload the file again.')
        persist({ phase: 'error', errorMessage: 'Upload was interrupted. Please upload the file again.' })
      } else if (saved.phase === 'validating' && saved.taskId) {
        // Server-side task still running - resume polling
        setPhase('validating')
        startPolling(saved.taskId)
      } else if (saved.phase === 'qc_results' && saved.qcResults) {
        setPhase('qc_results')
      } else if (saved.phase === 'error') {
        setPhase('error')
        setErrorMessage(saved.errorMessage || 'Unknown error')
      }
      // else: 'idle' or unknown - stay idle
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
    setQcResults(null)
    setErrorMessage(null)
    setWasCompressed(false)
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
      qcResults: null,
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
        queryClient.invalidateQueries({ queryKey: casesKeys.all })

        // Step 3: Start server-side validation
        setPhase('validating')
        persist({ ...base, phase: 'validating', sessionId: sid })

        const validationResult = await startValidation(sid)
        const tid = validationResult.task_id
        setTaskId(tid)
        persist({ ...base, phase: 'validating', sessionId: sid, taskId: tid })

        // Step 4: Poll for validation completion
        startPolling(tid)

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
    setQcResults(null)
    setErrorMessage(null)
    setWasCompressed(false)
    setCompressionProgress(0)
    setUploadProgress(0)
    setValidationProgress(0)
    clearPersisted()
  }, [stopPolling, clearPersisted])

  // -----------------------------------------------------------------------
  // Computed values
  // -----------------------------------------------------------------------

  const isActive = phase !== 'idle'

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
    qcResults,
    errorMessage,
    wasCompressed,
    compressionProgress,
    uploadProgress,
    validationProgress,
    isActive,
    currentProgress,
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
