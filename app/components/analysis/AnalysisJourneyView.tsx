"use client"

/**
 * AnalysisJourneyView - Main analysis interface with chat and context panel
 * Supports switching between chat view and variant detail view
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { AnalysisSummary } from './AnalysisSummary'
import { VariantsList } from './VariantsList'
import { VariantDetailPanel } from './VariantDetailPanel'

interface AnalysisJourneyViewProps {
  sessionId: string
}

export function AnalysisJourneyView({ sessionId }: AnalysisJourneyViewProps) {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-8rem)]">
      {/* Left Panel - Chat (40%) */}
      <div className="lg:col-span-2 flex flex-col">
        <Card className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-base">Chat interface coming soon...</p>
          </div>
        </Card>
      </div>

      {/* Right Panel - Context (60%) */}
      <div className="lg:col-span-3 flex flex-col gap-6 overflow-auto">
        {selectedVariantIdx !== null ? (
          /* Variant Detail View */
          <Card className="flex-1 flex flex-col">
            <VariantDetailPanel
              sessionId={sessionId}
              variantIdx={selectedVariantIdx}
              onBack={() => setSelectedVariantIdx(null)}
            />
          </Card>
        ) : (
          /* Default View - Summary + Variants */
          <>
            <AnalysisSummary sessionId={sessionId} />
            <VariantsList 
              sessionId={sessionId}
              onVariantClick={(variantIdx) => setSelectedVariantIdx(variantIdx)}
            />
          </>
        )}
      </div>
    </div>
  )
}
