"use client"

/**
 * ProcessingFlow Component - VCF Processing Pipeline Progress
 *
 * ARCHITECTURE:
 * - Backend Stages (1-7): Celery task stages from backend
 * - Frontend Stage: Loading variants into browser memory
 * - Clean separation, no hacks
 */

import { useCallback, useEffect, useState, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useStartProcessing } from '@/hooks/mutations'
import { useTaskStatus, useSession } from '@/hooks/queries'
import { useJourney } from '@/contexts/JourneyContext'
import { useVariantsResults } from '@/contexts/VariantsResultsContext'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { HelixLoader } from '@/components/ui/helix-loader'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileCode,
  Database,
  Filter,
  Sparkles,
  BarChart3,
  Download,
  Dna,
  CloudDownload
} from 'lucide-react'
import { toast } from 'sonner'

interface ProcessingFlowProps {
  sessionId: string
  onComplete?: () => void
  onError?: (error: Error) => void
}

interface PipelineStage {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  isFrontend?: boolean
}

// Backend stages (from Celery task)
const BACKEND_STAGES: PipelineStage[] = [
  {
    id: 'parsing',
    name: 'Parsing',
    icon: <FileCode className="h-4 w-4" />,
    description: 'Reading VCF file and extracting variants',
  },
  {
    id: 'filtering',
    name: 'Filtering',
    icon: <Filter className="h-4 w-4" />,
    description: 'Applying quality filters',
  },
  {
    id: 'vep_annotation',
    name: 'VEP Annotation',
    icon: <Sparkles className="h-4 w-4" />,
    description: 'Annotating variant effects',
  },
  {
    id: 'reference_annotation',
    name: 'Reference Annotation',
    icon: <Database className="h-4 w-4" />,
    description: 'Adding reference data',
  },
  {
    id: 'classification',
    name: 'Classification',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'ACMG/AMP classification',
  },
  {
    id: 'export',
    name: 'Export',
    icon: <Download className="h-4 w-4" />,
    description: 'Saving results to database',
  },
  {
    id: 'streaming',
    name: 'Preparing Data',
    icon: <Dna className="h-4 w-4" />,
    description: 'Aggregating variants by gene for streaming',
  },
]

// Frontend stage (happens in browser after backend completes)
const FRONTEND_STAGE: PipelineStage = {
  id: 'frontend_loading',
  name: 'Loading Into Memory',
  icon: <CloudDownload className="h-4 w-4" />,
  description: 'Loading variants into browser memory',
  isFrontend: true,
}

type ProcessingPhase = 'backend' | 'frontend' | 'error'

