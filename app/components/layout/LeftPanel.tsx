"use client"
/**
 * LeftPanel - Chat container (45% of screen)
 * Sidebar is now at layout level, always visible.
 * This panel contains only the ChatPanel.
 */
import { ChatPanel } from '@/components/chat/ChatPanel'

export function LeftPanel() {
  return (
    <div className="w-[45%] h-full flex bg-background">
      <div className="flex-1 h-full">
        <ChatPanel />
      </div>
    </div>
  )
}
