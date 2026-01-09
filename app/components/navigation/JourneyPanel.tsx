/**
 * Journey Panel Component
 * Progress tracker for analysis workflow with logo
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Clock, Lock, X } from 'lucide-react'
import { Button } from '@helix/shared/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@helix/shared/components/ui/tooltip'
import { useJourney, JOURNEY_STEPS, type StepStatus } from '@/contexts/JourneyContext'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { cn } from '@helix/shared/lib/utils'

function getStepIcon(status: StepStatus) {
  switch (status) {
    case 'completed':
      return CheckCircle2
    case 'current':
      return Clock
    case 'locked':
      return Lock
  }
}

function getIconColor(status: StepStatus): string {
  switch (status) {
    case 'completed':
      return 'text-green-600'
    case 'current':
      return 'text-orange-500'
    case 'locked':
      return 'text-muted-foreground'
  }
}

function getLineColor(status: StepStatus): string {
  return status === 'completed' ? 'bg-green-600' : 'bg-border'
}

export function JourneyPanel() {
  const { getStepStatus, canNavigateTo, goToStep, resetJourney } = useJourney()
  const { currentSessionId, setCurrentSessionId } = useAnalysis()

  const handleStepClick = (stepId: typeof JOURNEY_STEPS[number]['id']) => {
    if (canNavigateTo(stepId)) {
      goToStep(stepId)
    }
  }

  const handleClearFile = () => {
    setCurrentSessionId(null)
    resetJourney()
  }

  return (
    <div className="h-full flex items-center gap-6 overflow-hidden">
      {/* Logo - Larger size */}
      <Link href="/" className="flex items-center gap-2 shrink-0 pl-6">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/helix%20logo-W2SpmbzgUEDwJyPjRhIvWwSfESe6Aq.png"
          alt="Helix Insight"
          width={160}
          height={48}
          className="h-10 w-auto"
        />
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bulb-KpLU35CozLLzkwRErx9HXQNX4gHefR.png"
          alt=""
          width={32}
          height={40}
          className="h-9 w-auto"
        />
      </Link>

      {/* Workflow progress - Center, scrollable if needed */}
      <div className="flex-1 flex items-center justify-center gap-3 overflow-x-auto px-4">
        {JOURNEY_STEPS.map((step, index) => {
          const status = getStepStatus(step.id)
          const Icon = getStepIcon(status)
          const isClickable = canNavigateTo(step.id)

          return (
            <div key={step.id} className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleStepClick(step.id)}
                      disabled={!isClickable}
                      className={cn(
                        'flex items-center gap-2 min-w-0 transition-opacity',
                        isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0',
                          getIconColor(status)
                        )}
                      />
                      <p className="text-base font-medium whitespace-nowrap">
                        {step.label}
                      </p>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">{step.description}</p>
                    {!isClickable && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Complete previous steps first
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {index < JOURNEY_STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-20 h-0.5',
                    getLineColor(status)
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Clear File button - Right side, fixed */}
      {currentSessionId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFile}
          className="h-8 text-sm shrink-0 mr-6"
        >
          <X className="h-4 w-4 mr-2" />
          Clear File
        </Button>
      )}
    </div>
  )
}
