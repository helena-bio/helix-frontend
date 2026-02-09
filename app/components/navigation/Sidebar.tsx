"use client"

/**
 * Sidebar Navigation Component
 *
 * Always visible in authenticated layout.
 * Two visual states:
 * - Expanded (resizable, min 256px / max 480px): modules, cases, user menu
 * - Collapsed (48px): Icon-only, click anywhere to expand
 *
 * Resize: drag right edge to adjust width. Uses direct DOM manipulation
 * during drag for zero-flicker performance, commits to state on mouseup.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  FolderOpen,
  Microscope,
  Shield,
  Dna,
  BookOpen,
  Settings,
  LogOut,
} from 'lucide-react'
import { Button } from '@helix/shared/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@helix/shared/components/ui/tooltip'
import { useSession } from '@/contexts/SessionContext'
import { useJourney } from '@/contexts/JourneyContext'
import { useAuth } from '@/contexts/AuthContext'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { SettingsModal } from './SettingsModal'
import { CasesList } from './CasesList'
import { cn } from '@helix/shared/lib/utils'

const SIDEBAR_MIN = 256
const SIDEBAR_MAX = 480
const SIDEBAR_COLLAPSED = 48

interface Module {
  id: string
  name: string
  icon: typeof Microscope
  checkEnabled?: () => boolean
}

export function Sidebar() {
  const {
    isSidebarOpen,
    toggleSidebar,
    selectedModule,
    setSelectedModule,
  } = useSession()

  const { currentStep } = useJourney()
  const { user, logout } = useAuth()
  const { enableScreening, enablePhenotypeMatching } = useClinicalProfileContext()

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isModulesOpen, setIsModulesOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_MIN)
  const menuRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const isResizing = useRef(false)

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUserMenuOpen])

  // Resize handlers -- direct DOM for zero flicker
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const startX = e.clientX
    const startWidth = sidebarRef.current?.offsetWidth ?? SIDEBAR_MIN

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current || !sidebarRef.current) return
      const delta = moveEvent.clientX - startX
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + delta))
      sidebarRef.current.style.width = `${newWidth}px`
    }

    const handleMouseUp = () => {
      if (!isResizing.current) return
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      // Commit final width to state
      if (sidebarRef.current) {
        setSidebarWidth(sidebarRef.current.offsetWidth)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  // Analysis must be complete before any module is accessible
  const isAnalysisComplete = currentStep === 'analysis'

  // User display values
  const userName = user?.full_name || 'User'
  const userEmail = user?.email || ''
  const userInitial = userName.charAt(0).toUpperCase()

  const MODULES: Module[] = [
    {
      id: 'analysis',
      name: 'Variant Analysis',
      icon: Microscope,
      checkEnabled: () => isAnalysisComplete,
    },
    {
      id: 'vus',
      name: 'Clinical Screening',
      icon: Shield,
      checkEnabled: () => isAnalysisComplete && enableScreening,
    },
    {
      id: 'phenotype',
      name: 'Phenotype Matching',
      icon: Dna,
      checkEnabled: () => isAnalysisComplete && enablePhenotypeMatching,
    },
    {
      id: 'literature',
      name: 'Literature Analysis',
      icon: BookOpen,
      checkEnabled: () => isAnalysisComplete && enablePhenotypeMatching,
    },
  ]

  const handleModuleClick = (moduleId: string, isEnabled: boolean) => {
    if (!isEnabled) return
    setSelectedModule(moduleId)
  }

  const handleLogout = async () => {
    setIsUserMenuOpen(false)
    await logout()
  }

  const handleOpenSettings = () => {
    setIsUserMenuOpen(false)
    setIsSettingsOpen(true)
  }

  // When collapsed, clicking anywhere on sidebar opens it
  const handleCollapsedClick = () => {
    if (!isSidebarOpen) {
      toggleSidebar()
    }
  }

  return (
    <>
      <style>{"@keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }"}</style>
      <aside
        ref={sidebarRef}
        className={cn(
          "h-full flex flex-col bg-card border-r border-border shrink-0 overflow-hidden relative",
          !isSidebarOpen && "cursor-pointer hover:bg-accent/50"
        )}
        style={{
          width: isSidebarOpen ? `${sidebarWidth}px` : `${SIDEBAR_COLLAPSED}px`,
          transition: isResizing.current ? 'none' : 'width 300ms',
        }}
        onClick={!isSidebarOpen ? handleCollapsedClick : undefined}
      >
        {isSidebarOpen ? (
          <div className="flex flex-col flex-1 min-h-0" style={{ animation: "slideInLeft 200ms ease-out" }}>
            {/* EXPANDED STATE */}

            {/* Header: Home button + Toggle button */}
            <div className="flex items-center justify-between px-2 py-2 h-[53px] shrink-0">
              <Button
                variant={selectedModule === null ? 'secondary' : 'ghost'}
                className="h-8 flex-1 justify-start mr-2"
                onClick={() => setSelectedModule(null)}
              >
                <Home className="h-4 w-4 shrink-0" />
                <span className="ml-2 text-base">Home</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Modules Navigation (collapsible) */}
            <div className="py-1 shrink-0">
              <button
                className="w-full flex items-center justify-between px-3 py-1.5 text-ml font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                onClick={() => setIsModulesOpen(!isModulesOpen)}
              >
                <span>Modules</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    !isModulesOpen && "-rotate-90"
                  )}
                />
              </button>

              {isModulesOpen && (
                <div className="mt-1 px-2 space-y-0.5">
                  {MODULES.map((module) => {
                    const Icon = module.icon
                    const isEnabled = module.checkEnabled ? module.checkEnabled() : true
                    const isSelected = selectedModule === module.id

                    return (
                      <Button
                        key={module.id}
                        variant={isSelected ? 'secondary' : 'ghost'}
                        className={cn(
                          "w-full justify-start",
                          !isEnabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => handleModuleClick(module.id, isEnabled)}
                        disabled={!isEnabled}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="ml-3 text-base">{module.name}</span>
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Cases List (collapsible) */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <CasesList />
            </div>

            {/* User Menu */}
            <div className="border-t border-border p-2 shrink-0 relative" ref={menuRef}>
              {/* Dropdown Menu - opens upward */}
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-2 right-2 mb-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-base text-muted-foreground truncate">{userEmail}</p>
                  </div>

                  <div className="py-1">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-base text-foreground hover:bg-accent transition-colors"
                      onClick={handleOpenSettings}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-border py-1">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-base text-foreground hover:bg-accent transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-accent"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0">
                  {userInitial}
                </div>
                <div className="ml-3 flex-1 text-left">
                  <div className="text-base font-medium">{userName}</div>
                  <div className="text-sm text-muted-foreground">Partner</div>
                </div>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* COLLAPSED STATE */}
            {/* Icons at top */}
            <div className="px-1 py-2 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedModule === null ? 'secondary' : 'ghost'}
                      className="w-full justify-center px-0 h-8"
                      onClick={(e) => { e.stopPropagation(); setSelectedModule(null) }}
                    >
                      <Home className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-sm">Home</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Module icons */}
            <nav className="px-1 space-y-1 shrink-0">
              {MODULES.map((module) => {
                const Icon = module.icon
                const isEnabled = module.checkEnabled ? module.checkEnabled() : true
                const isSelected = selectedModule === module.id

                return (
                  <TooltipProvider key={module.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isSelected ? 'secondary' : 'ghost'}
                          className={cn(
                            "w-full justify-center px-0",
                            !isEnabled && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={(e) => { e.stopPropagation(); handleModuleClick(module.id, isEnabled) }}
                          disabled={!isEnabled}
                        >
                          <Icon className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="text-sm">{module.name}</p>
                        {!isEnabled && (
                          <p className="text-xs text-muted-foreground">
                            {isAnalysisComplete ? '(Not enabled)' : '(Analysis required)'}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </nav>

            {/* Cases icon */}
            <div className="px-1 mt-1 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-center px-0 h-8"
                      onClick={(e) => { e.stopPropagation(); toggleSidebar() }}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-sm">Cases</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Chevron centered vertically */}
            <div className="flex-1 flex items-center justify-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* User avatar at bottom */}
            <div className="border-t border-border p-1 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-center px-0"
                      onClick={(e) => { e.stopPropagation(); setIsUserMenuOpen(!isUserMenuOpen) }}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {userInitial}
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-sm text-white">{userName}</p>
                    <p className="text-xs text-white">Partner</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </>
        )}

        {/* Resize handle -- only when expanded */}
        {isSidebarOpen && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors z-50"
            onMouseDown={handleResizeStart}
          />
        )}
      </aside>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  )
}
