"use client"
/**
 * Analysis Page - View and Analyze Variants
 *
 * URL: /analysis?session=<uuid>
 * JourneyContext derives currentStep = 'analysis' from pathname.
 * No manual step manipulation needed.
 *
 * If no session in URL, show empty state. Do NOT redirect --
 * redirecting causes race conditions when navigating away.
 */
import { useSession } from '@/contexts/SessionContext'
import { ModuleRouter } from '@/components/analysis'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AnalysisPage() {
  const { currentSessionId } = useSession()
  const router = useRouter()

  if (!currentSessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-base text-muted-foreground">No case selected</p>
        <button
          onClick={() => router.push('/upload')}
          className="text-base text-primary hover:underline"
        >
          Upload a new case
        </button>
      </div>
    )
  }

  return <ModuleRouter sessionId={currentSessionId} />
}
