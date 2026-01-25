"use client"
/**
 * Analysis Page - Main Variant Analysis Workflow
 *
 * Journey Order:
 * 1. Upload/Validation - Upload VCF file and validate
 * 2. Processing - Run ACMG classification pipeline
 * 3. Profile - Enter clinical profile and run phenotype matching (optional)
 * 4. Analysis - View and analyze variants
 */
import { useAnalysis } from '@/contexts/AnalysisContext'
import { useJourney } from '@/contexts/JourneyContext'
import { ClinicalProfileProvider } from '@/contexts/ClinicalProfileContext'
import {
  UploadValidationFlow,
  ClinicalProfileEntry,
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

  // Step 1: Upload & Validation
  if (currentStep === 'upload' || currentStep === 'validation') {
    return (
      <UploadValidationFlow
        onComplete={handleUploadValidationComplete}
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

  // Step 3: Clinical Profile Entry & Phenotype Matching (optional)
  if (currentStep === 'profile') {
    if (!currentSessionId) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }
    return (
      <ClinicalProfileProvider sessionId={currentSessionId}>
        <ClinicalProfileEntry sessionId={currentSessionId} />
      </ClinicalProfileProvider>
    )
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
    return <ModuleRouter sessionId={currentSessionId} />
  }

  return null
}
