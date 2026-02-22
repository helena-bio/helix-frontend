"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { docsNavigation, type NavItem } from './docsNavigation'

export function DocsSidebar() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {docsNavigation.map((section) => (
        <SidebarSection key={section.href} section={section} pathname={pathname} />
      ))}
    </nav>
  )
}

function SidebarSection({ section, pathname }: { section: NavItem; pathname: string }) {
  const isActive = pathname === section.href
  const hasChildren = section.children && section.children.length > 0
  const isChildActive = hasChildren && section.children!.some((child) => pathname === child.href)
  const [isOpen, setIsOpen] = useState(isActive || isChildActive)

  useEffect(() => {
    if (isActive || isChildActive) {
      setIsOpen(true)
    }
  }, [isActive, isChildActive])

  if (!hasChildren) {
    return (
      <Link
        href={section.href}
        className={`block px-3 py-2 text-sm rounded-md transition-colors ${
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
        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-foreground hover:bg-muted/50'
        }`}
      >
        <span>{section.title}</span>
        <ChevronRight
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="ml-3 pl-3 border-l border-border mt-1 space-y-0.5">
          <Link
            href={section.href}
            className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
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
                className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
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
