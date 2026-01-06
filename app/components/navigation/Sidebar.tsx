/**
 * Sidebar Navigation Component
 * Main navigation for authenticated app
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
      // Module locked - do nothing or show tooltip
      return
    }
    setSelectedModule(moduleId)
  }

  return (
    <aside
      className={cn(
        'border-r border-border bg-card transition-all duration-300 flex flex-col h-full',
        isSidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Header with Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        {isSidebarOpen && (
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
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="ml-auto"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {/* Home */}
        <Button
          variant={selectedModule === null ? 'secondary' : 'ghost'}
          className={cn(
            'w-full justify-start',
            !isSidebarOpen && 'justify-center px-2'
          )}
          onClick={() => setSelectedModule(null)}
        >
          <Home className="h-5 w-5" />
          {isSidebarOpen && <span className="ml-3">Home</span>}
        </Button>

        {/* Modules Section */}
        <div className="pt-4 pb-2">
          {isSidebarOpen && (
            <p className="px-3 text-xs font-semibold text-muted-foreground">
              MODULES
            </p>
          )}
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
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-md',
                        'opacity-60 cursor-not-allowed',
                        !isSidebarOpen && 'justify-center px-2'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {isSidebarOpen && (
                        <>
                          <span className="flex-1 text-sm text-left">
                            {module.name}
                          </span>
                          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                        </>
                      )}
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
              className={cn(
                'w-full justify-start',
                !isSidebarOpen && 'justify-center px-2'
              )}
              onClick={() => handleModuleClick(module.id, module.requiresSession)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span className="ml-3">{module.name}</span>}
            </Button>
          )
        })}
      </nav>

      {/* User Menu - placeholder for now */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start hover:bg-accent',
            !isSidebarOpen && 'justify-center px-2'
          )}
        >
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0">
            D
          </div>
          {isSidebarOpen && (
            <div className="ml-3 flex-1 text-left">
              <div className="text-sm font-medium">Dr. Smith</div>
              <div className="text-xs text-muted-foreground">Starter plan</div>
            </div>
          )}
        </Button>
      </div>
    </aside>
  )
}
