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
import { ModuleRouter } from '@/components/analysis'
import { Loader2 } from 'lucide-react'

export default function AnalysisPage() {
  const router = useRouter()
  const { currentSessionId } = useSession()
  const { skipToAnalysis, currentStep } = useJourney()

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

  if (!currentSessionId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <ModuleRouter sessionId={currentSessionId} />
}
