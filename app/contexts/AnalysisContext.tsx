/**
 * Analysis Context - UI State Only
 * Following Lumiere pattern: NO server data in Context
 * Server data managed by React Query
 */

'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

interface AnalysisContextType {
  // Sidebar state
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Module selection
  selectedModule: string | null
  setSelectedModule: (module: string | null) => void

  // Current session (reference only, data comes from React Query)
  currentSessionId: string | null
  setCurrentSessionId: (sessionId: string | null) => void

  // Variant selection
  selectedVariantId: string | null
  setSelectedVariantId: (variantId: string | null) => void

  // Panels
  isPhenotypePanelOpen: boolean
  openPhenotypePanel: () => void
  closePhenotypePanel: () => void

  isDetailsOpen: boolean
  openDetails: () => void
  closeDetails: () => void

  // Chat state (for split-screen layout)
  isChatVisible: boolean
  showChat: () => void
  hideChat: () => void
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined)

interface AnalysisProviderProps {
  children: ReactNode
}

export function AnalysisProvider({ children }: AnalysisProviderProps) {
  // Sidebar state - responsive default (closed on small screens)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Module selection
  const [selectedModule, setSelectedModule] = useState<string | null>(null)

  // Current session
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Variant selection
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  // Panels
  const [isPhenotypePanelOpen, setIsPhenotypePanelOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Chat visibility
  const [isChatVisible, setIsChatVisible] = useState(false)

  // Responsive sidebar - reacts to screen size changes
  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.matchMedia('(min-width: 1024px)').matches
      setIsSidebarOpen(isLargeScreen)
    }

    // Set initial state
    handleResize()

    // Listen for resize events
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Sidebar actions
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev)
  }, [])

  const setSidebarOpen = useCallback((open: boolean) => {
    setIsSidebarOpen(open)
  }, [])

  // Phenotype panel actions
  const openPhenotypePanel = useCallback(() => {
    setIsPhenotypePanelOpen(true)
  }, [])

  const closePhenotypePanel = useCallback(() => {
    setIsPhenotypePanelOpen(false)
  }, [])

  // Details panel actions
  const openDetails = useCallback(() => {
    setIsDetailsOpen(true)
  }, [])

  const closeDetails = useCallback(() => {
    setIsDetailsOpen(false)
  }, [])

  // Chat actions
  const showChat = useCallback(() => {
    setIsChatVisible(true)
  }, [])

  const hideChat = useCallback(() => {
    setIsChatVisible(false)
  }, [])

  const value: AnalysisContextType = {
    isSidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    selectedModule,
    setSelectedModule,
    currentSessionId,
    setCurrentSessionId,
    selectedVariantId,
    setSelectedVariantId,
    isPhenotypePanelOpen,
    openPhenotypePanel,
    closePhenotypePanel,
    isDetailsOpen,
    openDetails,
    closeDetails,
    isChatVisible,
    showChat,
    hideChat,
  }

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis(): AnalysisContextType {
  const context = useContext(AnalysisContext)
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider')
  }
  return context
}
