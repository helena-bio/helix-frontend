"use client"

/**
 * LeftPanel - Sidebar + Chat container (40% of screen)
 * Sidebar: Collapsible to icon-only mode (64px collapsed, 256px expanded)
 * Chat: Takes remaining space (flex-1)
 */

import { Sidebar } from '@/components/navigation/Sidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { cn } from '@helix/shared/lib/utils'

export function LeftPanel() {
  const { isSidebarOpen } = useAnalysis()

  return (
    <div className="w-[40%] h-full flex border-r border-border bg-background">
      {/* Sidebar - Collapsible with animation (64px collapsed, 256px expanded) */}
      <div
        className={cn(
          "h-full border-r border-border transition-all duration-300 ease-in-out shrink-0",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <Sidebar />
      </div>

      {/* Chat Panel - Takes remaining space */}
      <div className="flex-1 h-full">
        <ChatPanel />
      </div>
    </div>
  )
}
