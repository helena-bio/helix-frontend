"use client"

/**
 * Authenticated Layout
 * Two modes:
 * 1. Pre-analysis: Full width workflow (upload, validation, profile, processing)
 * 2. Post-analysis: Split view (45% Chat/Sidebar + 55% View Panel)
 *
 * Providers hierarchy (both modes):
 * - ClinicalInterpretationProvider: Clinical interpretation (per-session)
 * - ClinicalProfileProvider: Complete patient clinical profile
 * - ScreeningResultsProvider: Clinical screening analysis results
 * - PhenotypeResultsProvider: Phenotype matching results
 * - VariantsResultsProvider: ALL variants (streaming, local filtering)
 * - LiteratureResultsProvider: Clinical literature search results
 *
 * SESSION MANAGEMENT:
 * - URL is source of truth: /analysis?session=<uuid>
 * - No session in URL = fresh start (upload step)
 * - Session in URL = continue existing session
 * - All providers receive sessionId and auto-cleanup when it changes
 */

import { ReactNode, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { JourneyPanel } from '@/components/navigation/JourneyPanel'
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

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { currentStep } = useJourney()
  const { currentSessionId, setCurrentSessionId } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isChecking, setIsChecking] = useState(true)

  // Check if analysis is complete (show split view)
  const isAnalysisComplete = currentStep === 'analysis'

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('helix_auth_token')
    if (!token) {
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
              <LiteratureResultsProvider>
                <div className="h-screen flex flex-col">
                  {/* Header - Journey Panel with Logo */}
                  <header className="h-14 border-b border-border bg-card shrink-0 sticky top-0 z-50">
                    <JourneyPanel />
                  </header>

                  {/* Main area */}
                  <div className="flex-1 min-h-0">
                    {isAnalysisComplete ? (
                      // Split View: 45% (Sidebar+Chat) + 55% (View Panel)
                      <SplitView>
                        {children}
                      </SplitView>
                    ) : (
                      // Full Width: Pre-analysis workflow
                      <main className="h-full overflow-auto bg-background">
                        {children}
                      </main>
                    )}
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
