'use client'

import { usePathname } from 'next/navigation'
import { docsNavigation, type NavItem } from '@/components/docs/docsNavigation'
import { JsonLd } from './JsonLd'

const BASE_URL = 'https://helena.bio'

function findBreadcrumbTrail(path: string): { name: string; href: string }[] {
  const trail: { name: string; href: string }[] = [
    { name: 'Home', href: '/' },
    { name: 'Documentation', href: '/docs' },
  ]

  if (path === '/docs') return trail

  function search(items: NavItem[], target: string): boolean {
    for (const item of items) {
      if (item.href === target) {
        trail.push({ name: item.title, href: item.href })
        return true
      }
      if (item.children) {
        // Check if target is a child
        for (const child of item.children) {
          if (child.href === target) {
            trail.push({ name: item.title, href: item.href })
            trail.push({ name: child.title, href: child.href })
            return true
          }
        }
      }
    }
    return false
  }

  search(docsNavigation, path)
  return trail
}

export function DocsBreadcrumbJsonLd() {
  const pathname = usePathname()
  if (!pathname?.startsWith('/docs')) return null

  const trail = findBreadcrumbTrail(pathname)

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': trail.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': `${BASE_URL}${item.href}`,
    })),
  }

  return <JsonLd data={breadcrumbData} />
}
