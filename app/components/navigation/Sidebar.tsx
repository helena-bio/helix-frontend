"use client"

/**
 * Sidebar Navigation Component
 * Two states:
 * - Expanded (256px): Full text labels
 * - Collapsed (64px): Icon-only mode
 */

import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Microscope,
  TrendingUp,
  Dna,
  FlaskConical,
  BookOpen,
  Filter,
  Settings,
  Lock,
} from 'lucide-react'
import { Button } from '@helix/shared/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@helix/shared/components/ui/tooltip'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { cn } from '@helix/shared/lib/utils'

interface Module {
  id: string
  name: string
  icon: typeof Microscope
  requiresSession: boolean
}

const MODULES: Module[] = [
  {
    id: 'analysis',
    name: 'Variant Analysis',
    icon: Microscope,
    requiresSession: false,
  },
  {
    id: 'vus',
    name: 'VUS Prioritization',
    icon: TrendingUp,
    requiresSession: true,
  },
  {
    id: 'phenotype',
    name: 'Phenotype Matching',
    icon: Dna,
    requiresSession: true,
  },
  {
    id: 'literature',
    name: 'Literature Analysis',
    icon: BookOpen,
    requiresSession: true,
  },
  {
    id: 'fpf',
    name: 'False Positive Filter',
    icon: Filter,
    requiresSession: true,
  },
  {
    id: 'guidelines',
    name: 'Guidelines Tracker',
    icon: Settings,
    requiresSession: true,
  },
]

export function Sidebar() {
  const {
    isSidebarOpen,
    toggleSidebar,
    selectedModule,
    setSelectedModule,
    currentSessionId,
  } = useAnalysis()

  const handleModuleClick = (moduleId: string, requiresSession: boolean) => {
    if (requiresSession && !currentSessionId) {
      return
    }
    setSelectedModule(moduleId)
  }

  return (
    <aside className={cn(
      "h-full flex flex-col bg-card transition-all duration-300 border-r border-border",
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
          const isLocked = module.requiresSession && !currentSessionId
          const isSelected = selectedModule === module.id

          if (isLocked) {
            return (
              <TooltipProvider key={module.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md opacity-50 cursor-not-allowed",
                        !isSidebarOpen && "justify-center px-2"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {isSidebarOpen && (
                        <>
                          <span className="flex-1 text-base text-left">
                            {module.name}
                          </span>
                          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                        </>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-sm">
                      {isSidebarOpen 
                        ? 'Upload a VCF file to activate this module'
                        : `${module.name} (locked)`
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }

          return (
            <TooltipProvider key={module.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isSelected ? 'secondary' : 'ghost'}
                    className={cn(
                      "w-full",
                      isSidebarOpen ? "justify-start" : "justify-center px-2"
                    )}
                    onClick={() => handleModuleClick(module.id, module.requiresSession)}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {isSidebarOpen && <span className="ml-3 text-base">{module.name}</span>}
                  </Button>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    <p className="text-sm">{module.name}</p>
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
