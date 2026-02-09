"use client"
/**
 * LeftPanel - Chat container
 * Sidebar is now at layout level, always visible.
 * This panel contains only the ChatPanel.
 * Width controlled by parent SplitView.
 */
import { ChatPanel } from '@/components/chat/ChatPanel'

export function LeftPanel() {
  return (
    <div className="h-full flex min-w-0 bg-background">
      <div className="flex-1 h-full">
        <ChatPanel />
      </div>
    </div>
  )
}
