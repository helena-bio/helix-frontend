"use client"

/**
 * UploadValidationFlow Component - Unified Upload + Validation Experience
 *
 * Seamless flow:
 * 1. File Selection (drag & drop or browse)
 * 2. Upload Progress (real progress via XMLHttpRequest)
 * 3. Validation Progress (polling task status)
 * 4. Auto-advance to Phenotype step on success
 *
 * Single UI component throughout - only text/progress changes
 */

import { useCallback, useMemo, useState, useRef, useEffect, type ChangeEvent, type DragEvent } from 'react'
import { Upload, FileCode, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { useUploadVCF, useStartValidation } from '@/hooks/mutations'
import { useTaskStatus } from '@/hooks/queries'
import { useJourney } from '@/contexts/JourneyContext'
import { toast } from 'sonner'

// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
const ALLOWED_EXTENSIONS = ['.vcf', '.vcf.gz']

// Flow phases
type FlowPhase = 'selection' | 'uploading' | 'validating' | 'error'

interface UploadValidationFlowProps {
  onComplete?: (sessionId: string) => void
  onError?: (error: Error) => void
}

export function UploadValidationFlow({ onComplete, onError }: UploadValidationFlowProps) {
  // Flow state
  const [phase, setPhase] = useState<FlowPhase>('selection')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // File selection state
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationProgress, setValidationProgress] = useState(0)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  // Mutations
  const uploadMutation = useUploadVCF()
  const startValidationMutation = useStartValidation()

  // Journey context
  const { nextStep } = useJourney()

  // Poll task status when validating
  const { data: taskStatus } = useTaskStatus(taskId, {
    enabled: !!taskId && phase === 'validating',
  })

  // Handle validation task completion
  useEffect(() => {
    if (!taskStatus || phase !== 'validating') return

    // Update progress from task info
    if (taskStatus.info?.progress) {
      setValidationProgress(taskStatus.info.progress)
    }

    if (taskStatus.ready) {
      if (taskStatus.successful) {
        toast.success('File validated successfully', {
          description: `${taskStatus.result?.total_variants?.toLocaleString() || 'Unknown'} variants found`,
        })

        // Immediately advance to next step (Phenotype)
        if (sessionId) {
          onComplete?.(sessionId)
          nextStep()
        }
      } else if (taskStatus.failed) {
        const error = taskStatus.result?.error || 'Validation failed'
        setPhase('error')
        setErrorMessage(error)
        onError?.(new Error(error))
      }
    }
  }, [taskStatus, phase, sessionId, nextStep, onComplete, onError])

  // Computed values
  const fileSize = useMemo(() => {
    if (!selectedFile) return null
    const mb = selectedFile.size / (1024 * 1024)
    return mb < 1
      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
      : `${mb.toFixed(2)} MB`
  }, [selectedFile])

  const canSubmit = useMemo(() => {
    return !!(selectedFile && phase === 'selection' && !validationError)
  }, [selectedFile, phase, validationError])

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))

    if (!hasValidExtension) {
      return `Invalid file type. Please upload ${ALLOWED_EXTENSIONS.join(' or ')} files.`
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 2GB.`
    }

    if (file.size === 0) {
      return 'File is empty.'
    }

    return null
  }, [])

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (dragCounterRef.current === 1) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      const error = validateFile(file)

      if (error) {
        setValidationError(error)
        toast.error('Invalid file', { description: error })
        return
      }

      setSelectedFile(file)
      setValidationError(null)
      toast.success('File selected', { description: file.name })
    }
  }, [validateFile])

  // File input handler
  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      const error = validateFile(file)

      if (error) {
        setValidationError(error)
        toast.error('Invalid file', { description: error })
        return
      }

      setSelectedFile(file)
      setValidationError(null)
      toast.success('File selected', { description: file.name })
    }
  }, [validateFile])

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null)
    setValidationError(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Submit handler - starts the full flow
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !selectedFile) return

    setUploadProgress(0)
    setValidationProgress(0)
    setPhase('uploading')

    try {
      // Phase 1: Upload
      const uploadResult = await uploadMutation.mutateAsync({
        file: selectedFile,
        analysisType: 'germline',
        genomeBuild: 'GRCh38',
        onProgress: setUploadProgress,
      })

      setSessionId(uploadResult.id)
      setUploadProgress(100)

      // Phase 2: Start validation
      setPhase('validating')
      setValidationProgress(0)

      const validationResult = await startValidationMutation.mutateAsync(uploadResult.id)
      setTaskId(validationResult.task_id)

      // Task polling will be handled by useTaskStatus hook

    } catch (error) {
      const err = error as Error
      setPhase('error')
      setErrorMessage(err.message)
      toast.error('Process failed', { description: err.message })
      onError?.(err)
    }
  }, [canSubmit, selectedFile, uploadMutation, startValidationMutation, onError])

  // Reset handler
  const handleReset = useCallback(() => {
    setPhase('selection')
    setSelectedFile(null)
    setSessionId(null)
    setTaskId(null)
    setErrorMessage(null)
    setValidationError(null)
    setUploadProgress(0)
    setValidationProgress(0)
    uploadMutation.reset()
    startValidationMutation.reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [uploadMutation, startValidationMutation])

  // Get current phase info for display
  const getPhaseInfo = () => {
    switch (phase) {
      case 'uploading':
        return {
          title: 'Uploading File',
          description: 'Please wait while we upload your VCF file...',
          progress: uploadProgress,
          showSpinner: false,
        }
      case 'validating':
        return {
          title: 'Validating VCF File',
          description: 'Checking file format, headers, and structure...',
          progress: validationProgress || 10,
          showSpinner: true,
        }
      default:
        return null
    }
  }

  const phaseInfo = getPhaseInfo()

  // Render - Processing State (Upload or Validation)
  if (phase === 'uploading' || phase === 'validating') {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10">
                <FileCode className="h-8 w-8 text-primary animate-pulse" />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">{phaseInfo?.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {phaseInfo?.description}
                </p>
              </div>

              <div className="space-y-2">
                <Progress value={phaseInfo?.progress || 0} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{selectedFile?.name}</span>
                  <span>{phaseInfo?.progress}%</span>
                </div>
              </div>

              {phaseInfo?.showSpinner && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>This usually takes a few seconds...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render - Error State
  if (phase === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-8">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Process Failed</h3>
                <p className="text-sm text-muted-foreground">
                  {errorMessage || 'An unexpected error occurred'}
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={handleSubmit}>Try Again</Button>
                <Button variant="outline" onClick={handleReset}>
                  Start Over
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render - File Selection State
  return (
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Upload VCF File</h1>
          <p className="text-muted-foreground">
            Start your analysis by uploading a genetic variant file
          </p>
        </div>

        {/* File Upload Zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg transition-all
            ${isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-border hover:border-primary/50 hover:bg-accent/5'
            }
            ${selectedFile ? 'p-6' : 'p-12'}
          `}
          role="button"
          tabIndex={0}
          aria-label="File upload area"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleBrowseClick()
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            className="sr-only"
            disabled={phase !== 'selection'}
            aria-label="File input"
          />

          {selectedFile ? (
            // Selected File Display
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 p-2 rounded bg-primary/10">
                  <FileCode className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{fileSize}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                disabled={phase !== 'selection'}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            // Empty State
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="p-6 rounded-full bg-primary/10">
                <FileCode className="h-12 w-12 text-primary" />
              </div>

              <div>
                <p className="text-lg font-medium mb-2">
                  Drag and drop your VCF file here
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports .vcf and .vcf.gz files (max 2GB)
                </p>
              </div>

              <Button size="lg" onClick={handleBrowseClick}>
                <Upload className="h-5 w-5 mr-2" />
                Select File
              </Button>
            </div>
          )}
        </div>

        {/* Validation Error */}
        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        {selectedFile && (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleRemoveFile}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              size="lg"
              className="min-w-[120px]"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Upload & Analyze
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
