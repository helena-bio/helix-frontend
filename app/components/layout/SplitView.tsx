"use client"

/**
 * SplitView - Fixed 55/45 split layout
 * Left: Sidebar + Chat (45%)
 * Right: View Panel (55%)
 *
 * This layout is shown ONLY after analysis workflow is complete
 */

import { ReactNode } from 'react'
import { LeftPanel } from './LeftPanel'
import { RightPanel } from './RightPanel'

interface SplitViewProps {
  children: ReactNode
}

export function SplitView({ children }: SplitViewProps) {
  return (
    <div className="flex h-full">
      {/* Left Panel - Sidebar + Chat (45%) */}
      <LeftPanel />

      {/* Right Panel - View Panel (55%) */}
      <RightPanel>
        {children}
      </RightPanel>
    </div>
  )
}
