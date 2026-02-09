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
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/contexts/SessionContext'
import { useJourney } from '@/contexts/JourneyContext'
import { ModuleRouter } from '@/components/analysis'
import { Loader2 } from 'lucide-react'

export default function AnalysisPage() {
  const router = useRouter()
  const { currentSessionId } = useSession()
  const { skipToAnalysis, currentStep } = useJourney()

  // Ensure journey is at analysis step when on this page
  useEffect(() => {
    if (currentStep !== 'analysis') {
      skipToAnalysis()
    }
  }, [currentStep, skipToAnalysis])

  // Redirect to home if no session
  useEffect(() => {
    if (currentSessionId === null) {
      // Small delay to allow URL sync from layout
      const timeout = setTimeout(() => {
        if (!currentSessionId) {
          router.replace('/')
        }
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [currentSessionId, router])

  if (!currentSessionId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <ModuleRouter sessionId={currentSessionId} />
}
