"use client"

/**
 * UploadValidationFlow Component - Unified Upload + Validation + QC Experience
 *
 * Typography Scale:
 * - text-3xl: Page titles
 * - text-lg: Section headers, card titles
 * - text-base: Primary content, instructions
 * - text-md: Secondary descriptions
 * - text-sm: Helper text, file info
 * - text-xs: Technical metadata
 *
 * Seamless flow:
 * 1. File Selection (drag & drop or browse) - Journey: upload
 * 2. Upload Progress - Journey: upload
 * 3. Validation Progress - Journey: validation (auto-advance)
 * 4. QC Results display - Journey: validation
 * 5. User clicks "Start Processing" -> Journey: processing
 */

import { useCallback, useMemo, useState, useRef, useEffect, type ChangeEvent, type DragEvent } from 'react'
import { Upload, FileCode, AlertCircle, CheckCircle2, X, Loader2, Download, Info, PlayCircle, Dna } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUploadVCF, useStartValidation } from '@/hooks/mutations'
import { useTaskStatus } from '@/hooks/queries'
import { useJourney } from '@/contexts/JourneyContext'
import { toast } from 'sonner'

// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
const ALLOWED_EXTENSIONS = ['.vcf', '.vcf.gz']

// Flow phases
type FlowPhase = 'selection' | 'uploading' | 'validating' | 'qc_results' | 'error'

