/**
 * Authenticated Layout
 * Conditional: Full width before analysis / Split screen after analysis
 */

'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Sidebar } from '@/components/navigation/Sidebar'
import { JourneyPanel } from '@/components/navigation/JourneyPanel'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { ContextPanel } from '@/components/layout/ContextPanel'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { useJourney } from '@/contexts/JourneyContext'
import { cn } from '@helix/shared/lib/utils'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isSidebarOpen, isChatVisible, showChat } = useAnalysis()
  const { currentStep } = useJourney()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  // Check if analysis is complete (show split screen)
  const isAnalysisComplete = currentStep === 'analysis'

  // DEBUG: Log state
  useEffect(() => {
    console.log('🔍 Layout Debug:', {
      currentStep,
      isAnalysisComplete,
      isChatVisible,
    })
  }, [currentStep, isAnalysisComplete, isChatVisible])

  // Auto-show chat when analysis completes
  useEffect(() => {
    if (isAnalysisComplete) {
      console.log('✅ Analysis complete! Showing chat...')
      showChat()
    }
  }, [isAnalysisComplete, showChat])

  useEffect(() => {
    // Check authentication
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

  // DEBUG: Show what we're rendering
  const shouldShowSplitScreen = isChatVisible && isAnalysisComplete
  console.log('🎨 Rendering:', shouldShowSplitScreen ? 'SPLIT SCREEN' : 'FULL WIDTH')

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - Logo + Journey Panel */}
      <header className="h-14 border-b border-border bg-card flex items-center shrink-0">
        <div
          className={cn(
            'h-full flex items-center px-4 border-r border-border shrink-0 transition-all duration-300',
            isSidebarOpen ? 'w-64' : 'w-16'
          )}
        >
          {isSidebarOpen ? (
            <Link href="/" className="flex items-center gap-1.5">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/helix%20logo-W2SpmbzgUEDwJyPjRhIvWwSfESe6Aq.png"
                alt="Helix Insight"
                width={140}
                height={40}
                className="h-8 w-auto"
              />
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bulb-KpLU35CozLLzkwRErx9HXQNX4gHefR.png"
                alt=""
                width={28}
                height={35}
                className="h-7 w-auto"
              />
            </Link>
          ) : (
            <Link href="/" className="flex items-center justify-center w-full">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bulb-KpLU35CozLLzkwRErx9HXQNX4gHefR.png"
                alt="Helix Insight"
                width={28}
                height={35}
                className="h-7 w-auto"
              />
            </Link>
          )}
        </div>

        <div className="flex-1 h-full">
          <JourneyPanel />
        </div>
      </header>

      {/* Main area - Sidebar + Content (conditional split) */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        {/* Content Area - CONDITIONAL RENDERING */}
        {shouldShowSplitScreen ? (
          // SPLIT SCREEN: Chat + Context Panel
          <>
            <div className="w-[40%] h-full border-r border-border">
              <ChatPanel />
            </div>
            <div className="flex-1 h-full">
              <ContextPanel>
                {children}
              </ContextPanel>
            </div>
          </>
        ) : (
          // FULL WIDTH: Pre-analysis workflow
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        )}
      </div>
    </div>
  )
}
