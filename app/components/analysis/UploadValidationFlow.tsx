"use client"

/**
 * UploadValidationFlow Component - Unified Upload + Validation + QC Experience
 *
 * AUTO-COMPRESSION: Files are automatically compressed before upload for faster speeds
 * - Happens transparently with visible progress
 * - Shows "Auto-compressing..." during compression
 * - Shows "Uploading..." during upload
 * - User can upload .vcf.gz if they want (no re-compression)
 *
 * PERFORMANCE LOGGING: Detailed console logs for debugging upload performance
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
 * 1. File Selection (drag & drop or browse)
 * 2. Compression (if .vcf) - Shows progress
 * 3. Upload Progress
 * 4. Validation Progress
 * 5. QC Results display - Upload shows completed (visual override in JourneyPanel)
 * 6. User clicks "Start Processing" -> Advances journey to processing
 */

import { useCallback, useMemo, useState, useRef, useEffect, type ChangeEvent, type DragEvent } from 'react'
import { Upload, FileCode, AlertCircle, CheckCircle2, X, Download, Info, PlayCircle, Dna, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelixLoader } from '@/components/ui/helix-loader'
import { useUploadVCF, useStartValidation } from '@/hooks/mutations'
import { useTaskStatus } from '@/hooks/queries'
import { useJourney } from '@/contexts/JourneyContext'
import { useFileCompression } from '@/hooks/useFileCompression'
import { toast } from 'sonner'

// Constants
const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024 // 20GB (increased for nuclear server optimizations)
const ALLOWED_EXTENSIONS = ['.vcf', '.vcf.gz']