interface QCResults {
  totalVariants: number
  sampleCount: number
  genomeBuild: string
}

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
  const [qcResults, setQcResults] = useState<QCResults | null>(null)

  // File selection state
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationProgress, setValidationProgress] = useState(0)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const hasAdvancedToValidation = useRef(false)

  // Mutations
  const uploadMutation = useUploadVCF()
  const startValidationMutation = useStartValidation()

  // Journey context
  const { currentStep, nextStep } = useJourney()

  // Poll task status when validating
  const { data: taskStatus } = useTaskStatus(taskId, {
    enabled: !!taskId && phase === 'validating',
  })

  // Advance journey to validation when we start validating
  useEffect(() => {
    if (phase === 'validating' && currentStep === 'upload' && !hasAdvancedToValidation.current) {
      hasAdvancedToValidation.current = true
      nextStep() // upload -> validation
    }
  }, [phase, currentStep, nextStep])

  // Handle validation task completion
  useEffect(() => {
    if (!taskStatus || phase !== 'validating') return

    // Update progress from task info
    if (taskStatus.info?.progress) {
      setValidationProgress(taskStatus.info.progress)
    }

    if (taskStatus.ready) {
      if (taskStatus.successful) {
        // Store QC results and show QC screen
        setQcResults({
          totalVariants: taskStatus.result?.total_variants || 0,
          sampleCount: taskStatus.result?.sample_count || 1,
          genomeBuild: 'GRCh38',
        })
        setPhase('qc_results')

        toast.success('File validated successfully', {
          description: `${taskStatus.result?.total_variants?.toLocaleString() || 'Unknown'} variants found`,
        })
      } else if (taskStatus.failed) {
        const error = taskStatus.result?.error || 'Validation failed'
        setPhase('error')
        setErrorMessage(error)
        onError?.(new Error(error))
      }
    }
  }, [taskStatus, phase, onError])

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
    hasAdvancedToValidation.current = false

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
    setQcResults(null)
    setUploadProgress(0)
    setValidationProgress(0)
    hasAdvancedToValidation.current = false
    uploadMutation.reset()
    startValidationMutation.reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [uploadMutation, startValidationMutation])

  // Handle processing button click - advance to processing step
  const handleProcessingClick = useCallback(() => {
    if (sessionId) {
      onComplete?.(sessionId)
      nextStep() // validation -> processing
    }
  }, [sessionId, nextStep, onComplete])

  // Download QC report
  const handleDownloadQC = useCallback(() => {
    if (!qcResults || !selectedFile) return

    const report = {
      file: selectedFile.name,
      timestamp: new Date().toISOString(),
      qc: {
        samples: qcResults.sampleCount,
        genomeBuild: qcResults.genomeBuild,
        variants: qcResults.totalVariants,
      },
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qc-report.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [qcResults, selectedFile])

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

  // Render - QC Results State
  if (phase === 'qc_results' && qcResults) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-8">
        <div className="max-w-2xl w-full space-y-6">
          {/* File Info & QC Results Card */}
          <Card>
            <CardContent className="p-6">
              {/* File Header */}
              <div className="border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <FileCode className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center gap-2">
                    <p className="text-base font-medium">{selectedFile?.name}</p>
                    <span className="text-muted-foreground">-</span>
                    <p className="text-sm text-muted-foreground">{fileSize}</p>
                  </div>
                </div>
              </div>

              {/* QC Results Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Quality Control Results</h3>
                <Button variant="ghost" size="sm" onClick={handleDownloadQC}>
                  <Download className="h-4 w-4 mr-2" />
                  <span className="text-sm">Download Report</span>
                </Button>
              </div>

              {/* QC Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Samples Detected</p>
                  <p className="text-2xl font-bold">{qcResults.sampleCount}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-muted-foreground">Genome Build</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            <strong>GRCh38</strong> - Current human genome reference assembly (released December 2013).
                            Also known as hg38.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-2xl font-bold">{qcResults.genomeBuild}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Variants</p>
                  <p className="text-2xl font-bold">{qcResults.totalVariants.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-lg font-semibold text-green-600">Valid</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Step CTA */}
          <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <Dna className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Next: Start variant processing</h3>
                  <p className="text-md text-muted-foreground">
                    Process variants with ACMG classification, annotation, and filtering to identify clinically relevant findings.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleProcessingClick} className="flex-shrink-0">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        <span className="text-base">Start Processing</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Begin variant annotation and ACMG classification</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
                <p className="text-md text-muted-foreground">
                  {phaseInfo?.description}
                </p>
              </div>

              <div className="space-y-2">
                <Progress value={phaseInfo?.progress || 0} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{selectedFile?.name}</span>
                  <span>{phaseInfo?.progress}%</span>
                </div>
              </div>

              {phaseInfo?.showSpinner && (
                <div className="flex items-center justify-center gap-2 text-md text-muted-foreground">
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
                <p className="text-md text-muted-foreground">
                  {errorMessage || 'An unexpected error occurred'}
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={handleSubmit}>
                  <span className="text-base">Try Again</span>
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <span className="text-base">Start Over</span>
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
          <p className="text-base text-muted-foreground">
            Start your analysis by uploading a genetic variant file
          </p>
        </div>

        {/* File Upload Zone - Keep same layout with or without file */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-12 transition-all
            ${isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-border hover:border-primary/50 hover:bg-accent/5'
            }
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

          <div className="flex flex-col items-center gap-6 text-center">
            {/* Icon */}
            <div className="p-6 rounded-full bg-primary/10">
              <FileCode className="h-12 w-12 text-primary" />
            </div>

            {/* Text */}
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-medium">{selectedFile.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile()
                    }}
                    className="p-1 hover:bg-destructive/10 rounded-full transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
                <p className="text-base text-muted-foreground">{fileSize}</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag and drop your VCF file here
                </p>
                <p className="text-base text-muted-foreground mb-1">
                  or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports .vcf and .vcf.gz files (max 2GB)
                </p>
              </div>
            )}

            {/* Button */}
            {selectedFile ? (
              <Button
                size="lg"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSubmit()
                }}
                disabled={!canSubmit}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                <span className="text-base">Upload & Analyze</span>
              </Button>
            ) : (
              <Button size="lg" onClick={handleBrowseClick}>
                <Upload className="h-5 w-5 mr-2" />
                <span className="text-base">Select File</span>
              </Button>
            )}
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-base">{validationError}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
