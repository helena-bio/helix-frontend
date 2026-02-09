"use client"

/**
 * Authenticated Layout
 *
 * Auth guard reads JWT from cookie (not localStorage).
 * Compatible with marketing site SSO via shared cookie domain.
 *
 * Layout structure:
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
 */

import { ReactNode, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Header } from '@/components/navigation/Header'
import { Sidebar } from '@/components/navigation/Sidebar'
import { SplitView } from '@/components/layout/SplitView'
import { HelixLoader } from '@/components/ui/helix-loader'
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
import { useVariantsResults } from '@/contexts/VariantsResultsContext'
import { tokenUtils } from '@/lib/auth/token'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

/**
 * Inner layout that can access VariantsResultsContext
 * (must be inside the provider tree)
 */
function LayoutContent({ children }: { children: ReactNode }) {
  const { currentStep } = useJourney()
  const { currentSessionId } = useSession()
  const pathname = usePathname()
  const { allGenes, isLoading: variantsLoading, loadProgress, loadAllVariants } = useVariantsResults()

  const isAnalysisRoute = pathname === '/analysis' && currentStep === 'analysis'
  // Variants are ready only when loaded AND streaming is complete (progress 100%)
  const variantsReady = allGenes.length > 0 && !variantsLoading && loadProgress >= 100

  // Trigger variant loading when on analysis route with no data
  useEffect(() => {
    if (!isAnalysisRoute || !currentSessionId) return
    if (allGenes.length > 0 || variantsLoading) return

    console.log('[LayoutContent] Triggering variant load for session:', currentSessionId)
    loadAllVariants(currentSessionId)
  }, [isAnalysisRoute, currentSessionId, allGenes.length, variantsLoading, loadAllVariants])

  // Analysis route but variants still loading -- show loading screen
  if (isAnalysisRoute && !variantsReady) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-background">
        <HelixLoader size="md" />
        {loadProgress > 0 && loadProgress < 100 && (
          <div className="w-64 mt-6">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        )}
        <p className="text-lg text-muted-foreground mt-4">
          {variantsLoading ? `Loading case${loadProgress > 0 && loadProgress < 100 ? ` (${loadProgress}%)` : '...'}` : 'Preparing analysis...'}
        </p>
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
    <main className="flex-1 h-full overflow-auto bg-background">
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

  // Sync sessionId from URL to SessionContext
  useEffect(() => {
    const sessionFromUrl = searchParams.get('session')

    // Update context if URL has changed
    if (sessionFromUrl !== currentSessionId) {
      setCurrentSessionId(sessionFromUrl)
    }
  }, [searchParams, currentSessionId, setCurrentSessionId])

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
                <div className="h-screen flex flex-col">
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
              </LiteratureResultsProvider>
            </VariantsResultsProvider>
          </PhenotypeResultsProvider>
        </ScreeningResultsProvider>
      </ClinicalProfileProvider>
    </ClinicalInterpretationProvider>
  )
}
