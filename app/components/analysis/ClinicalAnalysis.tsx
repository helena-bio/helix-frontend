"use client"

/**
 * ClinicalAnalysis - Celery Pipeline Progress Monitor
 *
 * All clinical analysis stages run in Celery (session-orchestration worker).
 * This component polls task status and streams results when stages complete.
 *
 * Flow:
 * 1. POST /clinical-profile saves profile + enqueues Celery task
 * 2. This component polls GET /tasks/{taskId}/status every 2s
 * 3. Celery meta: {stage, progress, completed_stages, failed_stages}
 * 4. When stage completes -> stream NDJSON.gz results into context
 * 5. When pipeline completes -> navigate to analysis view
 *
 * No direct calls to screening/phenotype/literature services.
 * Session orchestration is the single source of truth.
 */

import { useCallback, useEffect, useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useJourney } from '@/contexts/JourneyContext'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import { usePhenotypeResults } from '@/contexts/PhenotypeResultsContext'
import { useLiteratureResults } from '@/contexts/LiteratureResultsContext'
import { useTaskStatus } from '@/hooks/queries/use-task-status'
import { invalidateSessionCaches } from '@/lib/cache/invalidate-session-caches'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { HelixLoader } from '@/components/ui/helix-loader'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Dna,
  Filter,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'

interface ClinicalAnalysisProps {
  sessionId: string
  profilingTaskId?: string | null
  onComplete?: () => void
  onError?: (error: Error) => void
}

interface AnalysisStage {
  id: string
  name: string
  icon: React.ReactNode
  description: string
}

const ALL_STAGES: AnalysisStage[] = [
  {
    id: 'phenotype_matching',
    name: 'Phenotype Matching',
    icon: <Dna className="h-4 w-4" />,
    description: 'Identifying variants matching patient phenotype',
  },
  {
    id: 'screening',
    name: 'Clinical Screening',
    icon: <Filter className="h-4 w-4" />,
    description: 'Age-aware variant prioritization',
  },
  {
    id: 'literature_search',
    name: 'Literature Search',
    icon: <BookOpen className="h-4 w-4" />,
    description: 'Searching publications for key genes',
  },
]

type StageStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed'

