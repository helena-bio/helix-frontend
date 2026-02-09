"use client"
/**
 * Analysis Page - View and Analyze Variants
 *
 * Requires a completed session. If no session in URL, redirects to home.
 * Layout provides SplitView when this page is active.
 *
 * SESSION MANAGEMENT:
 * - Session comes from URL: /analysis?session=<uuid>
 * - URL is the source of truth
 *
 * DATA LOADING:
 * - During upload flow: ProcessingFlow loads all data into contexts
 * - Reopening existing case: This page triggers data loading
 */
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/contexts/SessionContext'
import { useJourney } from '@/contexts/JourneyContext'
import { useVariantsResults } from '@/contexts/VariantsResultsContext'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import { usePhenotypeResults } from '@/contexts/PhenotypeResultsContext'
import { useLiteratureResults } from '@/contexts/LiteratureResultsContext'
import { ModuleRouter } from '@/components/analysis'
import { Loader2 } from 'lucide-react'

export default function AnalysisPage() {
  const router = useRouter()
  const { currentSessionId } = useSession()
  const { skipToAnalysis, currentStep } = useJourney()

  // Data contexts
  const { allGenes, isLoading: variantsLoading, loadAllVariants } = useVariantsResults()
  const { status: screeningStatus, loadScreeningResults } = useScreeningResults()
  const { allResults: phenotypeResults, status: phenotypeStatus, loadAllPhenotypeResults } = usePhenotypeResults()
  const { publications, status: literatureStatus, loadAllLiteratureResults } = useLiteratureResults()

  // Track which session we already triggered loading for
  const loadTriggeredForSession = useRef<string | null>(null)

  // Ensure journey is at analysis step when on this page
  useEffect(() => {
    if (currentStep !== 'analysis') {
      skipToAnalysis()
    }
  }, [currentStep, skipToAnalysis])

  // Redirect to home if no session
  useEffect(() => {
    if (currentSessionId === null) {
      const timeout = setTimeout(() => {
        if (!currentSessionId) {
          router.replace('/')
        }
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [currentSessionId, router])

  // Load data for existing cases (not from upload flow)
  // Triggers once per session -- checks if data is already present
  useEffect(() => {
    if (!currentSessionId) return
    if (loadTriggeredForSession.current === currentSessionId) return

    // If variants are already loaded (from upload flow), skip
    if (allGenes.length > 0 || variantsLoading) return

    console.log('[AnalysisPage] Loading data for existing case:', currentSessionId)
    loadTriggeredForSession.current = currentSessionId

    // Load variants (always available for completed cases)
    loadAllVariants(currentSessionId)

    // Load screening results (safe to attempt -- returns empty if not available)
    if (screeningStatus === 'idle') {
      loadScreeningResults(currentSessionId).catch(() => {
        console.log('[AnalysisPage] No screening results for this session')
      })
    }

    // Load phenotype results (safe to attempt)
    if (phenotypeStatus === 'idle') {
      loadAllPhenotypeResults(currentSessionId).catch(() => {
        console.log('[AnalysisPage] No phenotype results for this session')
      })
    }

    // Load literature results (safe to attempt)
    if (literatureStatus === 'idle') {
      loadAllLiteratureResults(currentSessionId).catch(() => {
        console.log('[AnalysisPage] No literature results for this session')
      })
    }
  }, [
    currentSessionId,
    allGenes.length,
    variantsLoading,
    screeningStatus,
    phenotypeStatus,
    literatureStatus,
    loadAllVariants,
    loadScreeningResults,
    loadAllPhenotypeResults,
    loadAllLiteratureResults,
  ])

  if (!currentSessionId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <ModuleRouter sessionId={currentSessionId} />
}
