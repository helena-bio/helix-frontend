"use client"

/**
 * RightPanel - View Panel (55% of screen)
 * Two modes:
 * 1. Module View: Shows ModuleRouter (default)
 * 2. Detail View: Shows VariantDetailPanel (when variant selected)
 */

import { ReactNode } from 'react'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { VariantDetailPanel } from '@/components/analysis'

interface RightPanelProps {
  children: ReactNode
}

export function RightPanel({ children }: RightPanelProps) {
  const { currentSessionId, selectedVariantId, isDetailsOpen, closeDetails } = useAnalysis()

  // Show VariantDetailPanel if variant is selected and details panel is open
  if (isDetailsOpen && selectedVariantId && currentSessionId) {
    return (
      <div className="w-[55%] h-full flex flex-col bg-background">
        <VariantDetailPanel
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
