"use client"

/**
 * ValidationStatus Component - Display VCF Validation Progress
 *
 * Features:
 * - Auto-starts validation when mounted
 * - Real-time polling of validation task
 * - Success/Error states
 * - Progress indicator
 */

import { useEffect, useState } from 'react'
import { useTaskStatus } from '@/hooks/queries'
import { useStartValidation } from '@/hooks/mutations'
import { useJourney } from '@/contexts/JourneyContext'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  FileX,
} from 'lucide-react'
import { toast } from 'sonner'

interface ValidationStatusProps {
  sessionId: string
  onValidationComplete?: () => void
  onValidationError?: (error: Error) => void
}

export function ValidationStatus({
  sessionId,
  onValidationComplete,
  onValidationError,
}: ValidationStatusProps) {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  
  const { nextStep } = useJourney()
  const startValidationMutation = useStartValidation()
  
  // Poll task status
  const { data: taskStatus, error: taskError } = useTaskStatus(taskId, {
    enabled: !!taskId,
  })

  // Auto-start validation when component mounts
  useEffect(() => {
    if (!hasStarted && sessionId) {
      setHasStarted(true)
      
      startValidationMutation.mutate(sessionId, {
        onSuccess: (data) => {
          setTaskId(data.task_id)
        },
        onError: (error) => {
          onValidationError?.(error as Error)
        },
      })
    }
  }, [sessionId, hasStarted, startValidationMutation, onValidationError])

  // Handle validation completion
  useEffect(() => {
    if (taskStatus?.ready) {
      if (taskStatus.successful) {
        toast.success('Validation complete', {
          description: 'VCF file is valid',
        })
        // Advance to next step (Phenotype)
        nextStep()
        onValidationComplete?.()
      } else if (taskStatus.failed) {
        const error = new Error('VCF validation failed')
        toast.error('Validation failed', {
          description: taskStatus.result?.error || 'Invalid VCF file',
        })
        onValidationError?.(error)
      }
    }
  }, [taskStatus, nextStep, onValidationComplete, onValidationError])

  // Calculate progress
  const getProgress = (): number => {
    if (!taskStatus) return 10
    if (taskStatus.ready && taskStatus.successful) return 100
    if (taskStatus.info?.progress) return taskStatus.info.progress
    
    // Estimate based on status
    switch (taskStatus.status) {
      case 'PENDING':
        return 10
      case 'STARTED':
        return 30
      case 'PROGRESS':
        return 60
      default:
        return 50
    }
  }

  const progress = getProgress()

  // Error State - Task polling error
  if (taskError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Validation Error</h3>
                <p className="text-sm text-muted-foreground">
                  {taskError.message}
                </p>
              </div>

              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error State - Validation failed
  if (taskStatus?.failed) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-destructive/10">
                <FileX className="h-8 w-8 text-destructive" />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Invalid VCF File</h3>
                <p className="text-sm text-muted-foreground">
                  {taskStatus.result?.error || 'The VCF file format is invalid. Please check your file and try again.'}
                </p>
              </div>

              <Button onClick={() => window.location.reload()}>
                Upload Different File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success State
  if (taskStatus?.successful) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <Card className="w-full max-w-md border-green-500">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Validation Complete</h3>
                <p className="text-sm text-muted-foreground">
                  Your VCF file is valid and ready for analysis
                </p>
              </div>

              {taskStatus.result && (
                <div className="p-4 bg-muted rounded-lg text-left">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Variants</span>
                      <span className="font-medium">
                        {taskStatus.result.total_variants?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Samples</span>
                      <span className="font-medium">
                        {taskStatus.result.sample_count || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={onValidationComplete}>
                Continue to Phenotype
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading/Progress State
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10">
              <FileCheck className="h-8 w-8 text-primary animate-pulse" />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Validating VCF File</h3>
              <p className="text-sm text-muted-foreground">
                Checking file format, headers, and structure...
              </p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Validation in progress</span>
                <span>{progress}%</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>This usually takes a few seconds...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
