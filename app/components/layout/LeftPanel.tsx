"use client"

/**
 * LeftPanel - Sidebar + Chat container (40% of screen)
 * Sidebar: Collapsible navigation (64px when open)
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
      {/* Sidebar - Collapsible with animation */}
      <div
        className={cn(
          "h-full border-r border-border transition-all duration-300 ease-in-out overflow-hidden",
          isSidebarOpen ? "w-64" : "w-0"
        )}
      >
        <div className="w-64 h-full">
          <Sidebar />
        </div>
      </div>

      {/* Chat Panel - Takes remaining space */}
      <div className="flex-1 h-full">
        <ChatPanel />
      </div>
    </div>
  )
}
