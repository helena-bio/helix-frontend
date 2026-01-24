"use client"

/**
 * RightPanel - View Panel (55% of screen)
 * Three modes:
 * 1. Module View: Shows ModuleRouter (default)
 * 2. Variant Detail View: Shows VariantDetailPanel (when variant selected)
 * 3. Publication Detail View: Shows PublicationDetailPanel (when publication selected)
 */

import { ReactNode } from 'react'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { VariantDetailPanel } from '@/components/analysis'
import { PublicationDetailPanel } from '@/components/chat'

interface RightPanelProps {
  children: ReactNode
}

export function RightPanel({ children }: RightPanelProps) {
  const {
    currentSessionId,
    selectedVariantId,
    selectedPublicationId,
    isDetailsOpen,
    closeDetails,
  } = useAnalysis()

  // Show PublicationDetailPanel if publication is selected
  if (isDetailsOpen && selectedPublicationId) {
    return (
      <div className="w-[55%] h-full">
        <PublicationDetailPanel
          key={`publication-${selectedPublicationId}`}
          pmid={selectedPublicationId}
          onBack={closeDetails}
        />
      </div>
    )
  }

  // Show VariantDetailPanel if variant is selected and details panel is open
  if (isDetailsOpen && selectedVariantId && currentSessionId) {
    return (
      <div className="w-[55%] h-full">
        <VariantDetailPanel
          key={`variant-${selectedVariantId}`}
          sessionId={currentSessionId}
          variantIdx={parseInt(selectedVariantId)}
          onBack={closeDetails}
        />
      </div>
    )
  }

  // Default: Show module content (ModuleRouter)
  return (
    <div className="w-[55%] h-full overflow-y-auto bg-background">
      {children}
    </div>
  )
}
