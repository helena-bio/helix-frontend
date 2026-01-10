"use client"

/**
 * Sidebar Navigation Component
 * Collapsible navigation menu with toggle button at top
 */

import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Microscope,
  TrendingUp,
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
    icon: FlaskConical,
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
    <aside className="h-full flex flex-col bg-card">
      {/* Toggle button at top */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border">
        <span className="text-sm font-medium px-2">Navigation</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Home */}
        <Button
          variant={selectedModule === null ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => setSelectedModule(null)}
        >
          <Home className="h-5 w-5" />
          <span className="ml-3 text-base">Home</span>
        </Button>

        {/* Modules Section */}
        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Modules
          </p>
        </div>

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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md opacity-50 cursor-not-allowed"
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-base text-left">
                        {module.name}
                      </span>
                      <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-sm">Upload a VCF file to activate this module</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }

          return (
            <Button
              key={module.id}
              variant={isSelected ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => handleModuleClick(module.id, module.requiresSession)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="ml-3 text-base">{module.name}</span>
            </Button>
          )
        })}
      </nav>

      {/* User Menu */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-accent"
        >
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0">
            D
          </div>
          <div className="ml-3 flex-1 text-left">
            <div className="text-base font-medium">Dr. Smith</div>
            <div className="text-sm text-muted-foreground">Starter plan</div>
          </div>
        </Button>
      </div>
    </aside>
  )
}
