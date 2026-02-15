/**
 * App Header Component
 * Logo + workflow progress (only during upload workflow) + actions
 */

'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Clock, Lock, Download, ChevronDown, LogOut, FileText, Shield } from 'lucide-react'
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@helix/shared/components/ui/dropdown-menu'
import { useJourney, JOURNEY_STEPS, type StepStatus } from '@/contexts/JourneyContext'
import { useSession } from '@/contexts/SessionContext'
import { useClinicalInterpretation } from '@/contexts/ClinicalInterpretationContext'
import { usePhenotypeResults } from '@/contexts/PhenotypeResultsContext'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@helix/shared/lib/utils'
import {
  downloadClinicalReport,
  downloadPhenotypeFindingsReport,
  downloadVariantFindingsReport,
} from '@/lib/utils/download-report'

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

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { getStepStatus, canNavigateTo, goToStep, currentStep } = useJourney()
  const { currentSessionId } = useSession()
  const { content: interpretation, hasInterpretation, status: interpretationStatus } = useClinicalInterpretation()
  const { status: phenotypeStatus, aggregatedResults } = usePhenotypeResults()
  const { user, logout } = useAuth()


  const isAdmin = user?.role === 'admin'
  const isPlatformAdmin = user?.is_platform_admin === true

  // Show journey steps only on /upload route
  const showJourneySteps = pathname === '/upload'

  // Show Clear File only in split view (analysis complete)
  const isAnalysisComplete = currentStep === 'analysis'

  const handleStepClick = (stepId: typeof JOURNEY_STEPS[number]['id']) => {
    if (canNavigateTo(stepId)) {
      goToStep(stepId)
    }
  }

  const getVisualStatus = (stepId: typeof JOURNEY_STEPS[number]['id']): StepStatus => {
    const baseStatus = getStepStatus(stepId)

    if (stepId === 'upload' && currentSessionId && baseStatus === 'current') {
      return 'completed'
    }

    return baseStatus
  }

  const handleDownloadReport = async (format: 'md' | 'docx' | 'pdf') => {
    if (!interpretation || !hasInterpretation) {
      console.error('[Header] No clinical interpretation available')
      return
    }

    try {
      downloadClinicalReport(interpretation, format, currentSessionId || 'report')
    } catch (error) {
      console.error('[Header] Download failed:', error)
      alert('Download failed. Please try again.')
    }
  }

  const handleDownloadVariantFindings = async () => {
    if (!currentSessionId) {
      console.error('[Header] No session for variant report')
      return
    }

    try {
      await downloadVariantFindingsReport(currentSessionId)
    } catch (error) {
      console.error('[Header] Variant findings download failed:', error)
      alert('Variant findings download failed. Please try again.')
    }
  }

  const handleDownloadPhenotypeFindings = async () => {
    if (!currentSessionId) {
      console.error('[Header] No session for phenotype report')
      return
    }

    try {
      await downloadPhenotypeFindingsReport(currentSessionId)
    } catch (error) {
      console.error('[Header] Phenotype findings download failed:', error)
      alert('Phenotype findings download failed. Please try again.')
    }
  }

  const hasClinicalInterpretation = isAnalysisComplete && interpretationStatus === 'success'
  const hasPhenotypeResults = phenotypeStatus === 'success' && aggregatedResults !== null
  // Variant findings always available when analysis is complete
  const showDownloadReport = isAnalysisComplete

  return (
    <>
      <div className="h-full flex items-center gap-6 overflow-hidden">
        {/* Logo - Bulb first, then text */}
        <Link href="/" className="flex items-center gap-2 shrink-0 pl-6">
          <Image
            src="/images/logos/logo_bulb.svg"
            alt=""
            width={32}
            height={40}
            className="h-11 w-auto"
          />
          <Image
            src="/images/logos/logo_helix.svg"
            alt="Helix Insight"
            width={160}
            height={48}
            className="h-10 w-auto"
          />
        </Link>

        {/* Workflow progress - Only during upload workflow */}
        {showJourneySteps ? (
          <div className="flex-1 flex items-center justify-center gap-3 overflow-x-auto px-4">
            {JOURNEY_STEPS.map((step, index) => {
              const status = getVisualStatus(step.id)
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
                          <p className="text-xs text-background/70 mt-1">
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
        ) : (
          <div className="flex-1" />
        )}

        {/* Right side buttons */}
        <div className="flex items-center gap-3 shrink-0 mr-6">
          {isPlatformAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-base font-medium"
              onClick={() => router.push('/platform')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Platform
            </Button>
          )}

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
              <DropdownMenuContent align="end" className="w-60">
                {/* Variant Findings - always available when analysis complete */}
                <DropdownMenuLabel className="pl-8 text-base text-muted-foreground font-normal">
                  Variant Findings
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleDownloadVariantFindings}
                  className="cursor-pointer text-md"
                >
                  <FileText className="h-3 w-3 mr-2" />
                  PDF
                </DropdownMenuItem>

                {hasPhenotypeResults && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="pl-8 text-base text-muted-foreground font-normal">
                      Phenotype Findings
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={handleDownloadPhenotypeFindings}
                      className="cursor-pointer text-md"
                    >
                      <FileText className="h-3 w-3 mr-2" />
                      PDF
                    </DropdownMenuItem>
                  </>
                )}

                {hasClinicalInterpretation && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="pl-8 text-base text-muted-foreground font-normal">
                      Clinical Interpretation
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleDownloadReport('pdf')}
                      className="cursor-pointer text-md"
                    >
                      <Download className="h-3 w-3 mr-2" />
                      PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDownloadReport('docx')}
                      className="cursor-pointer text-md"
                    >
                      <Download className="h-3 w-3 mr-2" />
                      DOCX
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDownloadReport('md')}
                      className="cursor-pointer text-md"
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Markdown
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Sign out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

    </>
  )
}
