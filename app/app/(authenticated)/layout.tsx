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
 *   - /analysis: SplitView (Chat + View Panel)
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
import { tokenUtils } from '@/lib/auth/token'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { currentStep } = useJourney()
  const { currentSessionId, setCurrentSessionId } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  // SplitView only on /analysis route (route is source of truth for layout)
  const showSplitView = pathname === '/analysis' && currentStep === 'analysis'

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
                    {showSplitView ? (
                      <SplitView>
                        {children}
                      </SplitView>
                    ) : (
                      <main className="flex-1 h-full overflow-auto bg-background">
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
