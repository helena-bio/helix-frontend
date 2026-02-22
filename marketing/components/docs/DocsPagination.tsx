"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { docsNavigation, type NavItem } from './docsNavigation'

// Build flat ordered list of all pages
function getFlatPages(): NavItem[] {
  const pages: NavItem[] = []
  for (const section of docsNavigation) {
    pages.push({ title: section.title, href: section.href })
    if (section.children) {
      for (const child of section.children) {
        pages.push(child)
      }
    }
  }
  return pages
}

const flatPages = getFlatPages()

export function DocsPagination() {
  const pathname = usePathname()
  const currentIndex = flatPages.findIndex((p) => p.href === pathname)

  if (currentIndex === -1) return null

  const prev = currentIndex > 0 ? flatPages[currentIndex - 1] : null
  const next = currentIndex < flatPages.length - 1 ? flatPages[currentIndex + 1] : null

  if (!prev && !next) return null

  return (
    <nav className="flex items-center justify-between border-t border-border pt-4 mt-6 mb-8">
      {prev ? (
        <Link
          href={prev.href}
          className="flex items-center gap-2 text-md text-muted-foreground hover:text-primary transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <div className="text-right">
            <p className="font-medium">{prev.title}</p>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="flex items-center gap-2 text-md text-muted-foreground hover:text-primary transition-colors group text-right"
        >
          <div>
            <p className="font-medium">{next.title}</p>
          </div>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
