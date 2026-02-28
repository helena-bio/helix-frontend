"use client"
/**
 * Upload Page - New Case Workflow
 *
 * Step is derived from URL query params (via JourneyContext):
 *   /upload                             -> Upload form / QC results
 *   /upload?session=XXX&step=processing -> ProcessingFlow
 *   /upload?session=XXX&step=profile    -> ClinicalProfileEntry
 *
 * No localStorage. No manual step state. URL is truth.
 */
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/contexts/SessionContext'
import { useJourney } from '@/contexts/JourneyContext'
import { useUploadContext } from '@/contexts/UploadContext'
import {
  UploadValidationFlow,
  ClinicalProfileEntry,
  ProcessingFlow,
} from '@/components/analysis'
import { ReprocessFlow } from '@/components/analysis/ReprocessFlow'
import { casesKeys } from '@/hooks/queries/use-cases'
import { Loader2 } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { currentSessionId, setCurrentSessionId } = useSession()
  const { currentStep, journeyMode, skipToAnalysis } = useJourney()

  // Processing configuration
  const [filteringPreset, setFilteringPreset] = useState<string>('strict')

  // DEBUG: Log every render with current state
  console.log("[UploadPage] RENDER step=" + currentStep + " session=" + currentSessionId + " mode=" + journeyMode)

  // Handle upload complete - add sessionId to URL
  const handleUploadComplete = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId)
    router.push(`/upload?session=${sessionId}`)
  }, [setCurrentSessionId, router])

  // Handle analysis ready - navigate to analysis
  const handleAnalysisReady = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: casesKeys.all })
    if (currentSessionId) {
      router.push(`/analysis?session=${currentSessionId}`)
    }
  }, [queryClient, currentSessionId, router])

  // Step 1: Upload (includes validation and QC)
  if (currentStep === 'upload') {
    return (
      <UploadValidationFlow
        onComplete={handleUploadComplete}
        filteringPreset={filteringPreset}
        onFilteringPresetChange={setFilteringPreset}
      />
    )
  }

  // Step 2: Processing
  if (currentStep === 'processing') {
    if (!currentSessionId) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (journeyMode === 'reprocess') {
      return <ReprocessFlow sessionId={currentSessionId} />
    }

    return (
      <ProcessingFlow
        sessionId={currentSessionId}
        filteringPreset={filteringPreset}
      />
    )
  }

  // Step 3: Clinical Profile
  if (currentStep === 'profile') {
    if (!currentSessionId) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }
    return <ClinicalProfileEntry sessionId={currentSessionId} onComplete={handleAnalysisReady} />
  }

  // Fallback
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
