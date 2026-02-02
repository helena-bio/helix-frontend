"use client"
/**
 * Analysis Page - Main Variant Analysis Workflow
 *
 * Journey Order:
 * 1. Upload - Upload VCF file and validate (includes QC)
 * 2. Processing - Run ACMG classification pipeline
 * 3. Profile - Enter clinical profile and run phenotype matching (optional)
 * 4. Analysis - View and analyze variants
 *
 * SESSION MANAGEMENT:
 * - After upload completes, sessionId is added to URL: /analysis?session=<uuid>
 * - URL becomes the source of truth for the session
 */
import { useRouter } from 'next/navigation'
import { useSession } from '@/contexts/SessionContext'
import { useJourney } from '@/contexts/JourneyContext'
import {
  UploadValidationFlow,
  ClinicalProfileEntry,
  ProcessingFlow,
  ModuleRouter
} from '@/components/analysis'
import { Loader2 } from 'lucide-react'

export default function AnalysisPage() {
  const router = useRouter()
  const { currentSessionId, setCurrentSessionId } = useSession()
  const { currentStep } = useJourney()

  // Handle upload complete - add sessionId to URL
  const handleUploadComplete = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    // Add sessionId to URL
    router.push(`/analysis?session=${sessionId}`)
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

    // ClinicalProfileProvider already in layout.tsx - no need to wrap again!
    return <ClinicalProfileEntry sessionId={currentSessionId} />
  }

  // Step 4: Analysis View
  if (currentStep === 'analysis') {
    if (!currentSessionId) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    // ClinicalProfileProvider already in layout.tsx - no need to wrap again!
    return <ModuleRouter sessionId={currentSessionId} />
  }

  return null
}
