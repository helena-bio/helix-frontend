"use client"
/**
 * Authenticated Layout
 * Two modes:
 * 1. Pre-analysis: Full width workflow (upload, validation, profile, processing)
 * 2. Post-analysis: Split view (45% Chat/Sidebar + 55% View Panel)
 *
 * Providers hierarchy (post-analysis):
 * - ClinicalProfileProvider: Complete patient clinical profile (demographics, phenotype, etc)
 * - PhenotypeResultsProvider: Cached phenotype matching results
 * - LiteratureResultsProvider: Clinical literature search results
 */
import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { JourneyPanel } from '@/components/navigation/JourneyPanel'
import { SplitView } from '@/components/layout/SplitView'
import { ClinicalProfileProvider, PhenotypeResultsProvider, LiteratureResultsProvider } from '@/contexts'
import { useJourney } from '@/contexts/JourneyContext'
import { useSession } from '@/contexts/SessionContext'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { currentStep } = useJourney()
  const { currentSessionId } = useSession()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  // Check if analysis is complete (show split view)
  const isAnalysisComplete = currentStep === 'analysis'

  useEffect(() => {
    const token = localStorage.getItem('helix_auth_token')
    if (!token) {
      router.push('/login')
    } else {
      setIsChecking(false)
    }
  }, [router])

  if (isChecking) {
    return null
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header - Journey Panel with Logo */}
      <header className="h-14 border-b border-border bg-card shrink-0 sticky top-0 z-50">
        <JourneyPanel />
      </header>

      {/* Main area */}
      <div className="flex-1 min-h-0">
        {isAnalysisComplete ? (
          // Split View: 45% (Sidebar+Chat) + 55% (View Panel)
          // Provider hierarchy: ClinicalProfile -> MatchedPhenotype -> Literature
          <ClinicalProfileProvider sessionId={currentSessionId}>
            <PhenotypeResultsProvider sessionId={currentSessionId}>
              <LiteratureResultsProvider>
                <SplitView>
                  {children}
                </SplitView>
              </LiteratureResultsProvider>
            </PhenotypeResultsProvider>
          </ClinicalProfileProvider>
        ) : (
          // Full Width: Pre-analysis workflow
          <main className="h-full overflow-auto bg-background">
            {children}
          </main>
        )}
      </div>
    </div>
  )
}
