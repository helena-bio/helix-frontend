"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { PanelLeftClose, ChevronRight, ChevronDown, Search, X } from 'lucide-react'
import { docsNavigation, type NavItem } from './docsNavigation'
import { docsSearchIndex, type SearchEntry } from './docsSearchIndex'

const SIDEBAR_MIN = 256
const SIDEBAR_MAX = 480
const SIDEBAR_COLLAPSED = 40

interface SearchResult {
  entry: SearchEntry
  snippet: string
  matchType: 'title' | 'content'
}

function searchDocs(query: string): SearchResult[] {
  if (!query || query.trim().length < 2) return []
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 2)
  if (terms.length === 0) return []

  const results: SearchResult[] = []

  for (const entry of docsSearchIndex) {
    const titleLower = entry.title.toLowerCase()
    const contentLower = entry.content.toLowerCase()

    const titleMatch = terms.some((t) => titleLower.includes(t))
    const contentMatch = terms.some((t) => contentLower.includes(t))

    if (!titleMatch && !contentMatch) continue

    let snippet = ''
    if (contentMatch) {
      let bestIdx = -1
      let bestTerm = terms[0]
      for (const term of terms) {
        const idx = contentLower.indexOf(term)
        if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
          bestIdx = idx
          bestTerm = term
        }
      }
      if (bestIdx !== -1) {
        const start = Math.max(0, bestIdx - 30)
        const end = Math.min(entry.content.length, bestIdx + bestTerm.length + 50)
        snippet = (start > 0 ? '...' : '') + entry.content.slice(start, end) + (end < entry.content.length ? '...' : '')
      }
    }

    results.push({
      entry,
      snippet,
      matchType: titleMatch ? 'title' : 'content',
    })
  }

  results.sort((a, b) => {
    if (a.matchType === 'title' && b.matchType !== 'title') return -1
    if (a.matchType !== 'title' && b.matchType === 'title') return 1
    return 0
  })

  return results.slice(0, 15)
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 2)
  const regex = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        terms.some((t) => part.toLowerCase() === t) ? (
          <span key={i} className="text-primary font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function DocsSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_MIN)
  const [searchQuery, setSearchQuery] = useState('')
  const sidebarRef = useRef<HTMLElement>(null)
  const isResizing = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const searchResults = useMemo(() => searchDocs(searchQuery), [searchQuery])
  const showResults = searchQuery.trim().length >= 2

  const handleResultClick = (href: string) => {
    const q = searchQuery.trim()
    setSearchQuery('')
    router.push(q.length >= 2 ? `${href}?q=${encodeURIComponent(q)}` : href)
  }

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const startX = e.clientX
    const startWidth = sidebarRef.current?.offsetWidth ?? SIDEBAR_MIN

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current || !sidebarRef.current) return
      const delta = moveEvent.clientX - startX
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + delta))
      sidebarRef.current.style.width = `${newWidth}px`
    }

    const handleMouseUp = () => {
      if (!isResizing.current) return
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (sidebarRef.current) {
        setSidebarWidth(sidebarRef.current.offsetWidth)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  const handleCollapsedClick = () => {
    if (!isOpen) setIsOpen(true)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!isOpen) setIsOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <aside
      ref={sidebarRef}
      className={`h-full flex flex-col bg-card border-r border-border shrink-0 overflow-hidden relative ${
        !isOpen ? 'cursor-pointer hover:bg-accent/50' : ''
      }`}
      style={{
        width: isOpen ? `${sidebarWidth}px` : `${SIDEBAR_COLLAPSED}px`,
        transition: isResizing.current ? 'none' : 'width 300ms',
      }}
      onClick={!isOpen ? handleCollapsedClick : undefined}
    >
      {isOpen ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-2 pt-2 pb-0 shrink-0">
            <Link
              href="/docs"
              className="flex-1 px-2 text-md font-semibold text-foreground hover:text-primary transition-colors"
            >
              Documentation
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors shrink-0"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-2 pt-2 pb-1 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-16 text-sm bg-muted/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
              />
              {searchQuery ? (
                <button
                  onClick={() => { setSearchQuery(''); searchInputRef.current?.focus() }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50 font-mono pointer-events-none">
                  Ctrl+K
                </span>
              )}
            </div>
          </div>

          {/* Content area: search results OR navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {showResults ? (
              /* Search results inline */
              searchResults.length > 0 ? (
                <div className="space-y-1">
                  <p className="px-3 py-1 text-xs text-muted-foreground/70">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </p>
                  {searchResults.map((result) => (
                    <button
                      key={result.entry.href}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                      onClick={() => handleResultClick(result.entry.href)}
                    >
                      <p className="text-md font-medium text-foreground leading-tight">
                        <HighlightedText text={result.entry.title} query={searchQuery} />
                      </p>
                      <p className="text-tiny text-muted-foreground/60 mt-0.5">{result.entry.section}</p>
                      {result.snippet && (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          <HighlightedText text={result.snippet} query={searchQuery} />
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-6 text-sm text-muted-foreground text-center">No results</p>
              )
            ) : (
              /* Full navigation tree */
              docsNavigation.map((section, index) => (
                <SidebarSection
                  key={section.href}
                  section={section}
                  pathname={pathname}
                  defaultOpen={index === 0}
                />
              ))
            )}
          </nav>
        </div>
      ) : (
        <div className="flex flex-col items-center h-full">
          <div className="px-1 pt-3 shrink-0">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors z-50"
          onMouseDown={handleResizeStart}
        />
      )}

      <style>{`@keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </aside>
  )
}

function SidebarSection({
  section,
  pathname,
  defaultOpen = false,
}: {
  section: NavItem
  pathname: string
  defaultOpen?: boolean
}) {
  const isActive = pathname === section.href
  const hasChildren = section.children && section.children.length > 0
  const isChildActive = hasChildren && section.children!.some((child) => pathname === child.href)
  const isSectionActive = isActive || isChildActive
  const [isOpen, setIsOpen] = useState(isSectionActive || defaultOpen)

  useEffect(() => {
    if (isSectionActive) setIsOpen(true)
  }, [isSectionActive])

  if (!hasChildren) {
    return (
      <Link
        href={section.href}
        className={`block px-3 py-1.5 text-md rounded-md transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        {section.title}
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-1.5 text-md rounded-md transition-colors ${
          isSectionActive
            ? 'text-foreground font-medium'
            : 'text-foreground hover:bg-muted/50'
        }`}
      >
        <span>{section.title}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            !isOpen ? '-rotate-90' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="ml-3 pl-3 border-l border-border mt-0.5 space-y-0.5">
          <Link
            href={section.href}
            className={`block px-3 py-1.5 text-md rounded-md transition-colors ${
              isActive
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Overview
          </Link>
          {section.children!.map((child) => {
            const childActive = pathname === child.href
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`block px-3 py-1.5 text-md rounded-md transition-colors ${
                  childActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {child.title}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
