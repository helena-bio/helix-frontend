"use client"

/**
 * ModuleRouter - Routes to different module views based on selectedModule
 * Used in analysis page to display different content in View Panel (60%)
 */

import { useAnalysis } from '@/contexts/AnalysisContext'
import { AnalysisJourneyView } from './AnalysisJourneyView'

interface ModuleRouterProps {
  sessionId: string
}

export function ModuleRouter({ sessionId }: ModuleRouterProps) {
  const { selectedModule } = useAnalysis()

  // Default view: Variant Analysis
  if (!selectedModule || selectedModule === 'analysis') {
    return <AnalysisJourneyView sessionId={sessionId} />
  }

  // VUS Prioritization
  if (selectedModule === 'vus') {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">VUS Prioritization</h1>
          <p className="text-base text-muted-foreground">
            This module will help prioritize Variants of Unknown Significance using AI-powered analysis.
          </p>
          <div className="mt-8 p-6 bg-muted rounded-lg">
            <p className="text-md font-medium">Coming soon...</p>
            <p className="text-sm text-muted-foreground mt-2">
              This feature is under development.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Phenotype Matching
  if (selectedModule === 'phenotype') {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Phenotype Matching</h1>
          <p className="text-base text-muted-foreground">
            Match variants to patient phenotypes using HPO terms and semantic similarity.
          </p>
          <div className="mt-8 p-6 bg-muted rounded-lg">
            <p className="text-md font-medium">Coming soon...</p>
            <p className="text-sm text-muted-foreground mt-2">
              This feature is under development.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Literature Analysis
  if (selectedModule === 'literature') {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Literature Analysis</h1>
          <p className="text-base text-muted-foreground">
            Automated literature mining and evidence extraction for variant interpretation.
          </p>
          <div className="mt-8 p-6 bg-muted rounded-lg">
            <p className="text-md font-medium">Coming soon...</p>
            <p className="text-sm text-muted-foreground mt-2">
              This feature is under development.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // False Positive Filter
  if (selectedModule === 'fpf') {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">False Positive Filter</h1>
          <p className="text-base text-muted-foreground">
            ML-powered filtering to identify and remove sequencing artifacts.
          </p>
          <div className="mt-8 p-6 bg-muted rounded-lg">
            <p className="text-md font-medium">Coming soon...</p>
            <p className="text-sm text-muted-foreground mt-2">
              This feature is under development.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Guidelines Tracker
  if (selectedModule === 'guidelines') {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Guidelines Tracker</h1>
          <p className="text-base text-muted-foreground">
            Track guideline changes and receive notifications for variant reclassifications.
          </p>
          <div className="mt-8 p-6 bg-muted rounded-lg">
            <p className="text-md font-medium">Coming soon...</p>
            <p className="text-sm text-muted-foreground mt-2">
              This feature is under development.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return <AnalysisJourneyView sessionId={sessionId} />
}
