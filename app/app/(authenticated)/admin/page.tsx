"use client"

/**
 * Admin Page
 *
 * Organization-level admin panel.
 * Layout matches Platform: centered max-w-5xl, left text nav, right content.
 * Only accessible by users with admin role.
 *
 * Sections:
 * - Organization: org details and settings
 * - Team Members: member management and invitations
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@helix/shared/lib/utils'
import { OrganizationContent } from '@/components/admin/OrganizationView'
import { TeamMembersContent } from '@/components/admin/TeamMembersView'

type Section = 'organization' | 'team'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'organization', label: 'Organization' },
  { id: 'team', label: 'Team Members' },
]

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeSection, setActiveSection] = useState<Section>('organization')

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-semibold text-foreground mb-8">Admin</h2>

        <div className="flex gap-8">
          {/* Left navigation */}
          <nav className="w-44 shrink-0 space-y-1">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-base transition-colors",
                  activeSection === section.id
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {/* Right content */}
          <div className="flex-1 min-w-0">
            {activeSection === 'organization' && <OrganizationContent />}
            {activeSection === 'team' && <TeamMembersContent />}
          </div>
        </div>
      </div>
    </div>
  )
}
