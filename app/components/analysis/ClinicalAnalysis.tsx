"use client"

/**
 * ClinicalAnalysis - Clinical Analysis Pipeline Progress
 *
 * Opt-in pipeline based on user selection:
 * 1. Phenotype Matching (if enabled + HPO terms) - runs FIRST
 * 2. Screening Analysis (if enabled) - age-aware prioritization
 * 3. Literature Search (if phenotype enabled) - for top genes
 * 4. Navigate to split view → Clinical Interpretation starts in ChatPanel
 *
 * NOTE: Variants streaming already done in ProcessingFlow!
 */

import { useCallback, useEffect, useState, useRef } from 'react'
import { useJourney } from '@/contexts/JourneyContext'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import { usePhenotypeResults } from '@/contexts/PhenotypeResultsContext'
import { useLiteratureResults } from '@/contexts/LiteratureResultsContext'
import { useRunScreening } from '@/hooks/mutations/use-screening'
import { useRunLiteratureSearch } from '@/hooks/mutations/use-literature-search'
import { isTier1, isTier2 } from '@/types/tiers.types'
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

const ALL_STAGES: AnalysisStage[] = [
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
    description: 'Age-aware variant prioritization',
    required: false,
  },
  {
    id: 'literature',
    name: 'Literature Search',
    icon: <BookOpen className="h-4 w-4" />,
    description: 'Searching publications for key genes',
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
    phenotype: 'pending',
    screening: 'pending',
    literature: 'pending',
  })
  const [currentStage, setCurrentStage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const startedRef = useRef(false)

  const { nextStep } = useJourney()
  const {
    enableScreening,
    enablePhenotypeMatching,
    getCompleteProfile,
    hpoTerms
  } = useClinicalProfileContext()
  const { loadAllScreeningResults, loadProgress: screeningProgress } = useScreeningResults()
  const { runMatching: runPhenotypeMatching, loadAllPhenotypeResults } = usePhenotypeResults()
  const { loadAllLiteratureResults } = useLiteratureResults()
  const screeningMutation = useRunScreening()
  const literatureSearchMutation = useRunLiteratureSearch()

  // Filter stages based on enabled modules
  const activeStages = ALL_STAGES.filter(stage => {
    if (stage.id === 'phenotype') return enablePhenotypeMatching
    if (stage.id === 'screening') return enableScreening
    if (stage.id === 'literature') return enablePhenotypeMatching // Literature depends on phenotype
    return false
  })

  const calculateProgress = useCallback((): number => {
    if (activeStages.length === 0) return 100 // No modules enabled, instant complete

    const activeStatuses = activeStages.map(s => stageStatuses[s.id])
    const completed = activeStatuses.filter(s => s === 'completed' || s === 'skipped').length

    // If screening is running, factor in its streaming progress
    if (currentStage === 'screening' && screeningProgress > 0) {
      const baseProgress = (completed / activeStages.length) * 100
      const screeningContribution = (screeningProgress / activeStages.length)
      return Math.round(baseProgress + screeningContribution)
    }

    return Math.round((completed / activeStages.length) * 100)
  }, [stageStatuses, currentStage, screeningProgress, activeStages])

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
        console.log('CLINICAL ANALYSIS - PIPELINE')
        console.log('Enabled Modules:')
        console.log('  - Phenotype Matching:', enablePhenotypeMatching)
        console.log('  - Clinical Screening:', enableScreening)
        console.log('  - Literature Search:', enablePhenotypeMatching && hpoTerms.length > 0)
        console.log('='.repeat(80))
        console.log(JSON.stringify(profile, null, 2))
        console.log('='.repeat(80))

        if (!profile.demographics) {
          throw new Error('Demographics data is required')
        }

        // Variable to store phenotype results for literature search
        let loadedPhenotypeResults = null

        // Stage 1: Phenotype Matching (if enabled and HPO terms exist)
        if (enablePhenotypeMatching && hpoTerms.length > 0) {
          setCurrentStage('phenotype')
          updateStageStatus('phenotype', 'running')

          try {
            const hpoIds = hpoTerms.map(t => t.hpo_id)
            console.log('='.repeat(80))
            console.log('PHENOTYPE MATCHING - Running computation and streaming')
            console.log(`Patient HPO terms: ${hpoIds.join(', ')}`)
            console.log('='.repeat(80))

            // Step 1: Trigger backend computation
            await runPhenotypeMatching(hpoIds)

            // Step 2: Stream aggregated results and capture returned data
            loadedPhenotypeResults = await loadAllPhenotypeResults(sessionId)

            console.log('='.repeat(80))
            console.log('PHENOTYPE MATCHING COMPLETE')
            console.log('  Total genes:', loadedPhenotypeResults?.length || 0)
            if (loadedPhenotypeResults) {
              console.log('  Tier 1 genes:', loadedPhenotypeResults.filter(r => isTier1(r.best_tier)).map(r => r.gene_symbol))
              console.log('  Tier 2 genes:', loadedPhenotypeResults.filter(r => isTier2(r.best_tier)).map(r => r.gene_symbol))
            }
            console.log('='.repeat(80))

            updateStageStatus('phenotype', 'completed')
            toast.success('Phenotype matching complete')
          } catch (error) {
            console.error('Phenotype matching failed:', error)
            updateStageStatus('phenotype', 'failed')
            toast.warning('Phenotype matching failed - continuing without phenotype boost')
          }
        } else if (enablePhenotypeMatching) {
          console.log('Phenotype matching enabled but no HPO terms - skipping')
          updateStageStatus('phenotype', 'skipped')
        } else {
          console.log('Phenotype matching disabled - skipping')
          updateStageStatus('phenotype', 'skipped')
        }

        // Stage 2: Screening Analysis (if enabled)
        if (enableScreening) {
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
            console.log('SCREENING ANALYSIS - Step 1: Computing scores')
            console.log('='.repeat(80))

            // Step 1: Run screening computation (saves to DuckDB + Redis cache)
            await screeningMutation.mutateAsync(screeningPayload)

            console.log('='.repeat(80))
            console.log('SCREENING ANALYSIS - Step 2: Streaming results')
            console.log('='.repeat(80))

            // Step 2: Stream results from backend (instant if Redis cache hit!)
            await loadAllScreeningResults(sessionId)

            updateStageStatus('screening', 'completed')
            toast.success('Clinical screening complete')
          } catch (error) {
            console.error('Screening failed:', error)
            updateStageStatus('screening', 'failed')
            throw new Error('Clinical screening failed')
          }
        } else {
          console.log('Clinical screening disabled - skipping')
          updateStageStatus('screening', 'skipped')
        }

        // Stage 3: Literature Search (if phenotype enabled and has results)
        if (enablePhenotypeMatching) {
          setCurrentStage('literature')
          updateStageStatus('literature', 'running')

          try {
            console.log('='.repeat(80))
            console.log('LITERATURE SEARCH - Checking for top genes')
            console.log('  loadedPhenotypeResults length:', loadedPhenotypeResults?.length || 0)
            console.log('='.repeat(80))

            const topGenes: string[] = []
            if (loadedPhenotypeResults && loadedPhenotypeResults.length > 0) {
              const tier1Genes = loadedPhenotypeResults
                .filter(r => isTier1(r.best_tier))
                .map(r => r.gene_symbol)

              const tier2Genes = loadedPhenotypeResults
                .filter(r => isTier2(r.best_tier))
                .map(r => r.gene_symbol)

              console.log('  Found Tier 1 genes:', tier1Genes)
              console.log('  Found Tier 2 genes:', tier2Genes)

              topGenes.push(...tier1Genes, ...tier2Genes.slice(0, 10))
            }

            console.log('  Final topGenes list:', topGenes)

            if (topGenes.length > 0) {
              console.log('='.repeat(80))
              console.log(`LITERATURE SEARCH - Step 1: Running search for ${topGenes.length} top genes`)
              console.log(`Genes: ${topGenes.join(', ')}`)
              console.log('='.repeat(80))

              // Step 1: Trigger backend search (saves to DuckDB + exports NDJSON.gz)
              await literatureSearchMutation.mutateAsync({
                sessionId: sessionId,
                genes: topGenes,
                hpoTerms: hpoTerms,
                limit: 50,
              })

              console.log('='.repeat(80))
              console.log('LITERATURE SEARCH - Step 2: Streaming results')
              console.log('='.repeat(80))

              // Step 2: Stream literature results from pre-generated file
              await loadAllLiteratureResults(sessionId)

              console.log('='.repeat(80))
              console.log('LITERATURE SEARCH COMPLETE')
              console.log('='.repeat(80))

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
        } else {
          console.log('Literature search disabled (phenotype matching disabled) - skipping')
          updateStageStatus('literature', 'skipped')
        }

        // Pipeline complete - navigate to split view for clinical interpretation
        setCurrentStage(null)

        console.log('='.repeat(80))
        console.log('PIPELINE COMPLETE - Navigating to split view')
        console.log('Enabled modules completed:')
        if (enablePhenotypeMatching) console.log('  ✓ Phenotype results loaded')
        if (enableScreening) console.log('  ✓ Screening results loaded')
        console.log('Clinical interpretation will start in ChatPanel')
        console.log('='.repeat(80))

        toast.success('Analysis pipeline complete')
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
    enableScreening,
    enablePhenotypeMatching,
    getCompleteProfile,
    hpoTerms,
    runPhenotypeMatching,
    loadAllPhenotypeResults,
    loadAllLiteratureResults,
    screeningMutation,
    loadAllScreeningResults,
    literatureSearchMutation,
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
      screening: screeningProgress > 0
        ? `Streaming Screening Results (${screeningProgress}%)`
        : 'Running Clinical Screening',
      literature: 'Searching Literature',
    }
    return stageNames[currentStage] || 'Processing...'
  }, [currentStage, screeningProgress])

  const handleRetry = useCallback(() => {
    window.location.reload()
  }, [])

  if (errorMessage) {
    return (
      <div className="flex justify-center pt-12 p-8">
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
      <div className="flex justify-center pt-12 p-8">
        <Card className="w-full max-w-md border-green-500">
          <CardContent className="pt-6">
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
    <div className="flex justify-center pt-12 p-8">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-center gap-4">
          <HelixLoader size="xs" speed={3} />
          <div>
            <h1 className="text-3xl font-bold">Clinical Analysis</h1>
            <p className="text-base text-muted-foreground">
              Running selected analysis modules
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

        {activeStages.length > 0 && (
          <Alert>
            <AlertDescription className="text-base">
              {activeStages.map(s => s.name).join(' → ')} → AI interpretation
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
