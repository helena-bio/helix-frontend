"use client"

/**
 * SplitView - Fixed 50/50 split layout
 * Left: Sidebar + Chat (50%)
 * Right: View Panel (50%)
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
      {/* Left Panel - Sidebar + Chat (50%) */}
      <LeftPanel />

      {/* Right Panel - View Panel (50%) */}
      <RightPanel>
        {children}
      </RightPanel>
    </div>
  )
}
