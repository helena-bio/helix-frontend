"use client"
/**
 * Analysis Page - View and Analyze Variants
 *
 * URL: /analysis?session=<uuid>
 * JourneyContext derives currentStep = 'analysis' from pathname.
 * No manual step manipulation needed.
 */
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/contexts/SessionContext'
import { ModuleRouter } from '@/components/analysis'
import { Loader2 } from 'lucide-react'

export default function AnalysisPage() {
  const router = useRouter()
  const { currentSessionId } = useSession()

  // Ref to track current sessionId for timeout callback
  const sessionIdRef = useRef<string | null>(currentSessionId)
  useEffect(() => {
    sessionIdRef.current = currentSessionId
  }, [currentSessionId])

  // Redirect to home if no session
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
