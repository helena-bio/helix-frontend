"use client"

/**
 * Analysis Page - Main Variant Analysis Workflow
 * Pre-analysis: Shows workflow steps (upload, validation, phenotype, processing)
 * Post-analysis: Shows ModuleRouter in View Panel (60%)
 */

import { useAnalysis } from '@/contexts/AnalysisContext'
import { useJourney } from '@/contexts/JourneyContext'
import { PhenotypeProvider } from '@/contexts/PhenotypeContext'
import {
  UploadValidationFlow,
  PhenotypeEntry,
  ProcessingFlow,
  ModuleRouter
} from '@/components/analysis'
import { Loader2 } from 'lucide-react'

export default function AnalysisPage() {
  const { currentSessionId, setCurrentSessionId } = useAnalysis()
  const { currentStep } = useJourney()

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
      <PhenotypeProvider sessionId={currentSessionId}>
        <PhenotypeEntry sessionId={currentSessionId} />
      </PhenotypeProvider>
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
      <ProcessingFlow sessionId={currentSessionId} />
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

    // ANALYSIS VIEW - PhenotypeProvider already wrapped in layout
    return <ModuleRouter sessionId={currentSessionId} />
  }

  return null
}
