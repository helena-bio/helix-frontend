"use client"

/**
 * ReprocessFlow Component - Session Reprocess Pipeline Progress
 *
 * Same architecture as ProcessingFlow but with reprocess-specific stages.
 * Stages map 1:1 to backend ReprocessEngine progress_callback stages.
 *
 * Backend stages: loading -> gnomad -> clinvar -> dbnsfp -> gnomad_constraint
 *   -> hpo -> clingen -> spliceai -> classification -> export -> summaries
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useTaskStatus, useSession } from '@/hooks/queries'
import { useReprocessSession } from '@/hooks/mutations'
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
  Database,
  BarChart3,
  Download,
  Dna,
  RefreshCw,
  Activity,
  Heart,
  Shield,
  Scissors,
  HardDrive,
} from 'lucide-react'
import { toast } from 'sonner'

interface ReprocessFlowProps {
  sessionId: string
  onComplete?: () => void
  onError?: (error: Error) => void
}

interface ReprocessStage {
  id: string
  name: string
  icon: React.ReactNode
  description: string
}

const REPROCESS_STAGES: ReprocessStage[] = [
  {
    id: 'loading',
    name: 'Loading Data',
    icon: <HardDrive className="h-4 w-4" />,
    description: 'Loading variants into memory',
  },
  {
    id: 'gnomad',
    name: 'gnomAD',
    icon: <Activity className="h-4 w-4" />,
    description: 'Population frequency data',
  },
  {
    id: 'clinvar',
    name: 'ClinVar',
    icon: <Heart className="h-4 w-4" />,
    description: 'Clinical significance annotations',
  },
  {
    id: 'dbnsfp',
    name: 'dbNSFP',
    icon: <Database className="h-4 w-4" />,
    description: 'Functional predictions (BayesDel, SIFT, AlphaMissense)',
  },
  {
    id: 'gnomad_constraint',
    name: 'Gene Constraint',
    icon: <Shield className="h-4 w-4" />,
    description: 'gnomAD constraint metrics (pLI, LOEUF)',
  },
  {
    id: 'hpo',
    name: 'HPO',
    icon: <Dna className="h-4 w-4" />,
    description: 'Gene-phenotype associations',
  },
  {
    id: 'clingen',
    name: 'ClinGen',
    icon: <Shield className="h-4 w-4" />,
    description: 'Dosage sensitivity',
  },
  {
    id: 'spliceai',
    name: 'SpliceAI',
    icon: <Scissors className="h-4 w-4" />,
    description: 'Splice site predictions',
  },
  {
    id: 'classification',
    name: 'Classification',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'ACMG/AMP reclassification with updated evidence',
  },
  {
    id: 'export',
    name: 'Export',
    icon: <Download className="h-4 w-4" />,
    description: 'Saving updated results',
  },
  {
    id: 'summaries',
    name: 'Preparing Data',
    icon: <Dna className="h-4 w-4" />,
    description: 'Regenerating gene summaries',
  },
]

type ReprocessPhase = 'reprocessing' | 'error'

export function ReprocessFlow({ sessionId, onComplete, onError }: ReprocessFlowProps) {
  const [phase, setPhase] = useState<ReprocessPhase>('reprocessing')
  const [taskId, setTaskId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const startedRef = useRef(false)
  const finalizedRef = useRef(false)

  const { nextStep } = useJourney()
  const reprocessMutation = useReprocessSession()
  const { loadAllVariants } = useVariantsResults()

  const { data: taskStatus } = useTaskStatus(taskId, {
    enabled: !!taskId && phase === 'reprocessing',
  })

  // Start reprocess on mount
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const startReprocess = async () => {
      try {
        const result = await reprocessMutation.mutateAsync({ sessionId })
        setTaskId(result.task_id)
      } catch (error) {
        const err = error as Error
        setPhase('error')
        setErrorMessage(err.message)
        toast.error('Failed to start reprocessing', { description: err.message })
        onError?.(err)
      }
    }

    startReprocess()
  }, [sessionId, reprocessMutation, onError])

  // Handle completion
  useEffect(() => {
    if (phase !== 'reprocessing') return
    if (!taskStatus?.ready) return
    if (finalizedRef.current) return

    if (taskStatus.successful) {
      finalizedRef.current = true

      const resultData = taskStatus.result
      const variantsProcessed = resultData?.variants_processed

      toast.success('Reprocessing complete', {
        description: `${variantsProcessed?.toLocaleString() || 'All'} variants updated`,
      })

      const finalize = async () => {
        try {
          await loadAllVariants(sessionId)
        } catch (error) {
          console.warn('[ReprocessFlow] Pre-load failed, will load on demand')
        }

        flushSync(() => {
          nextStep() // processing -> profile
        })
        onComplete?.()
      }

      finalize()
    } else if (taskStatus.failed) {
      const error = taskStatus.result?.error || taskStatus.info?.error || 'Reprocessing failed'
      setPhase('error')
      setErrorMessage(error)
      toast.error('Reprocessing failed', { description: error })
      onError?.(new Error(error))
    }
  }, [taskStatus, phase, sessionId, loadAllVariants, nextStep, onComplete, onError])

  // Progress from backend
  const getProgress = useCallback((): number => {
    if (!taskStatus?.info) return 2
    const progress = taskStatus.info.progress as number | undefined
    return typeof progress === 'number' ? progress : 5
  }, [taskStatus])

  const getCompletedStages = useCallback((): string[] => {
    if (!taskStatus?.info?.completed_stages) return []
    return taskStatus.info.completed_stages as string[]
  }, [taskStatus])

  const getCurrentStage = useCallback((): string | null => {
    if (!taskStatus?.info?.stage) return null
    return taskStatus.info.stage as string
  }, [taskStatus])

  // Retry handler
  const handleRetry = useCallback(async () => {
    setPhase('reprocessing')
    setErrorMessage(null)
    setTaskId(null)
    startedRef.current = false
    finalizedRef.current = false

    try {
      const result = await reprocessMutation.mutateAsync({ sessionId })
      setTaskId(result.task_id)
    } catch (error) {
      const err = error as Error
      setPhase('error')
      setErrorMessage(err.message)
      toast.error('Failed to start reprocessing', { description: err.message })
      onError?.(err)
    }
  }, [sessionId, reprocessMutation, onError])

  // Error state
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
                <h3 className="text-lg font-semibold mb-2">Reprocessing Failed</h3>
                <p className="text-md text-muted-foreground">{errorMessage}</p>
              </div>
              <Button onClick={handleRetry} disabled={reprocessMutation.isPending}>
                {reprocessMutation.isPending ? (
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

  const progress = getProgress()
  const completedStages = getCompletedStages()
  const currentStage = getCurrentStage()

  return (
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-center gap-4">
          <HelixLoader size="xs" speed={3} />
          <div>
            <h1 className="text-3xl font-semibold">Updating Annotations</h1>
            <p className="text-base text-muted-foreground">
              Re-annotating and reclassifying variants with latest reference data
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-md text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>

              <div className="space-y-3">
                {REPROCESS_STAGES.map((stage) => {
                  const isComplete = completedStages.includes(stage.id)
                  const isCurrent = currentStage === stage.id

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
          <AlertDescription className="text-md">
            This typically takes 10-30 seconds. Phenotype matching and screening
            results will be refreshed with updated annotations.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
