"use client"

/**
 * Analysis Page - Main Variant Analysis Workflow
 *
 * Journey-driven flow using JourneyContext:
 * 1. Upload -> FileUpload component
 * 2. Validation -> ValidationStatus (auto-starts validation)
 * 3. Phenotype -> Phenotype entry (TODO)
 * 4. Analysis -> ProcessingStatus -> Results
 */

import { useEffect } from 'react'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { useJourney } from '@/contexts/JourneyContext'
import { useSession, useQCMetrics } from '@/hooks/queries'
import {
  FileUpload,
  ValidationStatus,
  ProcessingStatus,
  QCMetrics,
  VariantsList
} from '@/components/analysis'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function AnalysisPage() {
  const { currentSessionId, setCurrentSessionId } = useAnalysis()
  const { currentStep, nextStep, goToStep, resetJourney } = useJourney()

  // Session query for data
  const sessionQuery = useSession(currentSessionId || '', {
    enabled: !!currentSessionId,
  })

  // QC metrics query
  const qcQuery = useQCMetrics(currentSessionId || '', {
    enabled: !!currentSessionId && currentStep === 'analysis',
  })

  // Handle upload success - set session and move to validation
  const handleUploadSuccess = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    // nextStep() is called by FileUpload component
  }

  // Handle validation complete - move to phenotype
  const handleValidationComplete = () => {
    // nextStep() is called by ValidationStatus component
  }

  // Handle phenotype complete - move to analysis
  const handlePhenotypeComplete = () => {
    nextStep()
  }

  // Handle start over
  const handleStartOver = () => {
    setCurrentSessionId(null)
    resetJourney()
  }

  // Render content based on current journey step
  const renderContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
          />
        )

      case 'validation':
        if (!currentSessionId) {
          // No session, go back to upload
          goToStep('upload')
          return null
        }

        return (
          <ValidationStatus
            sessionId={currentSessionId}
            onValidationComplete={handleValidationComplete}
          />
        )

      case 'phenotype':
        if (!currentSessionId) {
          goToStep('upload')
          return null
        }

        // TODO: Implement PhenotypeEntry component
        return (
          <div className="flex items-center justify-center min-h-[400px] p-8">
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold">Phenotype Entry</h2>
              <p className="text-muted-foreground">
                Enter patient phenotype information (HPO terms)
              </p>
              <p className="text-sm text-muted-foreground">
                This step is coming soon. For now, click continue to proceed.
              </p>
              <Button onClick={handlePhenotypeComplete} size="lg">
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue to Analysis
              </Button>
            </div>
          </div>
        )

      case 'analysis':
        if (!currentSessionId) {
          goToStep('upload')
          return null
        }

        // Show QC metrics if available, otherwise show results
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

        // Show variants list directly
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

      default:
        return null
    }
  }

  return <div className="min-h-screen">{renderContent()}</div>
}
