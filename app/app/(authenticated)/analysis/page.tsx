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
 * - Context status guards prevent double-loading (status moves to 'loading' immediately)
 * - Context auto-resets to 'idle' on session change, retriggering this effect
 *
 * REDIRECT SAFETY:
 * - Uses a ref to read current sessionId inside setTimeout
 * - Prevents stale closure from redirecting when sessionId
 *   is being set asynchronously (e.g. URL sync in layout)
 */
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/contexts/SessionContext'
import { useJourney } from '@/contexts/JourneyContext'
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
  const { status: screeningStatus, loadScreeningResults } = useScreeningResults()
  const { aggregatedResults, status: phenotypeStatus, loadAllPhenotypeResults } = usePhenotypeResults()
  const { results: literatureResults, status: literatureStatus, loadAllLiteratureResults } = useLiteratureResults()

  // Ref to track current sessionId for timeout callback (avoids stale closure)
  const sessionIdRef = useRef<string | null>(currentSessionId)
  useEffect(() => {
    sessionIdRef.current = currentSessionId
  }, [currentSessionId])

  // Ensure journey is at analysis step when on this page
  useEffect(() => {
    if (currentStep !== 'analysis') {
      skipToAnalysis()
    }
  }, [currentStep, skipToAnalysis])

  // Redirect to home if no session (with stale-closure-safe check)
  useEffect(() => {
    if (currentSessionId === null) {
      const timeout = setTimeout(() => {
        if (!sessionIdRef.current) {
          router.replace('/')
        }
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [currentSessionId, router])

  // Load supplementary data for existing cases (screening, phenotype, literature)
  // Variants are loaded by LayoutContent -- this handles the rest.
  //
  // Guard: status === 'idle' only. No ref needed because:
  // - Contexts set status to 'loading' immediately, preventing double-triggers
  // - Contexts auto-reset to 'idle' on session change, retriggering this effect
  useEffect(() => {
    if (!currentSessionId) return

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
    screeningStatus,
    phenotypeStatus,
    literatureStatus,
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
