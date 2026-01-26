"use client"

/**
 * ClinicalAnalysis - Clinical Analysis Pipeline Progress
 *
 * NEW WORKFLOW - Complete clinical pipeline:
 * 1. Phenotype Matching (if HPO terms provided) - OPTIONAL BUT FIRST
 * 2. Screening Analysis (enhanced with phenotype tiers) - REQUIRED
 * 3. Literature Search (for key genes) - AUTOMATIC
 * 4. Clinical Interpretation (AI-powered diagnosis) - AUTOMATIC WITH STREAMING
 */

import { useCallback, useEffect, useState, useRef } from 'react'
import { useJourney } from '@/contexts/JourneyContext'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import { usePhenotypeResults, type GeneAggregatedResult } from '@/contexts/PhenotypeResultsContext'
import { useClinicalInterpretation as useClinicalInterpretationContext } from '@/contexts/ClinicalInterpretationContext'
import { useRunScreening } from '@/hooks/mutations/use-screening'
import { useRunLiteratureSearch } from '@/hooks/mutations/use-literature-search'
import { useClinicalInterpretation } from '@/hooks/mutations/use-clinical-interpretation'
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
  Brain,
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
    id: 'phenotype',
    name: 'Phenotype Matching',
    icon: <Dna className="h-4 w-4" />,
    description: 'Identifying variants matching patient phenotype',
    required: false,
  },
  {
    id: 'screening',
    name: 'Clinical Screening',
    icon: <Filter className="h-4 w-4" />,
    description: 'Enhanced prioritization with phenotype context',
    required: true,
  },
  {
    id: 'literature',
    name: 'Literature Search',
    icon: <BookOpen className="h-4 w-4" />,
    description: 'Searching publications for key genes',
    required: false,
  },
  {
    id: 'clinical_interpretation',
    name: 'Clinical Interpretation',
    icon: <Brain className="h-4 w-4" />,
    description: 'AI-powered diagnostic analysis',
    required: true,
  },
]

type StageStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed'

