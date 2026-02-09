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
 * SESSION MANAGEMENT:
 * - After upload completes, sessionId is added to URL: /upload?session=<uuid>
 * - When journey reaches analysis step, redirects to /analysis?session=<uuid>
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/contexts/SessionContext'
import { useJourney } from '@/contexts/JourneyContext'
import {
  UploadValidationFlow,
  ClinicalProfileEntry,
  ProcessingFlow,
} from '@/components/analysis'
import { Loader2 } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const { currentSessionId, setCurrentSessionId } = useSession()
  const { currentStep, resetJourney } = useJourney()

  // Reset journey when landing on /upload without a session
  useEffect(() => {
    if (!currentSessionId) {
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

  // Step 1: Upload (includes validation and QC)
  if (currentStep === 'upload') {
    return (
      <UploadValidationFlow
        onComplete={handleUploadComplete}
      />
    )
  }

  // Step 2: Processing (ACMG classification)
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

  // Step 3: Clinical Profile Entry
  if (currentStep === 'profile') {
    if (!currentSessionId) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    return <ClinicalProfileEntry sessionId={currentSessionId} />
  }

  // Fallback - analysis step redirect is handled by useEffect above
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