export function ClinicalAnalysis({
  sessionId,
  profilingTaskId,
  onComplete,
  onError,
}: ClinicalAnalysisProps) {
  const [stageStatuses, setStageStatuses] = useState<Record<string, StageStatus>>({
    phenotype_matching: 'pending',
    screening: 'pending',
    literature_search: 'pending',
  })
  const [currentStage, setCurrentStage] = useState<string | null>('initializing')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pipelineComplete, setPipelineComplete] = useState(false)

  // Track which result streams we have already triggered
  const streamedRef = useRef<Set<string>>(new Set())
  const navigationTriggeredRef = useRef(false)

  const queryClient = useQueryClient()
  const { nextStep } = useJourney()
  const {
    enableScreening,
    enablePhenotypeMatching,
  } = useClinicalProfileContext()

  const { loadAllScreeningResults } = useScreeningResults()
  const { loadAllPhenotypeResults } = usePhenotypeResults()
  const { loadAllLiteratureResults } = useLiteratureResults()

  // =========================================================================
  // TASK POLLING -- polls GET /tasks/{taskId}/status every 2 seconds
  // =========================================================================

  const { data: taskStatus } = useTaskStatus(profilingTaskId ?? null, {
    enabled: !!profilingTaskId && !pipelineComplete && !errorMessage,
  })

  // =========================================================================
  // PROCESS TASK STATUS UPDATES
  // =========================================================================

  useEffect(() => {
    if (!taskStatus) return

    const info = taskStatus.info || {}
    const completedStages: string[] = info.completed_stages || []
    const failedStages: string[] = info.failed_stages || []
    const stage = info.stage || ''
    const taskProgress = info.progress || 0

    // Update progress bar
    setProgress(taskProgress)

    // Update current stage indicator
    if (stage && stage !== 'completed' && stage !== 'failed') {
      setCurrentStage(stage)
    }

    // Update individual stage statuses
    setStageStatuses(prev => {
      const next = { ...prev }
      for (const s of completedStages) {
        if (s in next) next[s] = 'completed'
      }
      for (const s of failedStages) {
        if (s in next) next[s] = 'failed'
      }
      if (stage && stage in next && next[stage] === 'pending') {
        next[stage] = 'running'
      }
      return next
    })

    // Stream results as stages complete (non-blocking, fire-and-forget)
    if (completedStages.includes('phenotype_matching') && !streamedRef.current.has('phenotype_matching')) {
      streamedRef.current.add('phenotype_matching')
      loadAllPhenotypeResults(sessionId).catch(err =>
        console.warn('[ClinicalAnalysis] Phenotype streaming failed:', err)
      )
    }

    if (completedStages.includes('screening') && !streamedRef.current.has('screening')) {
      streamedRef.current.add('screening')
      loadAllScreeningResults(sessionId).catch(err =>
        console.warn('[ClinicalAnalysis] Screening streaming failed:', err)
      )
    }

    if (completedStages.includes('literature_search') && !streamedRef.current.has('literature_search')) {
      streamedRef.current.add('literature_search')
      loadAllLiteratureResults(sessionId).catch(err =>
        console.warn('[ClinicalAnalysis] Literature streaming failed:', err)
      )
    }

    // Handle pipeline completion
    if (taskStatus.ready && taskStatus.successful) {
      setPipelineComplete(true)
      setCurrentStage(null)
      setProgress(100)

      // Mark non-enabled stages as skipped
      setStageStatuses(prev => {
        const next = { ...prev }
        if (!enablePhenotypeMatching && next.phenotype_matching === 'pending') next.phenotype_matching = 'skipped'
        if (!enableScreening && next.screening === 'pending') next.screening = 'skipped'
        if (!enablePhenotypeMatching && next.literature_search === 'pending') next.literature_search = 'skipped'
        return next
      })
    }

    // Handle pipeline failure
    if (taskStatus.ready && taskStatus.failed) {
      const errMsg = info.error || 'Pipeline failed'
      setErrorMessage(errMsg)
      setCurrentStage(null)
      onError?.(new Error(errMsg))
    }

  }, [
    taskStatus, sessionId, enableScreening, enablePhenotypeMatching,
    loadAllScreeningResults, loadAllPhenotypeResults, loadAllLiteratureResults,
    onError,
  ])

  // =========================================================================
  // NAVIGATE AFTER PIPELINE COMPLETES + RESULTS STREAMED
  // =========================================================================

  useEffect(() => {
    if (!pipelineComplete) return
    if (navigationTriggeredRef.current) return
    navigationTriggeredRef.current = true

    // Small delay to let final streaming settle
    const timer = setTimeout(() => {
      invalidateSessionCaches(queryClient, sessionId)
      toast.success('Analysis pipeline complete')
      onComplete?.()
      nextStep()
    }, 500)

    return () => clearTimeout(timer)
  }, [pipelineComplete, sessionId, queryClient, onComplete, nextStep])

  // =========================================================================
  // FALLBACK: No task ID (recovery from navigation, or modules all disabled)
  // =========================================================================

  useEffect(() => {
    if (profilingTaskId) return
    // No task ID -- either all modules disabled, or recovery scenario.
    // Try streaming whatever results exist on disk.
    const streamExisting = async () => {
      try {
        if (enablePhenotypeMatching) {
          await loadAllPhenotypeResults(sessionId).catch(() => {})
        }
        if (enableScreening) {
          await loadAllScreeningResults(sessionId).catch(() => {})
        }
        if (enablePhenotypeMatching) {
          await loadAllLiteratureResults(sessionId).catch(() => {})
        }
      } finally {
        setPipelineComplete(true)
        setProgress(100)
        setCurrentStage(null)
      }
    }
    streamExisting()
  }, [
    profilingTaskId, sessionId, enableScreening, enablePhenotypeMatching,
    loadAllScreeningResults, loadAllPhenotypeResults, loadAllLiteratureResults,
  ])

  // =========================================================================
  // FILTER ACTIVE STAGES FOR UI
  // =========================================================================

  const activeStages = ALL_STAGES.filter(stage => {
    if (stage.id === 'phenotype_matching') return enablePhenotypeMatching
    if (stage.id === 'screening') return enableScreening
    if (stage.id === 'literature_search') return enablePhenotypeMatching
    return false
  })

  // =========================================================================
  // RENDER
  // =========================================================================

  const handleRetry = useCallback(() => {
    window.location.reload()
  }, [])

  if (errorMessage) {
    return (
      <div className="flex justify-center pt-8 p-8">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-4 px-6 pb-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Analysis Failed</h3>
                <p className="text-md text-muted-foreground">{errorMessage}</p>
              </div>
              <Button onClick={handleRetry}>
                <span className="text-base">Retry</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (pipelineComplete && !currentStage) {
    return (
      <div className="flex justify-center pt-8 p-8">
        <Card className="w-full max-w-md border-green-500">
          <CardContent className="pt-4 px-6 pb-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Pipeline Complete</h3>
                <p className="text-md text-muted-foreground">
                  All data loaded - launching analysis view
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <HelixLoader size="xs" speed={2} />
                <span className="text-md text-muted-foreground">Loading analysis view...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex justify-center pt-8 p-8">
      <div className="w-full max-w-2xl space-y-4">

        <Card>
          <CardContent className="pt-4 px-6 pb-6">
            <div className="space-y-6">
                {/* Header with animated loader */}
                <div className="flex items-center justify-center gap-3 pb-2 mb-3 border-b border-border">
                  <HelixLoader size="xs" animated={true} />
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Clinical Analysis</h1>
                    <p className="text-base text-muted-foreground mt-1">Running clinical analysis pipeline</p>
                  </div>
                </div>

              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>

              {activeStages.length > 0 ? (
                <div className="space-y-3">
                  {activeStages.map((stage) => {
                    const status = stageStatuses[stage.id]
                    const isComplete = status === 'completed'
                    const isSkipped = status === 'skipped'
                    const isCurrent = currentStage === stage.id
                    const isFailed = status === 'failed'

                    return (
                      <div
                        key={stage.id}
                        className={`
                          flex items-start gap-3 p-3 rounded-lg border transition-all
                          ${isCurrent ? 'bg-primary/5 border-primary/50' : 'bg-background'}
                          ${isSkipped ? 'opacity-50' : ''}
                        `}
                      >
                        <div className={`
                          flex-shrink-0 p-2 rounded-full
                          ${isComplete ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400' : 'bg-muted'}
                          ${isCurrent ? 'bg-primary/10 text-primary' : ''}
                          ${isFailed ? 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400' : ''}
                          ${isSkipped ? 'bg-muted/50 text-muted-foreground' : ''}
                        `}>
                          {isComplete && !isCurrent ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : isFailed ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            stage.icon
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium">
                            {stage.name}
                            {isSkipped && <span className="text-xs text-muted-foreground ml-2">(skipped)</span>}
                            {isFailed && <span className="text-xs text-orange-600 dark:text-orange-400 ml-2">(warning)</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">{stage.description}</p>
                        </div>
                        {isCurrent && (
                          <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-md text-muted-foreground">
                    No analysis modules selected - proceeding to variant view
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


      </div>

    </div>
  )
}
