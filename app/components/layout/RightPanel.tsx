"use client"

/**
 * RightPanel - View Panel (50% of screen, always visible)
 * Displays selected module content:
 * - Variant Analysis
 * - VUS Prioritization
 * - Phenotype Matching
 * - Literature Analysis
 * - False Positive Filter
 * - Guidelines Tracker
 */

import { ReactNode } from 'react'

interface RightPanelProps {
  children: ReactNode
}

export function RightPanel({ children }: RightPanelProps) {
  return (
    <div className="w-[50%] h-full overflow-y-auto bg-background">
      {children}
    </div>
  )
}
