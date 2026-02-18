"use client"

/**
 * Authenticated Layout
 *
 * Auth guard reads JWT from cookie (not localStorage).
 * Compatible with marketing site SSO via shared cookie domain.
 *
 * Layout structure:
 * - ImpersonationBanner: amber bar when viewing as another org (conditional)
 * - Header: Header (always visible)
 * - Sidebar: Always visible (modules disabled until analysis complete)
 * - Content area:
 *   - /analysis (loading): Full-screen loading with bulb spinner
 *   - /analysis (ready): SplitView (Chat + View Panel)
 *   - Everything else: Full width (dashboard, upload workflow)
 *
 * SESSION MANAGEMENT:
 * - URL is source of truth: /analysis?session=<uuid>
 * - No session in URL = fresh start (upload step)
 * - Session in URL = continue existing session
 * - All providers receive sessionId and auto-cleanup when it changes
 *
 * URL SYNC:
 * - One-way: URL -> SessionContext (never the reverse)
 * - CasesList/Dashboard navigate via router.push only
 * - Layout picks up searchParams change and updates context
 */

import { Loader2, ArrowLeft } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Header } from '@/components/navigation/Header'
import { Sidebar } from '@/components/navigation/Sidebar'
import { SplitView } from '@/components/layout/SplitView'
import {
  ClinicalInterpretationProvider,
  ClinicalProfileProvider,
  ScreeningResultsProvider,
  PhenotypeResultsProvider,
  VariantsResultsProvider,
  LiteratureResultsProvider
} from '@/contexts'
import { useJourney } from '@/contexts/JourneyContext'
import { useSession } from '@/contexts/SessionContext'
import { useAuth } from '@/contexts/AuthContext'
import { ReviewBoardProvider } from '@/contexts/ReviewBoardContext'
import { useVariantsResults } from '@/contexts/VariantsResultsContext'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import { usePhenotypeResults } from '@/contexts/PhenotypeResultsContext'
import { useLiteratureResults } from '@/contexts/LiteratureResultsContext'
import { tokenUtils } from '@/lib/auth/token'

interface AuthenticatedLayoutProps {
  children: ReactNode
}


// =========================================================================
// IMPERSONATION BANNER
// =========================================================================

