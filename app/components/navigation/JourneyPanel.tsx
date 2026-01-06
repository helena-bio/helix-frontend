/**
 * Journey Panel Component
 * Progress tracker for analysis workflow
 */

'use client'

import { CheckCircle2, Clock, Lock, Upload, X } from 'lucide-react'
import { Button } from '@helix/shared/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@helix/shared/components/ui/tooltip'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { useSession } from '@/hooks/queries/use-variant-analysis-queries'
import { cn } from '@helix/shared/lib/utils'

type WorkflowStep = 'upload' | 'validation' | 'phenotype' | 'analysis'

interface Step {
  id: WorkflowStep
  label: string
  icon: typeof Upload
}

const STEPS: Step[] = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'validation', label: 'Validation', icon: CheckCircle2 },
  { id: 'phenotype', label: 'Phenotype', icon: Clock },
  { id: 'analysis', label: 'Analysis', icon: Lock },
]

function getStepStatus(
  currentStep: WorkflowStep,
  stepId: WorkflowStep
): 'completed' | 'current' | 'locked' {
  const order: WorkflowStep[] = ['upload', 'validation', 'phenotype', 'analysis']
  const currentIndex = order.indexOf(currentStep)
  const stepIndex = order.indexOf(stepId)

  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'locked'
}

function getIconColor(status: 'completed' | 'current' | 'locked'): string {
  if (status === 'completed') return 'text-green-600'
  if (status === 'current') return 'text-orange-500'
  return 'text-muted-foreground'
}

function getLineColor(status: 'completed' | 'current' | 'locked'): string {
  if (status === 'completed') return 'bg-green-600'
  return 'bg-border'
}

function determineCurrentStep(sessionStatus?: string): WorkflowStep {
  if (!sessionStatus) return 'upload'
  
  switch (sessionStatus) {
    case 'uploading':
      return 'upload'
    case 'validating':
    case 'processing':
      return 'validation'
    case 'completed':
      return 'analysis'
    default:
      return 'upload'
  }
}

export function JourneyPanel() {
  const { currentSessionId, setCurrentSessionId } = useAnalysis()
  
  // Fetch session to determine current step
  const { data: session } = useSession(
    currentSessionId || '',
    { enabled: !!currentSessionId }
  )
  
  const currentStep = determineCurrentStep(session?.status)
  
  const handleClearFile = () => {
    setCurrentSessionId(null)
  }

  return (
    <div className="w-full bg-card border-b border-border px-8 py-4">
      <div className="flex items-center justify-between gap-8">
        {/* Left spacer for centering */}
        <div className="flex-1" />

        {/* Centered workflow progress */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, index) => {
            const status = getStepStatus(currentStep, step.id)
            const Icon = status === 'completed' 
              ? CheckCircle2 
              : status === 'current' 
                ? Clock 
                : Lock

            return (
              <div key={step.id} className="flex items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon 
                    className={cn(
                      'h-4 w-4 shrink-0',
                      getIconColor(status)
                    )} 
                  />
                  <p className="text-xs font-medium whitespace-nowrap">
                    {step.label}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div 
                    className={cn(
                      'w-24 h-0.5',
                      getLineColor(status)
                    )} 
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Right side with Clear File button */}
        <div className="flex-1 flex justify-end pr-4">
          {session && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearFile}
                    className="h-8 text-xs"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear File
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{session.vcf_file_path?.split("/").pop() || "Unknown"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  )
}
