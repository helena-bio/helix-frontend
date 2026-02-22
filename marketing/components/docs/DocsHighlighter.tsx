"use client"

import { useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const HIGHLIGHT_CLASS = 'docs-search-highlight'
const HIGHLIGHT_STYLE = 'background-color: rgba(var(--primary-rgb, 180, 140, 60), 0.25); border-radius: 2px; padding: 1px 0;'

function clearHighlights(container: HTMLElement) {
  const marks = container.querySelectorAll(`.${HIGHLIGHT_CLASS}`)
  marks.forEach((mark) => {
    const parent = mark.parentNode
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark)
      parent.normalize()
    }
  })
}

function highlightText(container: HTMLElement, query: string): HTMLElement | null {
  if (!query || query.length < 2) return null

  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 2)
  if (terms.length === 0) return null

  let firstMatch: HTMLElement | null = null
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null)

  const nodesToProcess: { node: Text; matches: { start: number; end: number }[] }[] = []

  let node: Text | null
  while ((node = walker.nextNode() as Text | null)) {
    const text = node.textContent || ''
    const lower = text.toLowerCase()
    const matches: { start: number; end: number }[] = []

    for (const term of terms) {
      let idx = lower.indexOf(term)
      while (idx !== -1) {
        matches.push({ start: idx, end: idx + term.length })
        idx = lower.indexOf(term, idx + 1)
      }
    }

    if (matches.length > 0) {
      matches.sort((a, b) => a.start - b.start)
      const merged: { start: number; end: number }[] = [matches[0]]
      for (let i = 1; i < matches.length; i++) {
        const last = merged[merged.length - 1]
        if (matches[i].start <= last.end) {
          last.end = Math.max(last.end, matches[i].end)
        } else {
          merged.push(matches[i])
        }
      }
      nodesToProcess.push({ node, matches: merged })
    }
  }

  for (let i = nodesToProcess.length - 1; i >= 0; i--) {
    const { node: textNode, matches: merged } = nodesToProcess[i]
    const text = textNode.textContent || ''
    const parent = textNode.parentNode
    if (!parent) continue

    const fragment = document.createDocumentFragment()
    let lastEnd = 0

    for (const m of merged) {
      if (m.start > lastEnd) {
        fragment.appendChild(document.createTextNode(text.slice(lastEnd, m.start)))
      }
      const mark = document.createElement('mark')
      mark.className = HIGHLIGHT_CLASS
      mark.setAttribute('style', HIGHLIGHT_STYLE)
      mark.textContent = text.slice(m.start, m.end)
      fragment.appendChild(mark)
      if (!firstMatch) firstMatch = mark
      lastEnd = m.end
    }

    if (lastEnd < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastEnd)))
    }

    parent.replaceChild(fragment, textNode)
  }

  return firstMatch
}

function HighlighterInner({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    clearHighlights(container)

    if (query) {
      const timer = setTimeout(() => {
        const firstMatch = highlightText(container, query)
        if (firstMatch) {
          firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [query, containerRef])

  return null
}

export function DocsHighlighter({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef}>
      <Suspense fallback={null}>
        <HighlighterInner containerRef={containerRef} />
      </Suspense>
      {children}
    </div>
  )
}
