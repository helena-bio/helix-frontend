"use client"

/**
 * SplitView - Resizable Chat (left) + View Panel (right)
 *
 * Drag the divider to resize panels.
 * Direct DOM manipulation during drag for zero-flicker performance.
 * Commits to state on mouseup.
 *
 * Defaults: 45% left / 55% right
 * Minimums: 280px left (chat) / 360px right (variants table)
 *
 * Both panels use overflow-hidden to establish containing blocks.
 * This prevents content (e.g. markdown tables, prose) from pushing
 * flex items beyond their allocated percentage. Child components
 * handle their own scrolling (RightPanel: overflow-y-auto, etc).
 */

import { useRef, useState, useCallback } from 'react'
import { LeftPanel } from './LeftPanel'
import { RightPanel } from './RightPanel'

const LEFT_MIN_PX = 380
const LEFT_MIN_PERCENT = 30
const RIGHT_MIN_PERCENT = 55
const DEFAULT_LEFT_PERCENT = 45

interface SplitViewProps {
  children: React.ReactNode
}

export function SplitView({ children }: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const [leftPercent, setLeftPercent] = useState(DEFAULT_LEFT_PERCENT)

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const container = containerRef.current
    if (!container) return

    const startX = e.clientX
    const containerWidth = container.offsetWidth
    const startLeftWidth = leftRef.current?.offsetWidth ?? containerWidth * (DEFAULT_LEFT_PERCENT / 100)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current || !leftRef.current || !rightRef.current || !container) return

      const delta = moveEvent.clientX - startX
      let newLeftWidth = startLeftWidth + delta
      const containerWidth = container.offsetWidth

      // Enforce minimums (both pixel and percentage)
      const leftMinWidth = Math.max(LEFT_MIN_PX, containerWidth * (LEFT_MIN_PERCENT / 100))
      const rightMinWidth = containerWidth * (RIGHT_MIN_PERCENT / 100)
      newLeftWidth = Math.max(leftMinWidth, newLeftWidth)
      newLeftWidth = Math.min(containerWidth - rightMinWidth, newLeftWidth)

      const percent = (newLeftWidth / containerWidth) * 100
      leftRef.current.style.flex = `0 0 ${percent}%`
      rightRef.current.style.flex = `0 0 ${100 - percent}%`
    }

    const handleMouseUp = () => {
      if (!isResizing.current) return
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      // Commit to state
      if (leftRef.current && container) {
        const finalPercent = (leftRef.current.offsetWidth / container.offsetWidth) * 100
        setLeftPercent(finalPercent)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <div ref={containerRef} className="flex-1 flex h-full min-h-0">
      <div
        ref={leftRef}
        className="h-full min-w-0 overflow-hidden"
        style={{ flex: `0 0 ${leftPercent}%` }}
      >
        <LeftPanel />
      </div>

      {/* Resize handle */}
      <div
        className="w-1 h-full cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors shrink-0 z-10"
        onMouseDown={handleResizeStart}
      />

      <div
        ref={rightRef}
        className="h-full min-w-0 overflow-hidden"
        style={{ flex: `0 0 ${100 - leftPercent}%` }}
      >
        <RightPanel>
          {children}
        </RightPanel>
      </div>
    </div>
  )
}
