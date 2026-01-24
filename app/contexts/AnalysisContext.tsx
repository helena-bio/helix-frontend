/**
 * Analysis Context - UI State Only
 * Following Lumiere pattern: NO server data in Context
 * Server data managed by React Query
 *
 * IMPORTANT: sessionId is persisted to localStorage to survive page refresh
 */

'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

const STORAGE_KEY = 'helix_current_session'

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

  // Publication selection (from chat literature results)
  selectedPublicationId: string | null
  setSelectedPublicationId: (pmid: string | null) => void

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

  // Current session - initialized from localStorage
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Variant selection
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  // Publication selection
  const [selectedPublicationId, setSelectedPublicationId] = useState<string | null>(null)

  // Panels
  const [isPhenotypePanelOpen, setIsPhenotypePanelOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Chat visibility
  const [isChatVisible, setIsChatVisible] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.sessionId) {
          setCurrentSessionIdState(parsed.sessionId)
        }
      } catch (e) {
        console.error('Failed to parse stored session:', e)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsHydrated(true)
  }, [])

  // Persist sessionId to localStorage
  const setCurrentSessionId = useCallback((sessionId: string | null) => {
    setCurrentSessionIdState(sessionId)
    if (sessionId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Responsive sidebar - matches xl breakpoint (1280px)
  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.matchMedia('(min-width: 1280px)').matches
      setIsSidebarOpen(isLargeScreen)
    }

    handleResize()
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
    setSelectedVariantId(null)
    setSelectedPublicationId(null)
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
    selectedPublicationId,
    setSelectedPublicationId,
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

  // Don't render children until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return null
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
