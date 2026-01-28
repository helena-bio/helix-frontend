/**
 * Journey Panel Component
 * Progress tracker for analysis workflow with logo
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Clock, Lock, X, Download, ChevronDown } from 'lucide-react'
import { Button } from '@helix/shared/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@helix/shared/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@helix/shared/components/ui/dropdown-menu'
import { useJourney, JOURNEY_STEPS, type StepStatus } from '@/contexts/JourneyContext'
import { useSession } from '@/contexts/SessionContext'
import { useClinicalInterpretation } from '@/contexts/ClinicalInterpretationContext'
import { cn } from '@helix/shared/lib/utils'
import { downloadClinicalReport } from '@/lib/utils/download-report'

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
  const router = useRouter()
  const { getStepStatus, canNavigateTo, goToStep, resetJourney, currentStep } = useJourney()
  const { currentSessionId, setCurrentSessionId } = useSession()
  const { interpretation, isGenerating, hasInterpretation, isComplete } = useClinicalInterpretation()

  const handleStepClick = (stepId: typeof JOURNEY_STEPS[number]['id']) => {
    if (canNavigateTo(stepId)) {
      goToStep(stepId)
    }
  }

  /**
   * Clear File - Complete Reset
   * 1. Clear sessionId (triggers auto-cleanup in providers via useEffect)
   * 2. Reset journey to upload
   * 3. Navigate to /analysis (without sessionId in URL) - use replace to clear URL
   */
  const handleClearFile = () => {
    // Clear session - this will trigger cleanup in all providers
    setCurrentSessionId(null)
    
    // Reset journey to upload step
    resetJourney()
    
    // Navigate to clean /analysis page - REPLACE URL to clear query params
    router.replace('/analysis')
  }

  const handleDownloadReport = async (format: 'md' | 'docx' | 'pdf') => {
    console.log('[JourneyPanel] Download report requested:', format)

    if (!interpretation || !hasInterpretation()) {
      console.error('[JourneyPanel] No clinical interpretation available')
      return
    }

    console.log('[JourneyPanel] Downloading report:', {
      format,
      sessionId: currentSessionId,
      interpretationLength: interpretation.length,
    })

    try {
      downloadClinicalReport(interpretation, format, currentSessionId || 'report')
    } catch (error) {
      console.error('[JourneyPanel] Download failed:', error)
      alert('Download failed. Please try again.')
    }
  }

  // Debug logging for Download Report visibility
  useEffect(() => {
    console.log('[JourneyPanel] Download Report Status Check:', {
      currentStep,
      hasInterpretation: hasInterpretation(),
      isGenerating,
      isComplete: isComplete(),
      interpretationLength: interpretation?.length || 0,
    })
  }, [currentStep, hasInterpretation, isGenerating, isComplete, interpretation])

  // Show Download Report button only in Analysis step when interpretation is complete
  const showDownloadReport = currentStep === 'analysis' && isComplete()

  console.log('[JourneyPanel] showDownloadReport:', showDownloadReport)

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

      {/* Right side buttons */}
      <div className="flex items-center gap-3 shrink-0 mr-6">
        {/* Download Report button - Only in Analysis step when interpretation is complete */}
        {showDownloadReport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
                <ChevronDown className="h-3 w-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleDownloadReport('pdf')}
                className="cursor-pointer"
              >
                <Download className="h-3 w-3 mr-2" />
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDownloadReport('docx')}
                className="cursor-pointer"
              >
                <Download className="h-3 w-3 mr-2" />
                Download as DOCX
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDownloadReport('md')}
                className="cursor-pointer"
              >
                <Download className="h-3 w-3 mr-2" />
                Download as Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear File button */}
        {currentSessionId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFile}
            className="h-8 text-sm"
          >
            <X className="h-4 w-4 mr-2" />
            Clear File
          </Button>
        )}
      </div>
    </div>
  )
}
