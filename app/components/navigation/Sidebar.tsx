"use client"

/**
 * Sidebar Navigation Component
 *
 * Always visible in authenticated layout.
 * Two visual states:
 * - Expanded (256px): Full text labels
 * - Collapsed (64px): Icon-only mode
 *
 * Module enablement:
 * - Pre-analysis: All modules disabled (grayed out)
 * - Post-analysis: Modules enabled based on ClinicalProfileContext flags
 */

import {
  ChevronLeft,
  ChevronRight,
  Home,
  Microscope,
  Shield,
  Dna,
  BookOpen,
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
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
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
  const { enableScreening, enablePhenotypeMatching } = useClinicalProfileContext()

  // Analysis must be complete before any module is accessible
  const isAnalysisComplete = currentStep === 'analysis'

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

  return (
    <aside className={cn(
      "h-full flex flex-col bg-card transition-all duration-300 border-r border-border shrink-0",
      isSidebarOpen ? "w-64" : "w-16"
    )}>
      {/* Header: Home button + Toggle button */}
      <div className="flex items-center justify-between px-2 py-2 h-[53px] shrink-0">
        {/* Home button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectedModule === null ? 'secondary' : 'ghost'}
                className={cn(
                  "h-8",
                  isSidebarOpen ? "flex-1 justify-start mr-2" : "w-8 px-2"
                )}
                onClick={() => setSelectedModule(null)}
              >
                <Home className="h-4 w-4 shrink-0" />
                {isSidebarOpen && <span className="ml-2 text-base">Home</span>}
              </Button>
            </TooltipTrigger>
            {!isSidebarOpen && (
              <TooltipContent side="right">
                <p className="text-sm">Home</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 shrink-0"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Modules Section Header - only when expanded */}
        {isSidebarOpen && (
          <div className="pt-2 pb-2">
            <p className="px-3 text-ml font-semibold text-muted-foreground uppercase tracking-wider">
              Modules
            </p>
          </div>
        )}

        {/* Module Items */}
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
                      "w-full",
                      isSidebarOpen ? "justify-start" : "justify-center px-2",
                      !isEnabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => handleModuleClick(module.id, isEnabled)}
                    disabled={!isEnabled}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {isSidebarOpen && <span className="ml-3 text-base">{module.name}</span>}
                  </Button>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    <p className="text-sm">{module.name}</p>
                    {!isEnabled && (
                      <p className="text-xs text-muted-foreground">
                        {isAnalysisComplete ? '(Not enabled)' : '(Analysis required)'}
                      </p>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </nav>

      {/* User Menu */}
      <div className="border-t border-border p-2 shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full hover:bg-accent",
                  isSidebarOpen ? "justify-start" : "justify-center px-2"
                )}
              >
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0">
                  D
                </div>
                {isSidebarOpen && (
                  <div className="ml-3 flex-1 text-left">
                    <div className="text-base font-medium">Dr. Smith</div>
                    <div className="text-sm text-muted-foreground">Starter plan</div>
                  </div>
                )}
              </Button>
            </TooltipTrigger>
            {!isSidebarOpen && (
              <TooltipContent side="right">
                <p className="text-sm">Dr. Smith</p>
                <p className="text-xs text-muted-foreground">Starter plan</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  )
}
