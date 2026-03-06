"use client"

/**
 * UploadValidationFlow Component - URL-Driven Upload + Validation + QC Experience
 *
 * REFACTORED: Display state driven by URL and server data, not UploadContext.
 *
 * Display logic:
 *   /upload              -> Fresh file selection form
 *   /upload?session=XXX  -> Fetch session from server, show appropriate UI:
 *     - Upload context active for this session -> progress
 *     - session.status === 'uploaded'         -> QC results from server
 *     - session.status === 'created'           -> waiting view
 *     - session.status === 'processing'        -> redirect to processing step
 *     - session.status === 'completed'         -> redirect to analysis
 *     - session.status === 'failed'            -> error view
 *
 * Data sources:
 *   - UploadContext: ONLY for transient pipeline progress (compression/upload/validation)
 *   - React Query useSessionDetail: session status, filename, genome_build
 *   - React Query useSessionQC: total_variants, ti_tv_ratio, mean_depth, qc_passed
 *
 * Typography Scale:
 * - text-3xl: Page titles
 * - text-lg: Section headers, card titles
 * - text-base: Primary content, instructions
 * - text-md: Secondary descriptions
 * - text-sm: Helper text, file info
 * - text-xs: Technical metadata
 */

import { useCallback, useMemo, useState, useRef, useEffect, type ChangeEvent, type DragEvent } from 'react'
import { Upload, FileCode, AlertCircle, CheckCircle2, X, Download, Info, PlayCircle, Dna, Loader2, Zap, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelixLoader } from '@/components/ui/helix-loader'
import { useCases } from '@/hooks/queries/use-cases'
import { useSessionDetail } from '@/hooks/queries/use-session-detail'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useJourney } from '@/contexts/JourneyContext'
import { useUploadContext } from '@/contexts/UploadContext'
import { useSession } from '@/contexts/SessionContext'

import { toast } from 'sonner'

// Constants
const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024 // 20GB
const ALLOWED_EXTENSIONS = ['.vcf', '.vcf.gz']

// Filtering preset definitions for UI
const FILTERING_PRESETS = [
  {
    id: 'strict',
    name: 'Strict',
    description: 'Clinical-grade thresholds (quality>=30, depth>=20, GQ>=30)',
    detail: 'Best for high-quality WES/WGS data. Default for clinical diagnostics.',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Relaxed thresholds (quality>=20, depth>=15, GQ>=20)',
    detail: 'Good for older WGS, panel data, or lower-coverage regions.',
  },
  {
    id: 'permissive',
    name: 'Permissive',
    description: 'Maximum sensitivity (quality>=10, depth>=10, GQ>=10)',
    detail: 'More noise but minimal risk of missing true variants.',
  },
] as const

interface UploadValidationFlowProps {
  onComplete?: (sessionId: string) => void
  onError?: (error: Error) => void
  filteringPreset?: string
  onFilteringPresetChange?: (preset: string) => void
}

