"use client"

/**
 * ProcessingStatus Component - Display Pipeline Progress
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
 * - Real-time polling of task status
 * - Visual progress indicator
 * - Stage-by-stage breakdown
 * - Error handling with retry
 * - Success state with metrics
 */

import { useEffect } from 'react'
import { useTaskStatus } from '@/hooks/queries'
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
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface ProcessingStatusProps {
  taskId: string
  sessionId: string
  onComplete?: () => void
  onError?: (error: Error) => void
}

interface PipelineStage {
  name: string
  icon: React.ReactNode
  description: string
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    name: 'Parsing',
    icon: <FileCode className="h-4 w-4" />,
    description: 'Reading VCF file and extracting variants',
  },
  {
    name: 'Pre-Annotation',
    icon: <Database className="h-4 w-4" />,
    description: 'Adding population frequency data',
  },
  {
    name: 'Filtering',
    icon: <Filter className="h-4 w-4" />,
    description: 'Applying quality and frequency filters',
  },
  {
    name: 'VEP Annotation',
    icon: <Sparkles className="h-4 w-4" />,
    description: 'Annotating variant effects',
  },
  {
    name: 'Classification',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'ACMG classification and scoring',
  },
  {
    name: 'Export',
    icon: <Download className="h-4 w-4" />,
    description: 'Saving results to database',
  },
]

export function ProcessingStatus({
  taskId,
  sessionId,
  onComplete,
  onError
}: ProcessingStatusProps) {
  const { data: taskStatus, error, refetch } = useTaskStatus(taskId)

  // Handle completion
  useEffect(() => {
    if (taskStatus?.ready) {
      if (taskStatus.successful) {
        toast.success('Processing complete', {
          description: 'Your variants have been analyzed',
        })
        onComplete?.()
      } else if (taskStatus.failed) {
        const error = new Error('Processing failed')
        toast.error('Processing failed', {
          description: 'An error occurred during analysis',
        })
        onError?.(error)
      }
    }
  }, [taskStatus, onComplete, onError])

  // Calculate progress
  const getProgress = (): number => {
    if (!taskStatus?.info) return 0

    const stage = taskStatus.info.stage as string
    const progress = taskStatus.info.progress as number | undefined

    if (typeof progress === 'number') {
      return progress
    }

    // Estimate based on stage
    const stageIndex = PIPELINE_STAGES.findIndex(s =>
      stage?.toLowerCase().includes(s.name.toLowerCase())
    )

    if (stageIndex >= 0) {
      return ((stageIndex + 1) / PIPELINE_STAGES.length) * 100
    }

    return 0
  }

  const getCurrentStage = (): string => {
    if (!taskStatus?.info?.stage) return 'Initializing'
    return taskStatus.info.stage as string
  }

  const progress = getProgress()
  const currentStage = getCurrentStage()

  // Error State
  if (error || taskStatus?.failed) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Processing Failed</h3>
                <p className="text-md text-muted-foreground">
                  {error?.message || 'An error occurred during processing'}
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={() => refetch()}>
                  <span className="text-base">Retry</span>
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <span className="text-base">Start Over</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success State
  if (taskStatus?.successful) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <Card className="w-full max-w-md border-green-500">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Processing Complete</h3>
                <p className="text-md text-muted-foreground">
                  Your variants have been successfully analyzed
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
                      <span className="text-muted-foreground">Processing Time</span>
                      <span className="font-medium">
                        {taskStatus.result.processing_time_seconds?.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={onComplete}>
                <span className="text-base">View Results</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Processing State
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Header with Helix Loader */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <HelixLoader size="md" speed={3} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Processing VCF File</h3>
              <p className="text-md text-muted-foreground">{currentStage}</p>
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
              {PIPELINE_STAGES.map((stage, index) => {
                const stageProgress = ((index + 1) / PIPELINE_STAGES.length) * 100
                const isComplete = progress >= stageProgress
                const isCurrent = currentStage.toLowerCase().includes(stage.name.toLowerCase())

                return (
                  <div
                    key={stage.name}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border transition-all
                      ${isCurrent ? 'bg-primary/5 border-primary/50' : 'bg-background'}
                      ${isComplete && !isCurrent ? 'opacity-50' : ''}
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

            {/* Info Alert */}
            <Alert>
              <AlertDescription className="text-base">
                This process typically takes 10-15 minutes for a full genome.
                You can safely close this window - processing will continue in the background.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
