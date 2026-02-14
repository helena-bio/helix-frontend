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
import { useRouter, usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Plus,
  FolderOpen,
  Microscope,
  Shield,
  Dna,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  Users2,
  Building2,
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
import { usePhenotypeResults } from '@/contexts/PhenotypeResultsContext'
import { useLiteratureResults } from '@/contexts/LiteratureResultsContext'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import { useClinicalInterpretation } from '@/contexts/ClinicalInterpretationContext'

import { UserAvatar } from '@/components/ui/UserAvatar'
import { CasesList } from './CasesList'
import { cn } from '@helix/shared/lib/utils'

const SIDEBAR_MIN = 256
const SIDEBAR_MAX = 480
const SIDEBAR_COLLAPSED = 40

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
    setCurrentSessionId,
    setSelectedModule,
  } = useSession()

  const { currentStep, resetJourney } = useJourney()
  const { user, logout, avatarVersion } = useAuth()
  const { enableScreening, enablePhenotypeMatching } = useClinicalProfileContext()
  const { aggregatedResults: phenotypeData } = usePhenotypeResults()
  const { results: literatureData } = useLiteratureResults()
  const { status: screeningStatus } = useScreeningResults()
  const { hasInterpretation } = useClinicalInterpretation()

  // Data presence overrides enablement flags for completed cases
  const hasPhenotypeData = !!(phenotypeData && phenotypeData.length > 0)
  const hasLiteratureData = !!(literatureData && literatureData.length > 0)
  const hasScreeningData = screeningStatus === 'success'

  const router = useRouter()
  const pathname = usePathname()

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isModulesOpen, setIsModulesOpen] = useState(true)
  const [isAdminOpen, setIsAdminOpen] = useState(true)
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

  // Home is active when on dashboard
  const isHome = pathname === '/'

  // User display values
  const userName = user?.full_name || 'User'
  const userEmail = user?.email || ''

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
      checkEnabled: () => isAnalysisComplete && (enableScreening || hasScreeningData),
    },
    {
      id: 'phenotype',
      name: 'Phenotype Matching',
      icon: Dna,
      checkEnabled: () => isAnalysisComplete && (enablePhenotypeMatching || hasPhenotypeData),
    },
    {
      id: 'literature',
      name: 'Literature Analysis',
      icon: BookOpen,
      checkEnabled: () => isAnalysisComplete && (enablePhenotypeMatching || hasLiteratureData || hasPhenotypeData),
    },
    {
      id: 'report',
      name: 'Clinical Report',
      icon: FileText,
      checkEnabled: () => isAnalysisComplete && hasInterpretation,
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
    router.push('/settings')
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
            {/* New Case + Toggle */}
            <div className="flex items-center justify-between px-2 pt-2 pb-0 shrink-0">
              <Button
                variant="ghost"
                className="h-8 flex-1 justify-start mr-2"
                onClick={() => { setCurrentSessionId(null); resetJourney(); router.push("/upload") }}
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="ml-2 text-base">New Case</span>
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
            {/* Dashboard */}
            <div className="px-2 shrink-0">
              <Button
                variant={isHome ? 'secondary' : 'ghost'}
                className="w-full justify-start h-8"
                onClick={() => router.push('/')}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span className="ml-2 text-base">Dashboard</span>
              </Button>
            </div>

            {/* Modules Navigation (collapsible) */}
            <div className="border-t border-border py-1 shrink-0">
              <button
                className="w-full flex items-center justify-between px-3 py-1.5 text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
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
            <div className="flex-1 min-h-0 overflow-y-auto border-t border-border">
              <CasesList />
            </div>

            {/* Admin Section - visible only for admin role */}
            {user?.role === 'admin' && (
              <div className="py-1 shrink-0 border-t border-border">
                <button
                  className="w-full flex items-center justify-between px-3 py-1.5 text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                >
                  <span>Admin</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      !isAdminOpen && "-rotate-90"
                    )}
                  />
                </button>

                {isAdminOpen && (
                <div className="mt-1 px-2 space-y-0.5">
                  <Button
                    variant={pathname === '/admin/organization' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => router.push('/admin/organization')}
                  >
                    <Building2 className="h-5 w-5 shrink-0" />
                    <span className="ml-3 text-base">Organization</span>
                  </Button>
                  <Button
                    variant={pathname === '/admin/team' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => router.push('/admin/team')}
                  >
                    <Users2 className="h-5 w-5 shrink-0" />
                    <span className="ml-3 text-base">Team Members</span>
                  </Button>
                </div>
                )}
              </div>
            )}

            {/* User Menu */}
            <div className="border-t border-border shrink-0 relative" ref={menuRef}>
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
                className="w-full justify-start hover:bg-accent rounded-none px-4 py-3 h-auto"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <UserAvatar fullName={userName} userId={user?.id} size="md" version={avatarVersion} />
                <div className="ml-3 flex-1 text-left">
                  <div className="text-base font-medium">{userName}</div>
                  <div className="text-md text-muted-foreground">Partner</div>
                </div>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* COLLAPSED STATE */}
            {/* Icons at top */}
              <div className="px-1 pt-2 shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-center px-0 h-8"
                        onClick={(e) => { e.stopPropagation(); setCurrentSessionId(null); resetJourney(); router.push("/upload") }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="text-sm">New Case</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            <div className="px-1 py-2 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isHome ? 'secondary' : 'ghost'}
                      className="w-full justify-center px-0 h-8"
                      onClick={(e) => { e.stopPropagation(); router.push('/') }}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-sm">Dashboard</p>
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
                      <UserAvatar fullName={userName} userId={user?.id} size="sm" version={avatarVersion} />
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

    </>
  )
}
