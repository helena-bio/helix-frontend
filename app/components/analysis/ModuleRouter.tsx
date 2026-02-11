"use client"

/**
 * ModuleRouter - Routes to different module views based on selectedModule
 * Used in analysis page to display different content in View Panel (60%)
 */

import { useSession } from '@/contexts/SessionContext'
import { VariantAnalysisView } from './VariantAnalysisView'
import { ClinicalScreeningView } from '@/components/screening'
import { PhenotypeMatchingView } from '@/components/phenotype/PhenotypeMatchingView'
import { LiteratureMatchingView } from '@/components/literature/LiteratureMatchingView'
import { ClinicalReportView } from '@/components/report/ClinicalReportView'

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
    return <ClinicalScreeningView sessionId={sessionId} />
  }

  // Phenotype Matching
  if (selectedModule === 'phenotype') {
    return <PhenotypeMatchingView sessionId={sessionId} />
  }

  // Literature Analysis
  if (selectedModule === 'literature') {
    return <LiteratureMatchingView sessionId={sessionId} />
  }

  // Clinical Report
  if (selectedModule === 'report') {
    return <ClinicalReportView sessionId={sessionId} />
  }

  // Fallback - should not reach here with current modules
  return <VariantAnalysisView sessionId={sessionId} />
}