// Flow phases
type FlowPhase = 'selection' | 'compressing' | 'uploading' | 'validating' | 'qc_results' | 'error'

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
  const [caseName, setCaseName] = useState<string>('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationProgress, setValidationProgress] = useState(0)
  const [wasCompressed, setWasCompressed] = useState(false) // Track if file was auto-compressed

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  // Mutations
  const uploadMutation = useUploadVCF()
  const startValidationMutation = useStartValidation()

  // Compression hook
  const { compress, shouldCompress, isSupported: isCompressionSupported } = useFileCompression()

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
        // Store QC results and show QC screen
        setQcResults({
          totalVariants: taskStatus.result?.total_variants || 0,
          sampleCount: taskStatus.result?.sample_count || 1,
          genomeBuild: taskStatus.result?.genome_build || 'Unknown',
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
    const gb = selectedFile.size / (1024 * 1024 * 1024)

    if (gb >= 1) {
      return `${gb.toFixed(2)} GB`
    } else if (mb < 1) {
      return `${(selectedFile.size / 1024).toFixed(1)} KB`
    } else {
      return `${mb.toFixed(2)} MB`
    }
  }, [selectedFile])

  const canSubmit = useMemo(() => {
    return !!(selectedFile && phase === 'selection' && !validationError)
  }, [selectedFile, phase, validationError])

  // Is processing (compressing, uploading or validating)
  const isProcessing = phase === 'compressing' || phase === 'uploading' || phase === 'validating'

  // Get button text based on phase
  const getButtonText = () => {
    switch (phase) {
      case 'compressing':
        return 'Auto-compressing...'
      case 'uploading':
        return 'Uploading...'
      case 'validating':
        return 'Validating...'
      default:
        return 'Upload & Analyze'
    }
  }

  // Get current progress based on phase
  const currentProgress = useMemo(() => {
    switch (phase) {
      case 'compressing':
        return compressionProgress
      case 'uploading':
        return uploadProgress
      case 'validating':
        return validationProgress || 10
      default:
        return 0
    }
  }, [phase, compressionProgress, uploadProgress, validationProgress])

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))

    if (!hasValidExtension) {
      return `Invalid file type. Please upload ${ALLOWED_EXTENSIONS.join(' or ')} files.`
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 20GB.`
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
      setCaseName(file.name.replace(/\.vcf(\.gz)?$/, ''))
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
      setCaseName(file.name.replace(/\.vcf(\.gz)?$/, ''))
      setValidationError(null)
      toast.success('File selected', { description: file.name })
    }
  }, [validateFile])

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null)
    setCaseName('')
    setValidationError(null)
    setCompressionProgress(0)
    setUploadProgress(0)
    setWasCompressed(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Submit handler - AUTO-COMPRESS then upload
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !selectedFile) return

    const totalStartTime = performance.now()

    setCompressionProgress(0)
    setUploadProgress(0)
    setValidationProgress(0)

    console.log('='.repeat(80))
    console.log('[FRONTEND UPLOAD] START')
    console.log('='.repeat(80))
    console.log(`[FILE INFO] Name: ${selectedFile.name}`)
    console.log(`[FILE INFO] Size: ${(selectedFile.size / (1024**2)).toFixed(2)} MB (${selectedFile.size.toLocaleString()} bytes)`)
    console.log(`[FILE INFO] Type: ${selectedFile.type}`)
    console.log(`[COMPRESSION] Supported: ${isCompressionSupported}`)

    try {
      let fileToUpload = selectedFile
      let compressionTime = 0
      let compressionRatio = 1

      // AUTO-COMPRESS if beneficial (ONLY .vcf files, NOT .vcf.gz)
      if (isCompressionSupported && shouldCompress(selectedFile)) {
        try {
          console.log('[COMPRESSION] Starting compression...')
          setPhase('compressing')

          const compressionStart = performance.now()

          // Compress file with progress tracking
          fileToUpload = await compress(selectedFile, (progress) => {
            setCompressionProgress(progress)
          })

          compressionTime = (performance.now() - compressionStart) / 1000
          compressionRatio = selectedFile.size / fileToUpload.size
          setWasCompressed(true)

          console.log(`[COMPRESSION] Complete in ${compressionTime.toFixed(2)}s`)
          console.log(`[COMPRESSION] Original: ${(selectedFile.size / (1024**2)).toFixed(2)} MB`)
          console.log(`[COMPRESSION] Compressed: ${(fileToUpload.size / (1024**2)).toFixed(2)} MB`)
          console.log(`[COMPRESSION] Ratio: ${compressionRatio.toFixed(2)}x (${((1 - 1/compressionRatio) * 100).toFixed(1)}% smaller)`)

        } catch (compressionError) {
          // Compression failed - fallback to original file silently
          console.warn('[COMPRESSION] Failed, uploading original file:', compressionError)
          fileToUpload = selectedFile
          setWasCompressed(false)
        }
      } else {
        if (!isCompressionSupported) {
          console.log('[COMPRESSION] Not supported in this browser')
        } else {
          console.log('[COMPRESSION] Skipped (file already compressed or not beneficial)')
        }
      }

      // Phase 1: Upload (compressed or original file)
      console.log('-'.repeat(80))
      console.log('[UPLOAD] Starting upload...')
      console.log(`[UPLOAD] File to upload: ${(fileToUpload.size / (1024**2)).toFixed(2)} MB`)

      setPhase('uploading')
      setUploadProgress(0) // Reset progress for upload phase

      const uploadStart = performance.now()
      let lastProgressTime = uploadStart
      let lastProgressBytes = 0

      const uploadResult = await uploadMutation.mutateAsync({
        file: fileToUpload,
        analysisType: 'germline',
        genomeBuild: 'GRCh38',
        caseLabel: caseName,
        onProgress: (progress) => {
          setUploadProgress(progress)

          // Log progress every 10% or every 5 seconds
          if (progress % 10 === 0 || performance.now() - lastProgressTime > 5000) {
            const currentTime = performance.now()
            const uploadedBytes = (fileToUpload.size * progress) / 100
            const elapsedTime = (currentTime - uploadStart) / 1000

            // Instant throughput
            const instantBytes = uploadedBytes - lastProgressBytes
            const instantTime = (currentTime - lastProgressTime) / 1000
            const instantThroughput = instantTime > 0 ? (instantBytes / (1024**2)) / instantTime : 0

            // Average throughput
            const avgThroughput = elapsedTime > 0 ? (uploadedBytes / (1024**2)) / elapsedTime : 0

            console.log(`[UPLOAD PROGRESS] ${progress}% - ${(uploadedBytes / (1024**2)).toFixed(1)} MB ` +
                       `(${avgThroughput.toFixed(1)} MB/s avg, ${instantThroughput.toFixed(1)} MB/s now)`)

            lastProgressTime = currentTime
            lastProgressBytes = uploadedBytes
          }
        },
      })

      const uploadTime = (performance.now() - uploadStart) / 1000
      const uploadThroughput = (fileToUpload.size / (1024**2)) / uploadTime

      console.log(`[UPLOAD] Complete in ${uploadTime.toFixed(2)}s`)
      console.log(`[UPLOAD] Average throughput: ${uploadThroughput.toFixed(2)} MB/s`)
      console.log(`[UPLOAD] Session ID: ${uploadResult.id}`)

      setSessionId(uploadResult.id)
      setUploadProgress(100)

      // Phase 2: Start validation
      console.log('-'.repeat(80))
      console.log('[VALIDATION] Starting validation...')

      setValidationProgress(0)
      setPhase('validating')

      // Notify parent to update URL
      onComplete?.(uploadResult.id)

      const validationStart = performance.now()
      const validationResult = await startValidationMutation.mutateAsync(uploadResult.id)
      const validationTime = (performance.now() - validationStart) / 1000

      setTaskId(validationResult.task_id)

      console.log(`[VALIDATION] Task started in ${validationTime.toFixed(2)}s`)
      console.log(`[VALIDATION] Task ID: ${validationResult.task_id}`)

      // Task polling will be handled by useTaskStatus hook

      // Final summary
      const totalTime = (performance.now() - totalStartTime) / 1000
      console.log('='.repeat(80))
      console.log('[FRONTEND UPLOAD] COMPLETE')
      console.log(`[TIMING] Total: ${totalTime.toFixed(2)}s`)
      console.log(`[TIMING]   - Compression: ${compressionTime.toFixed(2)}s`)
      console.log(`[TIMING]   - Upload: ${uploadTime.toFixed(2)}s`)
      console.log(`[TIMING]   - Validation init: ${validationTime.toFixed(2)}s`)
      if (wasCompressed) {
        const effectiveSize = selectedFile.size / compressionRatio
        const effectiveThroughput = (selectedFile.size / (1024**2)) / uploadTime
        console.log(`[EFFECTIVE] Original file uploaded at ${effectiveThroughput.toFixed(2)} MB/s (equivalent)`)
        console.log(`[EFFECTIVE] Time saved by compression: ${(selectedFile.size / effectiveSize * uploadTime - uploadTime).toFixed(2)}s`)
      }
      console.log('='.repeat(80))

    } catch (error) {
      const err = error as Error
      const errorTime = (performance.now() - totalStartTime) / 1000

      console.error('='.repeat(80))
      console.error('[FRONTEND UPLOAD] FAILED')
      console.error(`[ERROR] After ${errorTime.toFixed(2)}s`)
      console.error(`[ERROR] ${err.message}`)
      console.error('='.repeat(80))

      setPhase('error')
      setErrorMessage(err.message)
      toast.error('Process failed', { description: err.message })
      onError?.(err)
    }
  }, [canSubmit, selectedFile, caseName, uploadMutation, startValidationMutation, onComplete, onError, compress, shouldCompress, isCompressionSupported])

  // Reset handler
  const handleReset = useCallback(() => {
    setPhase('selection')
    setSelectedFile(null)
    setCaseName('')
    setSessionId(null)
    setTaskId(null)
    setErrorMessage(null)
    setValidationError(null)
    setQcResults(null)
    setCompressionProgress(0)
    setUploadProgress(0)
    setValidationProgress(0)
    setWasCompressed(false)
    uploadMutation.reset()
    startValidationMutation.reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [uploadMutation, startValidationMutation])

  // Handle processing button click
  const handleProcessingClick = useCallback(() => {
    if (sessionId) {
      nextStep() // upload -> processing
    }
  }, [sessionId, nextStep])

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

  // Render - QC Results State
  if (phase === 'qc_results' && qcResults) {
    // Check if genome build is supported
    const isGRCh37 = qcResults.genomeBuild === 'GRCh37'
    const isSupported = qcResults.genomeBuild === 'GRCh38'

    return (
      <div className="flex flex-col min-h-[600px] p-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {/* Header - HelixLoader + Title (same as upload screen, not animated) */}
          <div className="flex items-center justify-center gap-4">
            <HelixLoader size="xs" speed={3} animated={false} />
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">Upload VCF File</h1>
              <p className="text-base text-muted-foreground">
                Upload a genetic variant file
              </p>
            </div>
          </div>

          {/* File Info & QC Results Card */}
          <Card>
            <CardContent className="p-6">
              {/* File Header */}
              <div className="border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <FileCode className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">File</p>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-medium">{selectedFile?.name}</p>
                    <span className="text-muted-foreground">-</span>
                    <p className="text-sm text-muted-foreground">{fileSize}</p>
                    {/* Subtle indicator that file was auto-compressed (only visible after QC) */}
                    {wasCompressed && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Zap className="h-3 w-3 text-blue-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">Auto-compressed for faster upload</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
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
                  {isSupported ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-lg font-semibold text-green-600">Valid</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <p className="text-lg font-semibold text-destructive">Not Supported</p>
                    </div>
                  )}
                </div>
              </div>

              {/* GRCh37 Warning */}
              {isGRCh37 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-base">
                    GRCh37 genome build is not supported. This system requires GRCh38 (hg38) VCF files.
                    Please convert your VCF to GRCh38 using tools like Picard LiftoverVcf or CrossMap.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Next Step CTA - only show if GRCh38 */}
          {isSupported && (
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
          )}

          {/* Reset button for unsupported builds */}
          {!isSupported && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleReset}>
                <span className="text-base">Upload Different File</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render - Error State
  if (phase === 'error') {
    return (
      <div className="flex flex-col min-h-[600px] p-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {/* Header - HelixLoader + Title (same as upload screen, not animated) */}
          <div className="flex items-center justify-center gap-4">
            <HelixLoader size="xs" speed={3} animated={false} />
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">Upload VCF File</h1>
              <p className="text-base text-muted-foreground">
                Upload a genetic variant file
              </p>
            </div>
          </div>

          <Card className="border-destructive">
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
      </div>
    )
  }

  // Render - Unified Selection/Upload/Validation State
  return (
    <div className="flex flex-col min-h-[600px] p-8">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header - HelixLoader + Title (fixed position from top) */}
        <div className="flex items-center justify-center gap-4">
          <HelixLoader size="xs" speed={3} animated={isProcessing} />
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Upload VCF File</h1>
            <p className="text-base text-muted-foreground">
              Upload a genetic variant file
            </p>
          </div>
        </div>

        {/* Dotted Upload Zone - expands downward, not upward */}
        <div
          onDragEnter={!isProcessing ? handleDragEnter : undefined}
          onDragLeave={!isProcessing ? handleDragLeave : undefined}
          onDragOver={!isProcessing ? handleDragOver : undefined}
          onDrop={!isProcessing ? handleDrop : undefined}
          className={`
            relative border-2 border-dashed rounded-lg p-12 transition-all
            ${isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-border'
            }
            ${!isProcessing ? 'hover:border-primary/50 hover:bg-accent/5 cursor-pointer' : ''}
          `}
          role={!isProcessing ? 'button' : undefined}
          tabIndex={!isProcessing ? 0 : undefined}
          aria-label="File upload area"
          onClick={!isProcessing && !selectedFile ? handleBrowseClick : undefined}
          onKeyDown={!isProcessing ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleBrowseClick()
            }
          } : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            className="sr-only"
            disabled={isProcessing}
            aria-label="File input"
          />

          <div className="flex flex-col items-center gap-6 text-center">
            {/* Icon - always show */}
            <div className="p-6 rounded-full bg-primary/10">
              <FileCode className="h-12 w-12 text-primary" />
            </div>

            {/* Content varies by state */}
            {selectedFile ? (
              /* File selected or processing state */
              <>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium">{selectedFile.name}</p>
                    {!isProcessing && (
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
                    )}
                  </div>
                  <p className="text-base text-muted-foreground">{fileSize}</p>
                </div>

                {/* Case Name input */}
                {!isProcessing && (
                  <div className="w-full max-w-sm">
                    <label htmlFor="case-name" className="text-sm text-muted-foreground mb-1 block text-left">
                      Case Name
                    </label>
                    <input
                      id="case-name"
                      type="text"
                      value={caseName}
                      onChange={(e) => setCaseName(e.target.value)}
                      placeholder="e.g. Patient 001"
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      onClick={(e) => e.stopPropagation()}
                      maxLength={200}
                    />
                  </div>
                )}

                {/* Progress bar - only during processing */}
                {isProcessing && (
                  <div className="w-full max-w-sm space-y-2">
                    <Progress value={currentProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">{currentProgress}%</p>
                  </div>
                )}

                {/* Button - always visible, disabled during processing */}
                <Button
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSubmit()
                  }}
                  disabled={isProcessing || !canSubmit}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      <span className="text-base">{getButtonText()}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      <span className="text-base">Upload & Analyze</span>
                    </>
                  )}
                </Button>
              </>
            ) : (
              /* No file state */
              <>
                <div>
                  <p className="text-lg font-medium mb-2">
                    Drag and drop your VCF file here
                  </p>
                  <p className="text-base text-muted-foreground mb-1">
                    or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports .vcf and .vcf.gz files (max 20GB)
                  </p>
                </div>
                <Button size="lg" onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}>
                  <Upload className="h-5 w-5 mr-2" />
                  <span className="text-base">Select File</span>
                </Button>
              </>
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
