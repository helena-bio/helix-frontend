/**
 * Authenticated Layout
 * Conditional: Full width before analysis / Split screen after analysis
 */

'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/navigation/Sidebar'
import { JourneyPanel } from '@/components/navigation/JourneyPanel'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { ContextPanel } from '@/components/layout/ContextPanel'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { useJourney } from '@/contexts/JourneyContext'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isChatVisible, showChat } = useAnalysis()
  const { currentStep } = useJourney()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  const isAnalysisComplete = currentStep === 'analysis'

  useEffect(() => {
    if (isAnalysisComplete) {
      showChat()
    }
  }, [isAnalysisComplete, showChat])

  useEffect(() => {
    const token = localStorage.getItem('helix_auth_token')

    if (!token) {
      router.push('/login')
    } else {
      setIsChecking(false)
    }
  }, [router])

  if (isChecking) {
    return null
  }

  const shouldShowSplitScreen = isChatVisible && isAnalysisComplete

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - Journey Panel with Logo */}
      <header className="h-14 border-b border-border bg-card shrink-0 sticky top-0 z-50">
        <JourneyPanel />
      </header>

      {/* Main area - Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        {shouldShowSplitScreen ? (
          // Split Screen: Chat + Context Panel (50/50 split of remaining space)
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Panel - Hidden on small screens */}
            <div className="hidden lg:flex lg:flex-1 h-full flex-col border-r">
              <ChatPanel />
            </div>

            {/* Context Panel - Always visible, takes remaining space */}
            <div className="flex-1 h-full">
              <ContextPanel>
                {children}
              </ContextPanel>
            </div>
          </div>
        ) : (
          // Full Width: Pre-analysis workflow
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        )}
      </div>
    </div>
  )
}
