"use client"

/**
 * Authenticated Layout
 * Two modes:
 * 1. Pre-analysis: Full width workflow (upload, validation, phenotype, processing)
 * 2. Post-analysis: Split view (50% Chat/Sidebar + 50% View Panel)
 */

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { JourneyPanel } from '@/components/navigation/JourneyPanel'
import { SplitView } from '@/components/layout/SplitView'
import { useJourney } from '@/contexts/JourneyContext'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { currentStep } = useJourney()
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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - Journey Panel with Logo */}
      <header className="h-14 border-b border-border bg-card shrink-0 sticky top-0 z-50">
        <JourneyPanel />
      </header>

      {/* Main area */}
      <div className="flex-1 overflow-hidden">
        {isAnalysisComplete ? (
          // Split View: 50% (Sidebar+Chat) + 50% (View Panel)
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
  )
}
