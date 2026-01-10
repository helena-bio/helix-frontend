"use client"

/**
 * LeftPanel - Sidebar + Chat container (50% of screen)
 * Sidebar: Collapsible to icon-only mode (64px collapsed, 256px expanded)
 * Chat: Takes remaining space (flex-1)
 */

import { Sidebar } from '@/components/navigation/Sidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'

export function LeftPanel() {
  return (
    <div className="w-[50%] h-full flex bg-background">
      {/* Sidebar - Has its own right border */}
      <Sidebar />

      {/* Chat Panel - Takes remaining space */}
      <div className="flex-1 h-full">
        <ChatPanel />
      </div>
    </div>
  )
}