export function ProcessingFlow({ sessionId, onComplete, onError }: ProcessingFlowProps) {
  const [phase, setPhase] = useState<ProcessingPhase>('backend')
  const [taskId, setTaskId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const startedRef = useRef(false)
  const frontendStartedRef = useRef(false)

  const { nextStep } = useJourney()
  const startProcessingMutation = useStartProcessing()
  const { loadAllVariants } = useVariantsResults()

  const { data: session } = useSession(sessionId)
  const { data: taskStatus } = useTaskStatus(taskId, {
    enabled: !!taskId && phase === 'backend',
  })

  // Start backend processing on mount
  useEffect(() => {
    if (!session?.vcf_file_path || startedRef.current) return

    startedRef.current = true
    setHasStarted(true)

    const startProcessing = async () => {
      try {
        const result = await startProcessingMutation.mutateAsync({
          sessionId,
          vcfFilePath: session.vcf_file_path!,
        })
        setTaskId(result.task_id)
      } catch (error) {
        const err = error as Error
        setPhase('error')
        setErrorMessage(err.message)
        toast.error('Failed to start processing', { description: err.message })
        onError?.(err)
      }
    }

    startProcessing()
  }, [session?.vcf_file_path, sessionId, startProcessingMutation, onError])

  // Handle backend completion → Start frontend streaming
  useEffect(() => {
    if (phase !== 'backend') return
    if (!taskStatus?.ready) return
    if (frontendStartedRef.current) return

    if (taskStatus.successful) {
      frontendStartedRef.current = true

      // Show success toast BEFORE starting frontend phase
      toast.success('Backend processing complete', {
        description: `${taskStatus.result?.variants_parsed?.toLocaleString() || 'Unknown'} variants processed`,
      })

      // Start frontend streaming
      const startFrontendLoading = async () => {
        try {
          setPhase('frontend')
          await loadAllVariants(sessionId)

          // Frontend complete - advance to next step
          flushSync(() => {
            nextStep() // processing -> profile
          })

          onComplete?.()
        } catch (error) {
          console.error('[ProcessingFlow] Frontend loading failed:', error)
          toast.error('Failed to load variants', {
            description: 'Continuing anyway - data will load on demand'
          })
          // Don't block - advance anyway
          flushSync(() => {
            nextStep()
          })
          onComplete?.()
        }
      }

      startFrontendLoading()
    } else if (taskStatus.failed) {
      const error = taskStatus.info?.error || 'Processing failed'
      setPhase('error')
      setErrorMessage(error)
      toast.error('Processing failed', { description: error })
      onError?.(new Error(error))
    }
  }, [taskStatus, phase, sessionId, loadAllVariants, nextStep, onComplete, onError])

  // Get backend progress
  const getBackendProgress = useCallback((): number => {
    if (!taskStatus?.info) return hasStarted ? 5 : 0
    const backendProgress = taskStatus.info.progress as number | undefined
    return typeof backendProgress === 'number' ? backendProgress : 10
  }, [taskStatus, hasStarted])

  // Get backend completed stages
  const getBackendCompletedStages = useCallback((): string[] => {
    if (!taskStatus?.info?.completed_stages) return []
    return taskStatus.info.completed_stages as string[]
  }, [taskStatus])

  // Get backend current stage
  const getBackendCurrentStage = useCallback((): string | null => {
    if (!taskStatus?.info?.stage) return null
    return taskStatus.info.stage as string
  }, [taskStatus])

  // Retry handler
  const handleRetry = useCallback(async () => {
    if (!session?.vcf_file_path) return

    setPhase('backend')
    setErrorMessage(null)
    setTaskId(null)
    frontendStartedRef.current = false

    try {
      const result = await startProcessingMutation.mutateAsync({
        sessionId,
        vcfFilePath: session.vcf_file_path,
      })
      setTaskId(result.task_id)
    } catch (error) {
      const err = error as Error
      setPhase('error')
      setErrorMessage(err.message)
      toast.error('Failed to start processing', { description: err.message })
      onError?.(err)
    }
  }, [session?.vcf_file_path, sessionId, startProcessingMutation, onError])

  // Error State
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
                <h3 className="text-lg font-semibold mb-2">Processing Failed</h3>
                <p className="text-md text-muted-foreground">{errorMessage}</p>
              </div>
              <Button onClick={handleRetry} disabled={startProcessingMutation.isPending}>
                {startProcessingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="text-base">Retrying...</span>
                  </>
                ) : (
                  <span className="text-base">Retry</span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const backendProgress = getBackendProgress()
  const backendCompletedStages = getBackendCompletedStages()
  const backendCurrentStage = getBackendCurrentStage()

  // Backend Processing View
  if (phase === 'backend') {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-8">
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex items-center justify-center gap-4">
            <HelixLoader size="xs" speed={3} />
            <div>
              <h1 className="text-3xl font-bold">Analyzing Variants</h1>
              <p className="text-base text-muted-foreground">
                Running ACMG classification pipeline
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Progress value={backendProgress} className="h-2" />
                  <div className="flex justify-between text-base text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(backendProgress)}%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {BACKEND_STAGES.map((stage) => {
                    const isComplete = backendCompletedStages.includes(stage.id)
                    const isCurrent = backendCurrentStage === stage.id

                    return (
                      <div
                        key={stage.id}
                        className={`
                          flex items-start gap-3 p-3 rounded-lg border transition-all
                          ${isCurrent ? 'bg-primary/5 border-primary/50' : 'bg-background'}
                        `}
                      >
                        <div className={`
                          flex-shrink-0 p-2 rounded-full
                          ${isComplete ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400' : 'bg-muted'}
                          ${isCurrent ? 'bg-primary/10 text-primary' : ''}
                        `}>
                          {isComplete && !isCurrent ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            stage.icon
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium">{stage.name}</p>
                          <p className="text-md text-muted-foreground">{stage.description}</p>
                        </div>
                        {isCurrent && (
                          <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription className="text-base">
              This process typically takes 10-15 minutes for a whole genome.
              You can safely close this window - processing will continue in the background.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Frontend Loading View
  return (
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-center gap-4">
          <HelixLoader size="xs" speed={3} />
          <div>
            <h1 className="text-3xl font-bold">Loading Variants</h1>
            <p className="text-base text-muted-foreground">
              Preparing data for analysis
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Progress value={100} className="h-2" />
                <div className="flex justify-between text-base text-muted-foreground">
                  <span>Loading into memory</span>
                  <span>Please wait...</span>
                </div>
              </div>

              {/* Show all backend stages as complete */}
              <div className="space-y-3">
                {BACKEND_STAGES.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-background"
                  >
                    <div className="flex-shrink-0 p-2 rounded-full bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium">{stage.name}</p>
                      <p className="text-md text-muted-foreground">{stage.description}</p>
                    </div>
                  </div>
                ))}

                {/* Frontend stage - active */}
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-primary/5 border-primary/50">
                  <div className="flex-shrink-0 p-2 rounded-full bg-primary/10 text-primary">
                    {FRONTEND_STAGE.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium">{FRONTEND_STAGE.name}</p>
                    <p className="text-md text-muted-foreground">{FRONTEND_STAGE.description}</p>
                  </div>
                  <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
