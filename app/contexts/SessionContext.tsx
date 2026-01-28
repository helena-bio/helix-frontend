/**
 * Session Context - UI State Only
 * Following Lumiere pattern: NO server data in Context
 * Server data managed by React Query
 *
 * IMPORTANT: sessionId comes from URL query params, NOT localStorage
 * URL is the source of truth for session management
 */

'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

interface SessionContextType {
  // Sidebar state
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Module selection
  selectedModule: string | null
  setSelectedModule: (module: string | null) => void

  // Current session (reference only, data comes from React Query)
  // NOTE: This is set from URL query params in the layout
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

const SessionContext = createContext<SessionContextType | undefined>(undefined)

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  // Sidebar state - responsive default (closed on small screens)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Module selection
  const [selectedModule, setSelectedModule] = useState<string | null>(null)

  // Current session - will be set from URL in authenticated layout
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Variant selection
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  // Publication selection
  const [selectedPublicationId, setSelectedPublicationId] = useState<string | null>(null)

  // Panels
  const [isPhenotypePanelOpen, setIsPhenotypePanelOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Chat visibility
  const [isChatVisible, setIsChatVisible] = useState(false)

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

  const value: SessionContextType = {
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

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}
