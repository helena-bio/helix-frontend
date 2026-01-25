"use client"

/**
 * ModuleRouter - Routes to different module views based on selectedModule
 * Used in analysis page to display different content in View Panel (60%)
 */

import { useSession } from '@/contexts/SessionContext'
import { VariantAnalysisView } from './VariantAnalysisView'
import { ScreeningView } from '@/components/screening/ScreeningView'
import { PhenotypeMatchingView } from '@/components/phenotype/PhenotypeMatchingView'
import { LiteratureMatchingView } from '@/components/literature/LiteratureMatchingView'

interface ModuleRouterProps {
  sessionId: string
}

export function ModuleRouter({ sessionId }: ModuleRouterProps) {
  const { selectedModule } = useSession()

  // Default view: Variant Analysis
  if (!selectedModule || selectedModule === 'analysis') {
    return <VariantAnalysisView sessionId={sessionId} />
  }

  // Clinical Screening (formerly VUS Prioritization)
  if (selectedModule === 'vus') {
    return <ScreeningView sessionId={sessionId} />
  }

  // Phenotype Matching
  if (selectedModule === 'phenotype') {
    return <PhenotypeMatchingView sessionId={sessionId} />
  }

  // Literature Analysis
  if (selectedModule === 'literature') {
    return <LiteratureMatchingView sessionId={sessionId} />
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
            <p className="text-base font-medium">Coming soon...</p>
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
            <p className="text-base font-medium">Coming soon...</p>
            <p className="text-sm text-muted-foreground mt-2">
              This feature is under development.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return <VariantAnalysisView sessionId={sessionId} />
}