export function UploadValidationFlow({ onComplete, onError, filteringPreset = 'strict', onFilteringPresetChange }: UploadValidationFlowProps) {
  // -- Contexts --
  const upload = useUploadContext()
  const { currentSessionId } = useSession()
  const { nextStep, goToStep, skipToAnalysis } = useJourney()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: casesData } = useCases()

  // -- URL-driven display logic --
  // Is upload context actively working on a pipeline?
  const isUploadActive = upload.isActive

  // Does the upload context match the current URL session?
  const uploadMatchesUrl = !!(currentSessionId && upload.sessionId === currentSessionId)

  // Upload just started, no sessionId from server yet, no URL param
  const uploadPreSession = isUploadActive && !upload.sessionId && !currentSessionId

  // Should we show progress from upload context?
  const showUploadProgress = isUploadActive && (uploadMatchesUrl || uploadPreSession)

  // Is upload context in error state for the relevant session?
  const isUploadError = upload.phase === 'error' && (
    uploadMatchesUrl || (!upload.sessionId && !currentSessionId)
  )

  // Should we fetch server data? Only when URL has session and upload is NOT active for it
  const showServerView = !!currentSessionId && !showUploadProgress && !isUploadError

  // -- React Query: server data --
  const { data: session, isLoading: sessionLoading } = useSessionDetail(
    showServerView ? currentSessionId : null
  )

  // -- Redirect effects for processing/completed sessions --
  // FIX: Guard with pathname check and session.id match to prevent
  // stale React Query data from firing redirects when user navigates away.
  // This is the PRIMARY fix for the "snap back" bug where navigating to
  // /upload bounces back to /analysis?session=OLD_ID.
  useEffect(() => {
    // Only redirect when we are actually on the /upload page
    if (pathname !== '/upload') return
    // Check URL directly -- SessionContext may lag behind URL by one render cycle
    // If URL has no ?session= param, user clicked New Case -- do NOT redirect
    const urlSessionId = searchParams.get('session')
    if (!urlSessionId) return
    // Must have both server data and a matching session
    if (!session || !currentSessionId) return
    // Guard: React Query data must match the current URL session
    if (session.id !== currentSessionId) return

    if (session.status === 'processing') {
      goToStep('processing')
    } else if (session.status === 'completed') {
      router.push(`/analysis?session=${currentSessionId}`)
    }
  }, [session?.status, session?.id, currentSessionId, pathname, goToStep, router])

  // -- File selection state --
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [caseName, setCaseName] = useState<string>('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [duplicateSession, setDuplicateSession] = useState<{ id: string; label: string } | null>(null)

  // Settings panel state
  const [showSettings, setShowSettings] = useState(false)
  const [retainFile, setRetainFile] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  // -- Computed values --
  const fileSize = useMemo(() => {
    const size = (selectedFiles.length > 0 ? selectedFiles.reduce((s, f) => s + f.size, 0) : null) ?? upload.fileSize
    if (!size) return null
    const mb = size / (1024 * 1024)
    const gb = size / (1024 * 1024 * 1024)
    if (gb >= 1) return `${gb.toFixed(2)} GB`
    if (mb < 1) return `${(size / 1024).toFixed(1)} KB`
    return `${mb.toFixed(2)} MB`
  }, [selectedFiles, upload.fileSize])

  const canSubmit = useMemo(() => {
    return !!(selectedFiles.length > 0 && !upload.isActive && !validationError)
  }, [selectedFiles, upload.isActive, validationError])

  const compressionProgress = upload.compressionProgress
  const uploadProgress = upload.uploadProgress
  const validationProgress = upload.validationProgress
  const wasCompressed = upload.wasCompressed
  const currentProgress = upload.currentProgress

  const getButtonText = () => {
    switch (upload.phase) {
      case 'compressing': return 'Auto-compressing...'
      case 'uploading': return 'Uploading...'
      case 'validating': return 'Validating...'
      default: return 'Upload & Analyze'
    }
  }

  // -- File validation --
  const validateFile = useCallback((file: File): string | null => {
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
    if (!hasValidExtension) return `Invalid file type. Please upload ${ALLOWED_EXTENSIONS.join(' or ')} files.`
    if (file.size > MAX_FILE_SIZE) return `File too large. Maximum size is 20GB.`
    if (file.size === 0) return 'File is empty.'
    return null
  }, [])

  const checkDuplicate = useCallback((fileName: string) => {
    if (!casesData?.sessions) return null
    const match = casesData.sessions.find(
      (s) => s.original_filename === fileName && s.status === 'completed'
    )
    if (match) {
      return {
        id: match.id,
        label: match.case_label || match.original_filename || match.id.slice(0, 8),
      }
    }
    return null
  }, [casesData])

  const handleOpenExisting = useCallback(() => {
    if (!duplicateSession) return
    router.push('/analysis?session=' + duplicateSession.id)
  }, [duplicateSession, router])

  // -- Drag & Drop handlers --
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (dragCounterRef.current === 1) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDragging(false)
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
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
      f.name.endsWith('.vcf') || f.name.endsWith('.vcf.gz')
    )
    if (droppedFiles.length === 0) {
      setValidationError('No valid VCF files found. Please upload .vcf or .vcf.gz files.')
      return
    }
    for (const file of droppedFiles) {
      const error = validateFile(file)
      if (error) {
        setValidationError(error)
        toast.error('Invalid file', { description: `${file.name}: ${error}` })
        return
      }
    }
    setSelectedFiles(droppedFiles)
    const prefix = droppedFiles.length > 1
      ? _extractCommonPrefix(droppedFiles.map(f => f.name))
      : droppedFiles[0].name.replace(/\.vcf(\.gz)?$/, '')
    setCaseName(prefix)
    setValidationError(null)
    setDuplicateSession(droppedFiles.length === 1 ? checkDuplicate(droppedFiles[0].name) : null)
    const desc = droppedFiles.length > 1
      ? `${droppedFiles.length} files selected`
      : droppedFiles[0].name
    toast.success('File(s) selected', { description: desc })
  }, [validateFile, checkDuplicate])

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    const selected = Array.from(fileList).filter(f =>
      f.name.endsWith('.vcf') || f.name.endsWith('.vcf.gz')
    )
    if (selected.length === 0) {
      setValidationError('No valid VCF files found.')
      return
    }
    for (const file of selected) {
      const error = validateFile(file)
      if (error) {
        setValidationError(error)
        toast.error('Invalid file', { description: `${file.name}: ${error}` })
        return
      }
    }
    setSelectedFiles(selected)
    const prefix = selected.length > 1
      ? _extractCommonPrefix(selected.map(f => f.name))
      : selected[0].name.replace(/\.vcf(\.gz)?$/, '')
    setCaseName(prefix)
    setValidationError(null)
    setDuplicateSession(selected.length === 1 ? checkDuplicate(selected[0].name) : null)
    const desc = selected.length > 1 ? `${selected.length} files selected` : selected[0].name
    toast.success('File(s) selected', { description: desc })
  }, [validateFile, checkDuplicate])

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveFile = useCallback(() => {
    setSelectedFiles([])
    setCaseName('')
    setValidationError(null)
    setDuplicateSession(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // -- Submit handler --
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || selectedFiles.length === 0) return
    upload.startUpload(selectedFiles.length === 1 ? selectedFiles[0] : selectedFiles, caseName, retainFile)
  }, [canSubmit, selectedFiles, caseName, retainFile, upload])

  // Sync sessionId from context to parent (for URL update) - fire once per sessionId
  const syncedSessionRef = useRef<string | null>(null)
  useEffect(() => {
    if (upload.isActive && upload.sessionId && upload.sessionId !== syncedSessionRef.current) {
      syncedSessionRef.current = upload.sessionId
      onComplete?.(upload.sessionId)
    }
  }, [upload.sessionId, onComplete])

  // -- Reset handler --
  const handleReset = useCallback(() => {
    upload.resetUpload()
    setSelectedFiles([])
    setCaseName('')
    setValidationError(null)
    setDuplicateSession(null)
    setShowSettings(false)
    setRetainFile(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [upload])

  // -- Processing button --
  const handleProcessingClick = useCallback(() => {
    if (currentSessionId) {
      nextStep() // upload -> processing
    }
  }, [currentSessionId, nextStep])

  // -- Download QC report (server data) --
  const handleDownloadQC = useCallback(() => {
    if (!session) return
    const report = {
      file: session.original_filename || '-',
      timestamp: new Date().toISOString(),
      qc: {
        genomeBuild: session.genome_build,
        variants: session.total_variants,
        tiTvRatio: null,
        hetHomRatio: null,
        meanDepth: null,
        qcPassed: true,
      },
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qc-report.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [session])

  const currentPresetInfo = FILTERING_PRESETS.find(p => p.id === filteringPreset) || FILTERING_PRESETS[0]

  // ==========================================================================
  // Shared Card Header - consistent across all views
  // ==========================================================================
  const CardHeader = ({ animated }: { animated: boolean }) => (
    <div className="flex items-center justify-center gap-3 pb-2 mb-3 border-b border-border">
      <HelixLoader size="xs" animated={animated} />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Upload VCF File</h1>
        <p className="text-base text-muted-foreground mt-1">Upload a genetic variant file</p>
      </div>
    </div>
  )

  // =====================================================================
  // RENDER: Server-driven QC Results (session.status === 'uploaded')
  // =====================================================================
  if (showServerView && session?.status === 'uploaded') {
    const genomeBuild = session.genome_build || 'Unknown'
    const isGRCh37 = genomeBuild === 'GRCh37'
    const isSupported = genomeBuild === 'GRCh38' || isGRCh37

    return (
      <div className="flex flex-col min-h-[600px] p-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <Card className="gap-0 py-0">
            <CardContent className="pt-4 px-6 pb-6">
              {/* Shared Card Header - static loader */}
              <CardHeader animated={false} />

              <div className="pb-2 mb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">File</p>
                    <div className="flex items-center gap-2">
                      <FileCode className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <p className="text-base font-medium">{session.original_filename || '-'}</p>
                  {fileSize && (
                    <>
                      <span className="text-muted-foreground">-</span>
                      <p className="text-md text-muted-foreground">{fileSize}</p>
                    </>
                  )}
                  {wasCompressed && upload.sessionId === currentSessionId && (
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
                <Button variant="ghost" size="sm" onClick={handleDownloadQC} disabled={!session}>
                  <Download className="h-4 w-4 mr-2" />
                  <span className="text-base">Download Report</span>
                </Button>
              </div>

              {/* QC Metrics Grid - data from server */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-ml font-semibold mb-1">Variants</p>
                  {false ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <p className="text-base">{session.total_variants?.toLocaleString() || '-'}</p>
                  )}
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-ml font-semibold">Genome Build</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            <strong>GRCh38</strong> - Current human genome reference assembly (released December 2013). Also known as hg38.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-base">{genomeBuild}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-ml font-semibold mb-1">Mean Depth</p>
                  {false ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <p className="text-base">{'-'}</p>
                  )}
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-ml font-semibold mb-1">Status</p>
                  {isGRCh37 ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-amber-600" />
                      <p className="text-base text-amber-600">Valid (auto-convert)</p>
                    </div>
                  ) : isSupported ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-base text-green-600">Valid</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <p className="text-lg font-semibold text-destructive">Not Supported</p>
                    </div>
                  )}
                </div>
              </div>

              {/* GRCh37 Info */}
              {isGRCh37 && (
                <Alert className="mt-4 border-amber-300 bg-amber-50 text-amber-900">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-base">
                    GRCh37 (hg19) genome build detected. The file will be automatically converted
                    to GRCh38 (hg38) during processing using coordinate liftover. No action required.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Next Step CTA */}
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

                {/* Processing Settings (collapsible) */}
                {showSettings && (
                  <div className="border border-border rounded-lg p-4 bg-background">
                    <h4 className="text-base font-semibold mb-3">Quality Filtering Preset</h4>
                    <p className="text-md text-muted-foreground mb-3">
                      Controls how aggressively low-quality variants are removed before annotation.
                      ClinVar pathogenic/likely pathogenic variants are always preserved regardless of preset.
                    </p>
                    <div className="space-y-2">
                      {FILTERING_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => onFilteringPresetChange?.(preset.id)}
                          className={`
                            w-full text-left p-3 rounded-lg border transition-all
                            ${filteringPreset === preset.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30 hover:bg-accent/5'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`
                              h-3 w-3 rounded-full border-2
                              ${filteringPreset === preset.id
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                              }
                            `} />
                            <span className="text-base font-medium">{preset.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground ml-5">{preset.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="flex-shrink-0">
                          <Settings className="h-4 w-4 mr-2" />
                          <span className="text-base">Settings</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">Configure processing options</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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

  // =====================================================================
  // RENDER: Server-driven Pending (session.status === 'created')
  // =====================================================================
  if (showServerView && session?.status === 'created') {
    return (
      <div className="flex flex-col min-h-[600px] p-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <Card className="gap-0 py-0">
            <CardContent className="pt-4 px-6 pb-6">
              {/* Shared Card Header - animated loader */}
              <CardHeader animated={true} />

              <div className="flex flex-col items-center gap-6 text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-muted-foreground" />
                    <p className="text-lg font-medium">{session.original_filename || 'Processing...'}</p>
                  </div>
                  <p className="text-base text-muted-foreground">
                    Validation in progress. This session is being processed.
                  </p>
                </div>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // =====================================================================
  // RENDER: Server-driven redirect (processing/completed)
  // =====================================================================
  if (showServerView && session && (session.status === 'processing' || session.status === 'completed')) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // =====================================================================
  // RENDER: Server-driven failed session
  // =====================================================================
  if (showServerView && session?.status === 'failed') {
    return (
      <div className="flex flex-col min-h-[600px] p-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <Card className="gap-0 py-0 border-destructive">
            <CardContent className="pt-4 px-6 pb-6">
              {/* Shared Card Header - static loader */}
              <CardHeader animated={false} />

              <div className="text-center space-y-6 py-4">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-destructive/10">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Process Failed</h3>
                  <p className="text-md text-muted-foreground">
                    {session.error_message || 'An unexpected error occurred'}
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => router.push('/upload')}>
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

  // =====================================================================
  // RENDER: Server loading
  // =====================================================================
  if (showServerView && sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // =====================================================================
  // RENDER: Session not found
  // =====================================================================
  if (showServerView && !session && !sessionLoading) {
    return (
      <div className="flex flex-col min-h-[600px] p-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <Card className="gap-0 py-0 border-destructive">
            <CardContent className="pt-4 px-6 pb-6">
              {/* Shared Card Header - static loader */}
              <CardHeader animated={false} />

              <div className="text-center space-y-6 py-4">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-destructive/10">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Session Not Found</h3>
                  <p className="text-md text-muted-foreground">The requested session could not be loaded.</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/upload')}>
                  <span className="text-base">Start New Upload</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // =====================================================================
  // RENDER: Upload context error
  // =====================================================================
  if (isUploadError) {
    return (
      <div className="flex flex-col min-h-[600px] p-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <Card className="gap-0 py-0 border-destructive">
            <CardContent className="pt-4 px-6 pb-6">
              {/* Shared Card Header - static loader */}
              <CardHeader animated={false} />

              <div className="text-center space-y-6 py-4">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-destructive/10">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Process Failed</h3>
                  <p className="text-md text-muted-foreground">
                    {upload.errorMessage || 'An unexpected error occurred'}
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleSubmit} disabled={selectedFiles.length === 0}>
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

  // =====================================================================
  // RENDER: Active upload progress (navigated back, no file object)
  // =====================================================================
  if (showUploadProgress && selectedFiles.length === 0) {
    return (
      <div className="flex flex-col min-h-[600px] p-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <Card className="gap-0 py-0">
            <CardContent className="pt-4 px-6 pb-6">
              {/* Shared Card Header - animated loader */}
              <CardHeader animated={true} />

              <div className="flex flex-col items-center gap-6 text-center py-8">
                <div className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-medium">{upload.fileName || 'Processing...'}</p>
                </div>
                <p className="text-base text-muted-foreground">
                  {upload.phase === 'compressing' && 'Auto-compressing...'}
                  {upload.phase === 'uploading' && 'Uploading to server...'}
                  {upload.phase === 'validating' && 'Validating file format...'}
                </p>
                <div className="w-full max-w-sm space-y-2">
                  <Progress value={currentProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    {upload.phase === 'uploading' ? `${uploadProgress}%` : `${currentProgress}%`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // =====================================================================
  // RENDER: File Selection / Upload Form (default)
  // =====================================================================
  const isProcessing = showUploadProgress && selectedFiles.length > 0

  return (
    <div className="flex flex-col min-h-[600px] p-8">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card className="gap-0 py-0">
          <CardContent className="pt-4 px-6 pb-6">
            {/* Shared Card Header - animated only during processing */}
            <CardHeader animated={isProcessing} />

            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileSelect}
              className="sr-only"
              disabled={isProcessing}
              aria-label="File input"
              multiple
            />

              {isProcessing ? (
                /* -- Processing state: clean progress only -- */
                <div className="flex flex-col items-center gap-5 py-6">
                  <p className="text-base text-muted-foreground">
                    {upload.phase === 'compressing' && 'Auto-compressing...'}
                    {upload.phase === 'uploading' && 'Uploading to server...'}
                    {upload.phase === 'validating' && 'Validating file format...'}
                  </p>
                  <div className="w-full space-y-2">
                    <Progress value={currentProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">{currentProgress}%</p>
                  </div>
                  <Button size="lg" disabled>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    <span className="text-base">{getButtonText()}</span>
                  </Button>
                </div>
              ) : selectedFiles.length > 0 ? (
                /* -- File(s) selected, not yet processing -- */
                <div className="space-y-5">
                  {/* File info row */}
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">{selectedFiles.length > 1 ? 'Files' : 'File'}</p>
                    <div className="flex items-center gap-2">
                      <FileCode className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <p className="text-base font-medium">{selectedFiles.length > 1 ? `${selectedFiles.length} files` : selectedFiles[0].name}</p>
                      {fileSize && (
                        <>
                          <span className="text-muted-foreground">-</span>
                          <p className="text-md text-muted-foreground">{fileSize}</p>
                        </>
                      )}
                      <button
                        onClick={handleRemoveFile}
                        className="p-1 hover:bg-destructive/10 rounded-full transition-colors ml-1"
                        aria-label="Remove file"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>

                  {/* Case Name input */}
                  <div>
                    <label htmlFor="case-name" className="text-base font-semibold text-muted-foreground mb-1 block">
                      Case Name
                    </label>
                    <input
                      id="case-name"
                      type="text"
                      value={caseName}
                      onChange={(e) => setCaseName(e.target.value)}
                      placeholder="e.g. Patient 001"
                      className="w-full px-3 py-2 text-md border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-ring"
                      maxLength={200}
                    />
                  </div>

                  {/* Retain file checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={retainFile}
                      onChange={(e) => setRetainFile(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border accent-primary"
                    />
                    <span className="text-sm text-muted-foreground">Retain original file</span>
                  </label>

                  {/* Duplicate file warning */}
                  {duplicateSession && (
                    <Alert className="border-orange-300 bg-orange-50 text-orange-900">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-md">
                        <p className="mb-2">
                          This file was already uploaded in case: <strong>{duplicateSession.label}</strong>
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-sm border-orange-300 hover:bg-orange-100"
                            onClick={handleOpenExisting}
                          >
                            Open Existing
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-sm text-orange-700"
                            onClick={() => setDuplicateSession(null)}
                          >
                            Upload Anyway
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Action button */}
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      <span className="text-base">Upload & Analyze</span>
                    </Button>
                  </div>
                </div>
            ) : (
              /* -- Empty upload zone (drag & drop) -- */
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBrowseClick() }
                }}
                role="button"
                tabIndex={0}
                aria-label="File upload area"
                className={`
                  relative rounded-lg p-12 transition-all cursor-pointer
                  border-2 border-dashed
                  ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-accent/5'}
                `}
              >
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="p-6 rounded-full bg-primary/10">
                    <FileCode className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium mb-2">Drag and drop your VCF file(s) here</p>
                    <p className="text-base text-muted-foreground mb-1">or click to browse</p>
                    <p className="text-md text-muted-foreground">Supports .vcf and .vcf.gz files (max 20GB)</p>
                  </div>
                  <Button size="lg" onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}>
                    <Upload className="h-5 w-5 mr-2" />
                    <span className="text-base">Select File(s)</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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


function _extractCommonPrefix(filenames: string[]): string {
  if (filenames.length === 0) return ''
  if (filenames.length === 1) return filenames[0].replace(/\.vcf(\.gz)?$/, '')
  let prefix = ''
  const first = filenames[0]
  for (let i = 0; i < first.length; i++) {
    if (filenames.every(f => f[i] === first[i])) {
      prefix += first[i]
    } else break
  }
  return prefix.replace(/[_.\-]+$/, '') || filenames[0].replace(/\.vcf(\.gz)?$/, '')
}
