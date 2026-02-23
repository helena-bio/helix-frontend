"use client"
/**
 * Upload Page - New Case Workflow
 *
 * Journey Order:
 * 1. Upload - Upload VCF file and validate (includes QC)
 * 2. Processing - Run ACMG classification pipeline
 * 3. Profile - Enter clinical profile and run phenotype matching (optional)
 * 4. -> Redirects to /analysis?session=<id> when complete
 *
 * REPROCESS MODE:
 * When journeyMode === 'reprocess', step 2 renders ReprocessFlow instead of
 * ProcessingFlow. The stepper shows "Reprocess" instead of "Upload".
 * Triggered via useJourney().startReprocess(sessionId) from dashboard.
 *
 * SESSION MANAGEMENT:
 * - After upload completes, sessionId is added to URL: /upload?session=<uuid>
 * - When journey reaches analysis step, redirects to /analysis?session=<uuid>
 */
import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/contexts/SessionContext'
import { useJourney } from '@/contexts/JourneyContext'
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
  const { currentStep, journeyMode, skipToAnalysis, resetJourney } = useJourney()

  // Processing configuration - bridge between Upload and Processing steps
  const [filteringPreset, setFilteringPreset] = useState<string>('strict')

  // Reset journey when landing on /upload without a session (new upload only)
  useEffect(() => {
    if (!currentSessionId && journeyMode === 'new') {
      resetJourney()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect to /analysis when journey reaches analysis step
  useEffect(() => {
    if (currentStep === 'analysis' && currentSessionId) {
      router.push(`/analysis?session=${currentSessionId}`)
    }
  }, [currentStep, currentSessionId, router])

  // Handle upload complete - add sessionId to URL
  const handleUploadComplete = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    router.push(`/upload?session=${sessionId}`)
  }

  // Handle analysis ready - invalidate cases list so sidebar updates
  const handleAnalysisReady = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: casesKeys.all })
    skipToAnalysis()
  }, [queryClient, skipToAnalysis])

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

  // Step 2: Processing (ACMG classification) or Reprocessing
  if (currentStep === 'processing') {
    if (!currentSessionId) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    // Reprocess mode: re-annotate existing session
    if (journeyMode === 'reprocess') {
      return (
        <ReprocessFlow
          sessionId={currentSessionId}
        />
      )
    }

    // New upload mode: full pipeline
    return (
      <ProcessingFlow
        sessionId={currentSessionId}
        filteringPreset={filteringPreset}
      />
    )
  }

  // Step 3: Clinical Profile Entry
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

  // Fallback - analysis step redirect is handled by useEffect above
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
