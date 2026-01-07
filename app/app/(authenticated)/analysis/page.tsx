"use client"

/**
 * Analysis Page - Main Variant Analysis Workflow
 *
 * Journey-driven flow using JourneyContext:
 * 1. Upload + Validation -> UploadValidationFlow
 * 2. Phenotype -> PhenotypeEntry
 * 3. Analysis -> Results
 */

import { useAnalysis } from '@/contexts/AnalysisContext'
import { useJourney } from '@/contexts/JourneyContext'
import { useSession, useQCMetrics } from '@/hooks/queries'
import {
  UploadValidationFlow,
  PhenotypeEntry,
  QCMetrics,
  VariantsList
} from '@/components/analysis'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function AnalysisPage() {
  const { currentSessionId, setCurrentSessionId } = useAnalysis()
  const { currentStep, nextStep, resetJourney } = useJourney()

  // Session query for data
  const sessionQuery = useSession(currentSessionId || '', {
    enabled: !!currentSessionId,
  })

  // QC metrics query
  const qcQuery = useQCMetrics(currentSessionId || '', {
    enabled: !!currentSessionId && currentStep === 'analysis',
  })

  // Handle upload+validation complete
  const handleUploadValidationComplete = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  // Handle start over
  const handleStartOver = () => {
    setCurrentSessionId(null)
    resetJourney()
  }

  // Render content based on current journey step
  const renderContent = () => {
    // Upload and Validation use the same unified component
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

    if (currentStep === 'analysis') {
      if (!currentSessionId) {
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )
      }

      if (qcQuery.data) {
        return (
          <div className="p-8">
            <div className="max-w-4xl mx-auto mb-8">
              <QCMetrics
                metrics={qcQuery.data}
                fileName={sessionQuery.data?.vcf_file_path?.split('/').pop()}
              />
            </div>

            <VariantsList sessionId={currentSessionId} />

            <div className="mt-6 text-center">
              <Button variant="outline" onClick={handleStartOver}>
                Start New Analysis
              </Button>
            </div>
          </div>
        )
      }

      return (
        <div className="p-8">
          <VariantsList sessionId={currentSessionId} />

          <div className="mt-6 text-center">
            <Button variant="outline" onClick={handleStartOver}>
              Start New Analysis
            </Button>
          </div>
        </div>
      )
    }

    return null
  }

  return <div className="min-h-screen">{renderContent()}</div>
}
