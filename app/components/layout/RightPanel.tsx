"use client"

/**
 * RightPanel - View Panel
 * Three modes:
 * 1. Module View: Shows ModuleRouter (default)
 * 2. Variant Detail View: Shows VariantDetailPanel (when variant selected)
 * 3. Publication Detail View: Shows PublicationDetailPanel (when publication selected)
 *
 * Width controlled by parent SplitView.
 */

import { ReactNode } from 'react'
import { useSession } from '@/contexts/SessionContext'
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
  } = useSession()

  // Show PublicationDetailPanel if publication is selected
  if (isDetailsOpen && selectedPublicationId) {
    return (
      <div className="h-full min-w-0 overflow-y-auto [scrollbar-gutter:stable]">
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
      <div className="h-full min-w-0 overflow-y-auto [scrollbar-gutter:stable]">
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
    <div className="h-full min-w-0 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] bg-background">
      {children}
    </div>
  )
}
