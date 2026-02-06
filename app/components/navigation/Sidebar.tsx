"use client"

/**
 * Sidebar Navigation Component
 *
 * Always visible in authenticated layout.
 * Two visual states:
 * - Expanded (256px): Full text labels
 * - Collapsed (48px): Icon-only, click anywhere to expand
 *
 * Module enablement:
 * - Pre-analysis: All modules disabled (grayed out)
 * - Post-analysis: Modules enabled based on ClinicalProfileContext flags
 *
 * User menu:
 * - Shows user name and plan from JWT
 * - Dropdown with email, settings, logout
 */

import { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Home,
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
import { cn } from '@helix/shared/lib/utils'

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
  const menuRef = useRef<HTMLDivElement>(null)

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
        className={cn(
          "h-full flex flex-col bg-card transition-all duration-300 border-r border-border shrink-0 overflow-hidden",
          isSidebarOpen ? "w-64" : "w-12 cursor-pointer"
        )}
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

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1">
              <div className="pt-2 pb-2">
                <p className="px-3 text-ml font-semibold text-muted-foreground uppercase tracking-wider">
                  Modules
                </p>
              </div>

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
            </nav>

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

            <nav className="px-1 space-y-1">
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
      </aside>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  )
}
