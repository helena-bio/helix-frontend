"use client"

/**
 * ContextPanel - Right panel wrapper for module-specific content
 * Displays different content based on active module
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
      "flex-1 overflow-y-auto bg-background",
      className
    )}>
      {children}
    </div>
  )
}