function ImpersonationBanner() {
  const { impersonation, exitSwitch } = useAuth()
  const [exiting, setExiting] = useState(false)

  if (!impersonation.active) return null

  const handleExit = async () => {
    setExiting(true)
    try {
      await exitSwitch()
    } catch (err) {
      console.error('Failed to exit impersonation:', err)
      setExiting(false)
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-base text-amber-900">
          Viewing as <span className="font-semibold">{impersonation.organizationName || 'another organization'}</span>
        </p>
        <button
          onClick={handleExit}
          disabled={exiting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-base font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {exiting ? 'Returning...' : 'Exit to Platform'}
        </button>
      </div>
    </div>
  )
}


// =========================================================================
// LAYOUT CONTENT (inner, needs provider tree)
// =========================================================================

/**
 * Inner layout that can access VariantsResultsContext
 * (must be inside the provider tree)
 */
function LayoutContent({ children }: { children: ReactNode }) {
  const { currentStep } = useJourney()
  const { currentSessionId } = useSession()
  const pathname = usePathname()
  const { allGenes, isLoading: variantsLoading, loadProgress, loadAllVariants, error: variantsError } = useVariantsResults()

  // Supplementary data contexts -- load in PARALLEL with variants
  const { status: screeningStatus, loadAllScreeningResults } = useScreeningResults()
  const { status: phenotypeStatus, loadAllPhenotypeResults } = usePhenotypeResults()
  const { status: literatureStatus, loadAllLiteratureResults } = useLiteratureResults()

  const isAnalysisRoute = pathname === '/analysis' && currentStep === 'analysis'
  // Variants are ready only when loaded AND streaming is complete (progress 100%)
  const variantsReady = allGenes.length > 0 && !variantsLoading && loadProgress >= 100

  // Trigger ALL data loading in parallel when on analysis route
  // Variants, screening, phenotype, and literature all stream simultaneously.
  // Each context guards against double-loading via status checks.
  useEffect(() => {
    if (!isAnalysisRoute || !currentSessionId) return

    // Variants
    if (allGenes.length === 0 && !variantsLoading && !variantsError) {
      console.log('[LayoutContent] Triggering variant load for session:', currentSessionId)
      loadAllVariants(currentSessionId)
    }

    // Screening (parallel -- fires same tick as variants)
    if (screeningStatus === 'idle') {
      loadAllScreeningResults(currentSessionId).catch(() => {
        console.log('[LayoutContent] No screening results for this session')
      })
    }

    // Phenotype (parallel)
    if (phenotypeStatus === 'idle') {
      loadAllPhenotypeResults(currentSessionId).catch(() => {
        console.log('[LayoutContent] No phenotype results for this session')
      })
    }

    // Literature (parallel)
    if (literatureStatus === 'idle') {
      loadAllLiteratureResults(currentSessionId).catch(() => {
        console.log('[LayoutContent] No literature results for this session')
      })
    }
  }, [
    isAnalysisRoute,
    currentSessionId,
    allGenes.length,
    variantsLoading,
    loadAllVariants,
    screeningStatus,
    loadAllScreeningResults,
    phenotypeStatus,
    loadAllPhenotypeResults,
    literatureStatus,
    loadAllLiteratureResults,
  ])

  // Analysis route but variants still loading -- show loading screen
  if (isAnalysisRoute && !variantsReady) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-md text-muted-foreground mt-3">Loading case...</p>
      </div>
    )
  }

  // Analysis route with data ready -- SplitView
  if (isAnalysisRoute && variantsReady) {
    return (
      <SplitView>
        {children}
      </SplitView>
    )
  }

  // All other routes -- full width
  return (
    <main className="flex-1 h-full overflow-y-auto [scrollbar-gutter:stable] bg-background">
      {children}
    </main>
  )
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { currentSessionId, setCurrentSessionId } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isChecking, setIsChecking] = useState(true)

  // Auth check -- cookie-based JWT validation
  useEffect(() => {
    if (!tokenUtils.isValid()) {
      tokenUtils.remove()
      router.push('/login')
    } else {
      setIsChecking(false)
    }
  }, [router])

  // Sync sessionId from URL to SessionContext (ONE-WAY: URL -> Context)
  //
  // IMPORTANT: currentSessionId is intentionally NOT in the dependency array.
  // This prevents the race condition where:
  //   1. CasesList sets sessionId via context (before URL updates)
  //   2. This effect sees mismatch (old URL vs new context)
  //   3. Resets sessionId to null (the old URL value)
  //   4. JourneyContext auto-resets to 'upload'
  //
  // With one-way sync, only URL changes drive context updates.
  // React state ignores set calls with the same value (no extra renders).
  useEffect(() => {
    const sessionFromUrl = searchParams.get('session')
    setCurrentSessionId(sessionFromUrl)
  }, [searchParams, setCurrentSessionId])

  if (isChecking) {
    return null
  }

  return (
    <ClinicalInterpretationProvider sessionId={currentSessionId}>
      <ClinicalProfileProvider sessionId={currentSessionId}>
        <ScreeningResultsProvider sessionId={currentSessionId}>
          <PhenotypeResultsProvider sessionId={currentSessionId}>
            <VariantsResultsProvider sessionId={currentSessionId}>
              <LiteratureResultsProvider sessionId={currentSessionId}>
                <ReviewBoardProvider>
                <div className="h-screen flex flex-col">
                  {/* Impersonation Banner -- above everything */}
                  <ImpersonationBanner />

                  {/* Header - Journey Panel with Logo */}
                  <header className="h-14 border-b border-border bg-card shrink-0 sticky top-0 z-50">
                    <Header />
                  </header>

                  {/* Main area: Sidebar + Content */}
                  <div className="flex-1 min-h-0 flex">
                    {/* Sidebar - Always visible */}
                    <Sidebar />

                    {/* Content area */}
                    <LayoutContent>
                      {children}
                    </LayoutContent>
                  </div>
                </div>
                </ReviewBoardProvider>
              </LiteratureResultsProvider>
            </VariantsResultsProvider>
          </PhenotypeResultsProvider>
        </ScreeningResultsProvider>
      </ClinicalProfileProvider>
    </ClinicalInterpretationProvider>
  )
}
