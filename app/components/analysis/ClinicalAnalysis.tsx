"use client"

/**
 * ClinicalAnalysis - Clinical Analysis Pipeline Progress
 *
 * Receives clinical data from ClinicalProfileEntry and runs analyses:
 * 1. Screening Analysis (age-aware prioritization) - REQUIRED
 * 2. Phenotype Matching (if HPO terms provided) - OPTIONAL
 * 3. Literature Analysis (automatic background) - AUTOMATIC
 */

import { useCallback, useEffect, useState, useRef } from 'react'
import { useJourney } from '@/contexts/JourneyContext'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { useRunPhenotypeMatching } from '@/hooks/mutations/use-phenotype-matching'
import { useRunScreening } from '@/hooks/mutations/use-screening'
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
  onComplete?: () => void
  onError?: (error: Error) => void
}

interface AnalysisStage {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  required: boolean
}

const ANALYSIS_STAGES: AnalysisStage[] = [
  {
    id: 'screening',
    name: 'Screening Analysis',
    icon: <Filter className="h-4 w-4" />,
    description: 'Age-aware variant prioritization',
    required: true,
  },
  {
    id: 'phenotype',
    name: 'Phenotype Matching',
    icon: <Dna className="h-4 w-4" />,
    description: 'Matching variants to patient phenotype',
    required: false,
  },
  {
    id: 'literature',
    name: 'Literature Analysis',
    icon: <BookOpen className="h-4 w-4" />,
    description: 'Automated literature review',
    required: false,
  },
]

type StageStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed'

export function ClinicalAnalysis({
  sessionId,
  onComplete,
  onError,
}: ClinicalAnalysisProps) {
  const [stageStatuses, setStageStatuses] = useState<Record<string, StageStatus>>({
    screening: 'pending',
    phenotype: 'pending',
    literature: 'pending',
  })
  const [currentStage, setCurrentStage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const startedRef = useRef(false)

  const { nextStep } = useJourney()
  const { getCompleteProfile, hpoTerms } = useClinicalProfileContext()

  const phenotypeMatchingMutation = useRunPhenotypeMatching()
  const screeningMutation = useRunScreening()

  const calculateProgress = useCallback((): number => {
    const statuses = Object.values(stageStatuses)
    const completed = statuses.filter(s => s === 'completed' || s === 'skipped').length
    const total = statuses.length
    return Math.round((completed / total) * 100)
  }, [stageStatuses])

  const updateStageStatus = useCallback((stageId: string, status: StageStatus) => {
    setStageStatuses(prev => ({ ...prev, [stageId]: status }))
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const runAnalyses = async () => {
      try {
        const profile = getCompleteProfile()

        console.log('='.repeat(80))
        console.log('CLINICAL ANALYSIS - COMPLETE PROFILE FROM CONTEXT')
        console.log('='.repeat(80))
        console.log(JSON.stringify(profile, null, 2))
        console.log('='.repeat(80))

        if (!profile.demographics) {
          throw new Error('Demographics data is required')
        }

        // Stage 1: Screening Analysis (REQUIRED)
        setCurrentStage('screening')
        updateStageStatus('screening', 'running')

        try {
          const screeningPayload = {
            session_id: sessionId,
            age_years: profile.demographics.age_years,
            age_days: profile.demographics.age_days,
            sex: profile.demographics.sex,
            ethnicity: profile.ethnicity?.primary,
            indication: profile.clinical_context?.indication,
            has_family_history: profile.clinical_context?.family_history?.has_affected_relatives || false,
            consanguinity: profile.clinical_context?.family_history?.consanguinity || false,
            screening_mode: 'proactive_adult',
            patient_hpo_terms: profile.phenotype?.hpo_terms?.map(t => t.hpo_id) || [],
            sample_type: profile.sample_info?.sample_type,
            is_pregnant: profile.reproductive?.is_pregnant || false,
            has_parental_samples: profile.sample_info?.has_parental_samples || false,
            has_affected_sibling: profile.sample_info?.has_affected_sibling || false,
          }

          console.log('='.repeat(80))
          console.log('SCREENING API REQUEST PAYLOAD')
          console.log('='.repeat(80))
          console.log(JSON.stringify(screeningPayload, null, 2))
          console.log('='.repeat(80))

          await screeningMutation.mutateAsync(screeningPayload)
          updateStageStatus('screening', 'completed')
          toast.success('Screening analysis complete')
        } catch (error) {
          console.error('Screening failed:', error)
          updateStageStatus('screening', 'failed')
          throw new Error('Screening analysis failed')
        }

        // Stage 2: Phenotype Matching (OPTIONAL - only if HPO terms)
        if (hpoTerms.length > 0) {
          setCurrentStage('phenotype')
          updateStageStatus('phenotype', 'running')

          try {
            await phenotypeMatchingMutation.mutateAsync({
              sessionId,
              patientHpoIds: hpoTerms.map(t => t.hpo_id),
            })
            updateStageStatus('phenotype', 'completed')
            toast.success('Phenotype matching complete')
          } catch (error) {
            console.error('Phenotype matching failed:', error)
            updateStageStatus('phenotype', 'failed')
            toast.warning('Phenotype matching failed, continuing...')
          }
        } else {
          updateStageStatus('phenotype', 'skipped')
        }

        // Stage 3: Literature Analysis (automatic background task)
        setCurrentStage('literature')
        updateStageStatus('literature', 'running')
        await new Promise(resolve => setTimeout(resolve, 1000))
        updateStageStatus('literature', 'completed')
        toast.success('Literature analysis started')

        setCurrentStage(null)
        toast.success('Clinical analysis pipeline complete')
        onComplete?.()
        nextStep()

      } catch (error) {
        const err = error as Error
        setErrorMessage(err.message)
        toast.error('Analysis pipeline failed', { description: err.message })
        onError?.(err)
      }
    }

    runAnalyses()
  }, [
    sessionId,
    getCompleteProfile,
    hpoTerms,
    phenotypeMatchingMutation,
    screeningMutation,
    updateStageStatus,
    nextStep,
    onComplete,
    onError,
  ])

  const progress = calculateProgress()

  const getStageName = useCallback((): string => {
    if (!currentStage) return 'Initializing...'

    const stageNames: Record<string, string> = {
      screening: 'Running Screening Analysis',
      phenotype: 'Running Phenotype Matching',
      literature: 'Starting Literature Analysis',
    }

    return stageNames[currentStage] || 'Processing...'
  }, [currentStage])

  const handleRetry = useCallback(() => {
    window.location.reload()
  }, [])

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

  if (progress === 100 && !currentStage) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-8">
        <Card className="w-full max-w-md border-green-500">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Analysis Complete</h3>
                <p className="text-md text-muted-foreground">
                  Clinical analysis pipeline has finished successfully
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
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-center gap-4">
          <HelixLoader size="xs" speed={3} />
          <div>
            <h1 className="text-3xl font-bold">Clinical Analysis</h1>
            <p className="text-base text-muted-foreground">
              Running screening, phenotype matching, and literature review
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-lg font-medium capitalize">{getStageName()}</p>
              </div>

              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>

              <div className="space-y-3">
                {ANALYSIS_STAGES.map((stage) => {
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
                          {isFailed && <span className="text-xs text-orange-600 dark:text-orange-400 ml-2">(failed)</span>}
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
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertDescription className="text-base">
            Clinical analysis enhances variant prioritization with patient-specific data.
            This typically takes 30-60 seconds.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
