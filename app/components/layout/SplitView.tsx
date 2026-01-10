"use client"

/**
 * SplitView - Fixed 40/60 split layout
 * Left: Sidebar + Chat (40%)
 * Right: View Panel (60%)
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
    <div className="flex h-full overflow-hidden">
      {/* Left Panel - Sidebar + Chat (40%) */}
      <LeftPanel />

      {/* Right Panel - View Panel (60%) */}
      <RightPanel>
        {children}
      </RightPanel>
    </div>
  )
}
