"use client"

/**
 * Analysis Page - Main Variant Analysis Workflow
 * After analysis complete, shows in ContextPanel (right side of split screen)
 */

import { useState, useCallback } from 'react'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { useJourney } from '@/contexts/JourneyContext'
import { useSession } from '@/hooks/queries'
import {
  UploadValidationFlow,
  PhenotypeEntry,
  ProcessingFlow,
  AnalysisSummary,
  VariantsList
} from '@/components/analysis'
import { Button } from '@/components/ui/button'
import { Loader2, RotateCcw } from 'lucide-react'

export default function AnalysisPage() {
  const { currentSessionId, setCurrentSessionId } = useAnalysis()
  const { currentStep, resetJourney } = useJourney()

  // Filter state for passing from Summary to VariantsList
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  // Session query for data
  const sessionQuery = useSession(currentSessionId || '', {
    enabled: !!currentSessionId,
  })

  // Handle upload+validation complete
  const handleUploadValidationComplete = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  // Handle start over
  const handleStartOver = () => {
    setCurrentSessionId(null)
    setActiveFilter(null)
    resetJourney()
  }

  // Handle filter from summary
  const handleFilterByClass = useCallback((acmgClass: string) => {
    setActiveFilter(acmgClass)
    // Scroll to variants list
    const variantsSection = document.getElementById('variants-section')
    if (variantsSection) {
      variantsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

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

      // ANALYSIS VIEW - Optimized for ContextPanel (right side)
      return (
        <div className="h-full overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Compact Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Analysis Results</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {sessionQuery.data?.vcf_file_path?.split('/').pop() || 'VCF Analysis'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleStartOver}>
                <RotateCcw className="h-4 w-4 mr-2" />
                <span className="text-sm">New Analysis</span>
              </Button>
            </div>

            {/* Summary Section */}
            <AnalysisSummary
              sessionId={currentSessionId}
              onFilterByClass={handleFilterByClass}
            />

            {/* Variants Section */}
            <div id="variants-section">
              <VariantsList
                sessionId={currentSessionId}
              />
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  return <div className="min-h-screen">{renderContent()}</div>
}
