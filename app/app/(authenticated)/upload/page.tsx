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
 *
 * FIX: sessionId is read directly from URL searchParams, NOT from
 * SessionContext. Layout URL sync effect runs AFTER render, so
 * SessionContext may hold the OLD sessionId for one render cycle.
 * This caused ProcessingFlow to receive a completed session's ID
 * and immediately call nextStep() -> step=profile.
 */
import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { invalidateSessionCaches } from '@/lib/cache/invalidate-session-caches'
import { Loader2 } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const { currentSessionId, setCurrentSessionId } = useSession()
  const { currentStep, journeyMode, skipToAnalysis } = useJourney()

  // Read sessionId directly from URL to avoid layout sync race condition.
  // SessionContext may still hold the OLD sessionId for one render cycle
  // after URL changes. This caused ProcessingFlow to receive a completed
  // session's ID and immediately call nextStep().
  const sessionId = searchParams.get('session') || currentSessionId

  // Processing configuration
  const [filteringPreset, setFilteringPreset] = useState<string>('strict')

  // DEBUG: Log every render with current state
  console.log("[UploadPage] RENDER step=" + currentStep + " session=" + sessionId + " (ctx=" + currentSessionId + ") mode=" + journeyMode)

  // Handle upload complete - add sessionId to URL
  const handleUploadComplete = useCallback((sid: string) => {
    setCurrentSessionId(sid)
    router.push(`/upload?session=${sid}`)
  }, [setCurrentSessionId, router])

  // Handle analysis ready - navigate to analysis
  const handleAnalysisReady = useCallback(() => {
    invalidateSessionCaches(queryClient, sessionId!)
    if (sessionId) {
      router.push(`/analysis?session=${sessionId}`)
    }
  }, [queryClient, sessionId, router])

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
    if (!sessionId) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (journeyMode === 'reprocess') {
      return <ReprocessFlow sessionId={sessionId} />
    }

    return (
      <ProcessingFlow
        sessionId={sessionId}
        filteringPreset={filteringPreset}
      />
    )
  }

  // Step 3: Clinical Profile
  if (currentStep === 'profile') {
    if (!sessionId) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }
    return <ClinicalProfileEntry sessionId={sessionId} onComplete={handleAnalysisReady} />
  }

  // Fallback
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
