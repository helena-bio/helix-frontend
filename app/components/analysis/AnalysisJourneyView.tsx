"use client"

/**
 * AnalysisJourneyView - Analysis results with variant detail switching
 * Shows summary + variants list by default
 * Switches to variant detail panel when user clicks on a variant
 */

import { useState } from 'react'
import { AnalysisSummary } from './AnalysisSummary'
import { VariantsList } from './VariantsList'
import { VariantDetailPanel } from './VariantDetailPanel'
import { Card } from '@/components/ui/card'

interface AnalysisJourneyViewProps {
  sessionId: string
}

export function AnalysisJourneyView({ sessionId }: AnalysisJourneyViewProps) {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null)

  if (selectedVariantIdx !== null) {
    // Variant detail view - full screen
    return (
      <Card className="h-full flex flex-col">
        <VariantDetailPanel
          sessionId={sessionId}
          variantIdx={selectedVariantIdx}
          onBack={() => setSelectedVariantIdx(null)}
        />
      </Card>
    )
  }

  // Default view - Summary + Variants list
  return (
    <div className="p-6 space-y-6">
      <AnalysisSummary sessionId={sessionId} />
      <VariantsList 
        sessionId={sessionId}
        onVariantClick={(variantIdx) => setSelectedVariantIdx(variantIdx)}
      />
    </div>
  )
}
