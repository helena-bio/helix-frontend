/**
 * Authenticated Layout
 * Main layout for authenticated app with Sidebar + JourneyPanel
 */

'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/navigation/Sidebar'
import { JourneyPanel } from '@/components/navigation/JourneyPanel'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { cn } from '@helix/shared/lib/utils'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isSidebarOpen } = useAnalysis()
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('helix_auth_token')
    if (!token) {
      // Not authenticated - redirect to login
      router.push('/login')
    }
  }, [router])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Main container with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Journey Panel */}
          <JourneyPanel />

          {/* Content */}
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
