"use client"

/**
 * ProcessingFlow Component - VCF Processing Pipeline Progress
 *
 * Typography Scale:
 * - text-3xl: Page titles
 * - text-lg: Section headers, card titles
 * - text-base: Primary content, instructions
 * - text-md: Secondary descriptions
 * - text-sm: Helper text, file info
 * - text-xs: Technical metadata
 *
 * Features:
 * - Starts processing pipeline automatically on mount
 * - Real-time polling of task status
 * - Visual progress indicator with pipeline stages
 * - Error handling with retry
 * - Success: waits for streaming to complete before advancing
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
  Dna
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
}

const PIPELINE_STAGES: PipelineStage[] = [
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
    name: 'Export & Caching',
    icon: <Download className="h-4 w-4" />,
    description: 'Saving results and streaming data',
  },
]

export function ProcessingFlow({ sessionId, onComplete, onError }: ProcessingFlowProps) {
  console.log('[ProcessingFlow] RENDER - sessionId:', sessionId)
  
  const [taskId, setTaskId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const startedRef = useRef(false)
  const streamingStartedRef = useRef(false)

  const { nextStep, currentStep } = useJourney()
  const startProcessingMutation = useStartProcessing()
  const { loadAllVariants } = useVariantsResults()

  // Get session for vcf_file_path
  const { data: session } = useSession(sessionId)

  // Poll task status
  const { data: taskStatus, refetch: refetchStatus } = useTaskStatus(taskId, {
    enabled: !!taskId,
  })

  console.log('[ProcessingFlow] State:', {
    taskId,
    hasStarted,
    isStreaming,
    currentStep,
    startedRef: startedRef.current,
    streamingStartedRef: streamingStartedRef.current,
    taskReady: taskStatus?.ready,
    taskSuccessful: taskStatus?.successful,
    taskStatusExists: !!taskStatus,
    taskStatusInfo: taskStatus?.info,
  })

  // Start processing on mount (only once)
  useEffect(() => {
    console.log('[ProcessingFlow] Start processing effect - vcf_file_path:', session?.vcf_file_path, 'startedRef:', startedRef.current)
    
    if (!session?.vcf_file_path || startedRef.current) return

    startedRef.current = true
    setHasStarted(true)

    const startProcessing = async () => {
      try {
        console.log('[ProcessingFlow] Starting processing mutation...')
        const result = await startProcessingMutation.mutateAsync({
          sessionId,
          vcfFilePath: session.vcf_file_path!,
        })
        console.log('[ProcessingFlow] Processing started, taskId:', result.task_id)
        setTaskId(result.task_id)
      } catch (error) {
        const err = error as Error
        console.error('[ProcessingFlow] Start processing error:', err)
        setErrorMessage(err.message)
        toast.error('Failed to start processing', { description: err.message })
        onError?.(err)
      }
    }

    startProcessing()
  }, [session?.vcf_file_path, sessionId, startProcessingMutation, onError])

  // Handle task completion → Wait for streaming → Advance
  useEffect(() => {
    console.log('[ProcessingFlow] Task completion effect - ready:', taskStatus?.ready, 'streamingStartedRef:', streamingStartedRef.current, 'currentStep:', currentStep)
    
    if (!taskStatus?.ready) return
    if (streamingStartedRef.current) {
      console.log('[ProcessingFlow] Already started streaming, skipping')
      return
    }

    if (taskStatus.successful) {
      console.log('[ProcessingFlow] Task successful, starting streaming...')
      streamingStartedRef.current = true

      const streamAndAdvance = async () => {
        try {
          console.log('[ProcessingFlow] 1. Setting isStreaming = true')
          setIsStreaming(true)
          
          console.log('[ProcessingFlow] 2. Starting loadAllVariants...')
          await loadAllVariants(sessionId)
          
          console.log('[ProcessingFlow] 3. loadAllVariants complete')

          toast.success('Processing complete', {
            description: `${taskStatus.result?.variants_parsed?.toLocaleString() || 'Unknown'} variants loaded`,
          })

          console.log('[ProcessingFlow] 4. Calling nextStep() with flushSync')
          flushSync(() => {
            nextStep() // processing -> profile (FORCE SYNC)
          })
          
          console.log('[ProcessingFlow] 5. Calling onComplete()')
          onComplete?.()
          
          console.log('[ProcessingFlow] 6. streamAndAdvance complete!')
        } catch (error) {
          console.error('[ProcessingFlow] Streaming failed:', error)
          setIsStreaming(false)
          toast.error('Failed to load variants', {
            description: 'Continuing anyway - data will load on demand'
          })
          // Don't block - advance anyway, views will load data on demand
          flushSync(() => {
            nextStep() // processing -> profile (FORCE SYNC)
          })
          onComplete?.()
        }
      }

      streamAndAdvance()
    } else if (taskStatus.failed) {
      const error = taskStatus.info?.error || 'Processing failed'
      console.error('[ProcessingFlow] Task failed:', error)
      setErrorMessage(error)
      toast.error('Processing failed', { description: error })
      onError?.(new Error(error))
    }
  }, [taskStatus, sessionId, loadAllVariants, nextStep, onComplete, onError, currentStep])

  // Get progress from backend
  const getProgress = useCallback((): number => {
    const progress = isStreaming ? 95 : (taskStatus?.info?.progress as number | undefined) || (hasStarted ? 5 : 0)
    console.log('[ProcessingFlow] getProgress - isStreaming:', isStreaming, 'progress:', progress)
    
    // If streaming, show 95% (indicates still working, not stuck at 100%)
    if (isStreaming) {
      return 95
    }

    if (!taskStatus?.info) return hasStarted ? 5 : 0

    // Use progress from backend if available
    const backendProgress = taskStatus.info.progress as number | undefined
    if (typeof backendProgress === 'number') {
      return backendProgress
    }

    return 10
  }, [taskStatus, hasStarted, isStreaming])

  // Get completed stages from backend
  const getCompletedStages = useCallback((): string[] => {
    if (!taskStatus?.info?.completed_stages) return []
    return taskStatus.info.completed_stages as string[]
  }, [taskStatus])

  // Get current stage name
  const getCurrentStage = useCallback((): string => {
    console.log('[ProcessingFlow] getCurrentStage - isStreaming:', isStreaming, 'taskStatus exists:', !!taskStatus, 'taskStatus.info:', taskStatus?.info, 'hasStarted:', hasStarted)
    
    // IMPORTANT: Check isStreaming FIRST before checking taskStatus
    if (isStreaming) {
      console.log('[ProcessingFlow] ✓ STREAMING - returning "Exporting results"')
      return 'Exporting results'
    }
    
    if (!taskStatus?.info?.stage) {
      console.log('[ProcessingFlow] ⚠️ NO STAGE - hasStarted:', hasStarted, 'returning:', hasStarted ? 'Initializing pipeline...' : 'Starting...')
      if (hasStarted) return 'Initializing pipeline...'
      return 'Starting...'
    }

    const stage = taskStatus.info.stage as string
    console.log('[ProcessingFlow] ✓ Stage from backend:', stage)

    // Format stage name for display
    const stageNames: Record<string, string> = {
      'initializing': 'Initializing pipeline',
      'parsing': 'Parsing VCF file',
      'filtering': 'Filtering variants',
      'vep_annotation': 'Running VEP annotation',
      'reference_annotation': 'Adding reference data',
      'classification': 'Classifying variants',
      'export': 'Exporting results',
      'caching': 'Caching results',
      'completed': 'Processing complete'
    }

    return stageNames[stage] || stage
  }, [taskStatus, hasStarted, isStreaming])

  // Check if a stage is complete based on completed_stages from backend
  const isStageComplete = useCallback((stageId: string): boolean => {
    const completedStages = getCompletedStages()
    return completedStages.includes(stageId)
  }, [getCompletedStages])

  // Check if a stage is current
  const isStageActive = useCallback((stageId: string): boolean => {
    // If streaming, export stage is active
    if (isStreaming && stageId === 'export') {
      return true
    }

    const currentStage = taskStatus?.info?.stage as string | undefined
    if (!currentStage) return false
    return currentStage === stageId
  }, [taskStatus, isStreaming])

  // Retry handler
  const handleRetry = useCallback(async () => {
    if (!session?.vcf_file_path) return

    setErrorMessage(null)
    setTaskId(null)
    setIsStreaming(false)
    streamingStartedRef.current = false

    try {
      const result = await startProcessingMutation.mutateAsync({
        sessionId,
        vcfFilePath: session.vcf_file_path,
      })
      setTaskId(result.task_id)
    } catch (error) {
      const err = error as Error
      setErrorMessage(err.message)
      toast.error('Failed to start processing', { description: err.message })
      onError?.(err)
    }
  }, [session?.vcf_file_path, sessionId, startProcessingMutation, onError])

  const progress = getProgress()
  const currentStage = getCurrentStage()

  console.log('[ProcessingFlow] Render values - progress:', progress, 'currentStage:', currentStage)

  // Error State
  if (errorMessage) {
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
                <p className="text-md text-muted-foreground">
                  {errorMessage}
                </p>
              </div>

              <div className="flex gap-2 justify-center">
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
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Processing State (including streaming on export step)
  return (
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header - Loader + Title side by side, centered */}
        <div className="flex items-center justify-center gap-4">
          <HelixLoader size="xs" speed={3} />
          <div>
            <h1 className="text-3xl font-bold">Analyzing Variants</h1>
            <p className="text-base text-muted-foreground">
              Running ACMG classification pipeline
            </p>
          </div>
        </div>

        {/* Main Progress Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Current Stage */}
              <div className="text-center">
                <p className="text-lg font-medium capitalize">{currentStage}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>

              {/* Pipeline Stages */}
              <div className="space-y-3">
                {PIPELINE_STAGES.map((stage) => {
                  const isComplete = isStageComplete(stage.id)
                  const isCurrent = isStageActive(stage.id)

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
                        <p className="text-sm text-muted-foreground">
                          {stage.description}
                        </p>
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

        {/* Info Alert */}
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
