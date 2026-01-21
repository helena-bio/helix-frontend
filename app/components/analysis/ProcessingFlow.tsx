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
 * - Success state advances to analysis
 */

import { useCallback, useEffect, useState, useRef } from 'react'
import { useStartProcessing } from '@/hooks/mutations'
import { useTaskStatus, useSession } from '@/hooks/queries'
import { useJourney } from '@/contexts/JourneyContext'
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
    name: 'Export',
    icon: <Download className="h-4 w-4" />,
    description: 'Saving results to database',
  },
]

export function ProcessingFlow({ sessionId, onComplete, onError }: ProcessingFlowProps) {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const startedRef = useRef(false)

  const { nextStep } = useJourney()
  const startProcessingMutation = useStartProcessing()

  // Get session for vcf_file_path
  const { data: session } = useSession(sessionId)

  // Poll task status
  const { data: taskStatus, refetch: refetchStatus } = useTaskStatus(taskId, {
    enabled: !!taskId,
  })

  // Start processing on mount (only once)
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
        setErrorMessage(err.message)
        toast.error('Failed to start processing', { description: err.message })
        onError?.(err)
      }
    }

    startProcessing()
  }, [session?.vcf_file_path, sessionId, startProcessingMutation, onError])

  // Handle task completion
  useEffect(() => {
    if (!taskStatus?.ready) return

    if (taskStatus.successful) {
      toast.success('Processing complete', {
        description: `${taskStatus.result?.variants_parsed?.toLocaleString() || 'Unknown'} variants analyzed`,
      })
      onComplete?.()
      nextStep() // processing -> analysis
    } else if (taskStatus.failed) {
      const error = taskStatus.info?.error || 'Processing failed'
      setErrorMessage(error)
      toast.error('Processing failed', { description: error })
      onError?.(new Error(error))
    }
  }, [taskStatus, nextStep, onComplete, onError])

  // Get progress from backend
  const getProgress = useCallback((): number => {
    if (!taskStatus?.info) return hasStarted ? 5 : 0

    // Use progress from backend if available
    const progress = taskStatus.info.progress as number | undefined
    if (typeof progress === 'number') {
      return progress
    }

    return 10
  }, [taskStatus, hasStarted])

  // Get completed stages from backend
  const getCompletedStages = useCallback((): string[] => {
    if (!taskStatus?.info?.completed_stages) return []
    return taskStatus.info.completed_stages as string[]
  }, [taskStatus])

  // Get current stage name
  const getCurrentStage = useCallback((): string => {
    if (!taskStatus?.info?.stage) {
      if (hasStarted) return 'Initializing pipeline...'
      return 'Starting...'
    }

    const stage = taskStatus.info.stage as string

    // Format stage name for display
    const stageNames: Record<string, string> = {
      'initializing': 'Initializing pipeline',
      'parsing': 'Parsing VCF file',
      'filtering': 'Filtering variants',
      'vep_annotation': 'Running VEP annotation',
      'reference_annotation': 'Adding reference data',
      'classification': 'Classifying variants',
      'export': 'Exporting results',
      'completed': 'Processing complete'
    }

    return stageNames[stage] || stage
  }, [taskStatus, hasStarted])

  // Check if a stage is complete based on completed_stages from backend
  const isStageComplete = useCallback((stageId: string): boolean => {
    const completedStages = getCompletedStages()
    return completedStages.includes(stageId)
  }, [getCompletedStages])

  // Check if a stage is current
  const isStageActive = useCallback((stageId: string): boolean => {
    const currentStage = taskStatus?.info?.stage as string | undefined
    if (!currentStage) return false
    return currentStage === stageId
  }, [taskStatus])

  // Retry handler
  const handleRetry = useCallback(async () => {
    if (!session?.vcf_file_path) return

    setErrorMessage(null)
    setTaskId(null)

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
  const isProcessing = !errorMessage && !taskStatus?.successful

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

  // Success State (brief, before auto-advance)
  if (taskStatus?.successful) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-8">
        <Card className="w-full max-w-md border-green-500">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Processing Complete</h3>
                <p className="text-md text-muted-foreground">
                  Your variants have been analyzed and classified
                </p>
              </div>

              {taskStatus.result && (
                <div className="p-4 bg-muted rounded-lg text-left">
                  <p className="text-base font-medium mb-2">Summary</p>
                  <div className="space-y-1 text-base">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variants Processed</span>
                      <span className="font-medium">
                        {taskStatus.result.variants_parsed?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variants Classified</span>
                      <span className="font-medium">
                        {taskStatus.result.variants_stored?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processing Time</span>
                      <span className="font-medium">
                        {taskStatus.result.processing_time_seconds?.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <HelixLoader size="xs" speed={2} />
                <span className="text-md text-muted-foreground">Loading results...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Processing State
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
