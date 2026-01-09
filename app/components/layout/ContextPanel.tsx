"use client"

/**
 * ContextPanel - Right panel wrapper for module-specific content
 * Provides scrollable area for content
 */

import { ReactNode } from 'react'
import { cn } from '@helix/shared/lib/utils'

interface ContextPanelProps {
  children: ReactNode
  className?: string
}

export function ContextPanel({ children, className }: ContextPanelProps) {
  return (
    <div className={cn(
      "h-full overflow-y-auto overflow-x-hidden bg-background",
      "[scrollbar-gutter:stable]",
      className
    )}>
      {children}
    </div>
  )
}