export function ClinicalAnalysis({
  sessionId,
  onComplete,
  onError,
}: ClinicalAnalysisProps) {
  const [stageStatuses, setStageStatuses] = useState<Record<string, StageStatus>>({
    phenotype: 'pending',
    screening: 'pending',
    literature: 'pending',
    clinical_interpretation: 'pending',
  })
  const [currentStage, setCurrentStage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const startedRef = useRef(false)

  const { nextStep } = useJourney()
  const { getCompleteProfile, hpoTerms } = useClinicalProfileContext()
  const { setScreeningResponse } = useScreeningResults()
  const { runMatching: runPhenotypeMatching } = usePhenotypeResults()
  const { setInterpretation, interpretation } = useClinicalInterpretationContext()

  const screeningMutation = useRunScreening()
  const literatureSearchMutation = useRunLiteratureSearch()
  const clinicalInterpretationMutation = useClinicalInterpretation()

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
        console.log('CLINICAL ANALYSIS - COMPLETE PIPELINE')
        console.log('='.repeat(80))
        console.log(JSON.stringify(profile, null, 2))
        console.log('='.repeat(80))

        if (!profile.demographics) {
          throw new Error('Demographics data is required')
        }

        // Stage 1: Phenotype Matching (OPTIONAL - but runs FIRST if HPO terms exist)
        let phenotypeResults: GeneAggregatedResult[] = []
        
        if (hpoTerms.length > 0) {
          setCurrentStage('phenotype')
          updateStageStatus('phenotype', 'running')

          try {
            const hpoIds = hpoTerms.map(t => t.hpo_id)
            
            console.log('='.repeat(80))
            console.log('PHENOTYPE MATCHING - Running first to identify Tier 1/2 candidates')
            console.log(`Patient HPO terms: ${hpoIds.join(', ')}`)
            console.log('='.repeat(80))

            // Get results directly from runMatching - no state dependency
            phenotypeResults = await runPhenotypeMatching(hpoIds)
            
            console.log('='.repeat(80))
            console.log('PHENOTYPE MATCHING COMPLETE')
            console.log('  Total genes:', phenotypeResults.length)
            console.log('  Tier 1 genes:', phenotypeResults.filter(r => r.best_tier === 'TIER_1').map(r => r.gene_symbol))
            console.log('  Tier 2 genes:', phenotypeResults.filter(r => r.best_tier === 'TIER_2').map(r => r.gene_symbol))
            console.log('='.repeat(80))

            updateStageStatus('phenotype', 'completed')
            toast.success('Phenotype matching complete')
          } catch (error) {
            console.error('Phenotype matching failed:', error)
            updateStageStatus('phenotype', 'failed')
            toast.warning('Phenotype matching failed - continuing without phenotype boost')
          }
        } else {
          console.log('No HPO terms - skipping phenotype matching')
          updateStageStatus('phenotype', 'skipped')
        }

        // Stage 2: Screening Analysis (REQUIRED - enhanced with phenotype tiers)
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
          console.log('SCREENING ANALYSIS - Enhanced with phenotype tiers')
          console.log('='.repeat(80))

          const screeningResponse = await screeningMutation.mutateAsync(screeningPayload)
          setScreeningResponse(screeningResponse)

          updateStageStatus('screening', 'completed')
          toast.success('Clinical screening complete')
        } catch (error) {
          console.error('Screening failed:', error)
          updateStageStatus('screening', 'failed')
          throw new Error('Clinical screening failed')
        }

        // Stage 3: Literature Search (for key genes from phenotype results)
        setCurrentStage('literature')
        updateStageStatus('literature', 'running')

        try {
          console.log('='.repeat(80))
          console.log('LITERATURE SEARCH - Checking for top genes')
          console.log('  phenotypeResults length:', phenotypeResults.length)
          console.log('='.repeat(80))

          // Extract top genes from phenotype results (directly from Stage 1)
          const topGenes: string[] = []

          if (phenotypeResults.length > 0) {
            const tier1Genes = phenotypeResults
              .filter(r => r.best_tier === 'TIER_1')
              .map(r => r.gene_symbol)
            const tier2Genes = phenotypeResults
              .filter(r => r.best_tier === 'TIER_2')
              .map(r => r.gene_symbol)

            console.log('  Found Tier 1 genes:', tier1Genes)
            console.log('  Found Tier 2 genes:', tier2Genes)

            topGenes.push(...tier1Genes, ...tier2Genes.slice(0, 10))
          }

          console.log('  Final topGenes list:', topGenes)

          if (topGenes.length > 0) {
            console.log('='.repeat(80))
            console.log(`LITERATURE SEARCH - Searching for ${topGenes.length} top genes`)
            console.log(`Genes: ${topGenes.join(', ')}`)
            console.log('='.repeat(80))

            await literatureSearchMutation.mutateAsync({
              genes: topGenes,
              hpoTerms: hpoTerms,
              limit: 50,
            })

            updateStageStatus('literature', 'completed')
            toast.success('Literature search complete')
          } else {
            console.log('='.repeat(80))
            console.log('No top genes for literature search - skipping')
            console.log('='.repeat(80))
            updateStageStatus('literature', 'skipped')
          }
        } catch (error) {
          console.error('Literature search failed:', error)
          updateStageStatus('literature', 'failed')
          toast.warning('Literature search failed - continuing without literature context')
        }

        // Stage 4: Clinical Interpretation (AI-powered diagnostic analysis with streaming)
        setCurrentStage('clinical_interpretation')
        updateStageStatus('clinical_interpretation', 'running')
        setInterpretation('') // Clear previous interpretation

        try {
          console.log('='.repeat(80))
          console.log('CLINICAL INTERPRETATION - Starting AI analysis with streaming')
          console.log('='.repeat(80))

          await clinicalInterpretationMutation.mutateAsync({
            sessionId,
            onStreamToken: (token) => {
              // Append streaming token to interpretation in context
              setInterpretation((interpretation || '') + token)
            },
            onComplete: (fullText) => {
              console.log('Clinical interpretation streaming complete')
              console.log(`Generated ${fullText.length} characters`)
              // Final interpretation is already in context from streaming
              setInterpretation(fullText)
            },
            onError: (error) => {
              console.error('Clinical interpretation streaming error:', error)
              throw error
            },
          })

          updateStageStatus('clinical_interpretation', 'completed')
          toast.success('Clinical interpretation complete')
        } catch (error) {
          console.error('Clinical interpretation failed:', error)
          updateStageStatus('clinical_interpretation', 'failed')
          toast.warning('Clinical interpretation failed - results available without AI interpretation')
        }

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
    runPhenotypeMatching,
    screeningMutation,
    literatureSearchMutation,
    clinicalInterpretationMutation,
    setScreeningResponse,
    setInterpretation,
    interpretation,
    updateStageStatus,
    nextStep,
    onComplete,
    onError,
  ])

  const progress = calculateProgress()

  const getStageName = useCallback((): string => {
    if (!currentStage) return 'Initializing...'

    const stageNames: Record<string, string> = {
      phenotype: 'Running Phenotype Matching',
      screening: 'Running Clinical Screening',
      literature: 'Searching Literature',
      clinical_interpretation: 'Generating Clinical Interpretation',
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
              Comprehensive variant analysis pipeline
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

              {/* Clinical Interpretation Streaming Display */}
              {currentStage === 'clinical_interpretation' && (
                <Card className="bg-muted/30 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-primary">
                          AI Clinical Interpretation
                        </p>
                      </div>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed min-h-[100px]">
                        {interpretation || 'Analyzing clinical data...'}
                        {interpretation && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertDescription className="text-base">
            Complete clinical pipeline: phenotype matching → screening → literature → AI interpretation
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
