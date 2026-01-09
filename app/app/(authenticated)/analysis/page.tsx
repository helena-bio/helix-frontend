"use client"

/**
 * Analysis Page - Main Variant Analysis Workflow
 * After analysis complete, shows in ContextPanel (right side of split screen)
 */

import { useAnalysis } from '@/contexts/AnalysisContext'
import { useJourney } from '@/contexts/JourneyContext'
import { useSession } from '@/hooks/queries'
import {
  UploadValidationFlow,
  PhenotypeEntry,
  ProcessingFlow,
  AnalysisJourneyView
} from '@/components/analysis'
import { Loader2 } from 'lucide-react'

export default function AnalysisPage() {
  const { currentSessionId, setCurrentSessionId } = useAnalysis()
  const { currentStep, resetJourney } = useJourney()

  // Session query for data
  const sessionQuery = useSession(currentSessionId || '', {
    enabled: !!currentSessionId,
  })

  // Handle upload+validation complete
  const handleUploadValidationComplete = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  // Render content based on current journey step
  if (currentStep === 'upload' || currentStep === 'validation') {
    return (
      <UploadValidationFlow
        onComplete={handleUploadValidationComplete}
      />
    )
  }

  if (currentStep === 'phenotype') {
    if (!currentSessionId) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    return (
      <PhenotypeEntry
        sessionId={currentSessionId}
      />
    )
  }

  if (currentStep === 'processing') {
    if (!currentSessionId) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    return (
      <ProcessingFlow
        sessionId={currentSessionId}
      />
    )
  }

  if (currentStep === 'analysis') {
    if (!currentSessionId) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    // ANALYSIS VIEW - Uses AnalysisJourneyView for chat + variant detail switching
    return (
      <AnalysisJourneyView sessionId={currentSessionId} />
    )
  }

  return null
}
