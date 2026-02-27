/**
 * Journey Context - Derived from URL (no state, no localStorage)
 *
 * Follows Stripe/Vercel pattern: URL is the single source of truth.
 *
 * Step is derived from:
 *   pathname + searchParams.get('step')
 *
 * URL mapping:
 *   /upload                             -> 'upload'
 *   /upload?session=XXX                 -> 'upload'  (QC results)
 *   /upload?session=XXX&step=processing -> 'processing'
 *   /upload?session=XXX&step=profile    -> 'profile'
 *   /analysis?session=XXX              -> 'analysis'
 *
 * Navigation actions are just router.push() calls.
 * No localStorage. No race conditions. Refresh always works.
 */

'use client'

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode
} from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// -----------------------------------------------------------------------
// Types (public API unchanged -- all consumers keep working)
// -----------------------------------------------------------------------

export type JourneyStep = 'upload' | 'processing' | 'profile' | 'analysis'
export type JourneyMode = 'new' | 'reprocess'
export type StepStatus = 'completed' | 'current' | 'locked'

export interface StepInfo {
  id: JourneyStep
  label: string
  description: string
  order: number
}

export const JOURNEY_STEPS: readonly StepInfo[] = [
  { id: 'upload',     label: 'Upload',     description: 'Upload and validate VCF file', order: 0 },
  { id: 'processing', label: 'Processing', description: 'Analyzing variants with ACMG classification', order: 1 },
  { id: 'profile',    label: 'Profile',    description: 'Patient clinical profile and phenotype matching', order: 2 },
  { id: 'analysis',   label: 'Analysis',   description: 'View and analyze variants', order: 3 },
] as const

// -----------------------------------------------------------------------
// Context type (same public API as before)
// -----------------------------------------------------------------------

interface JourneyContextType {
  currentStep: JourneyStep
  journeyMode: JourneyMode
  setJourneyMode: (mode: JourneyMode) => void
  startReprocess: (sessionId: string) => void
  goToStep: (step: JourneyStep) => void
  nextStep: () => void
  previousStep: () => void
  resetJourney: () => void
  skipToAnalysis: () => void
  getStepStatus: (step: JourneyStep) => StepStatus
  getStepInfo: (step: JourneyStep) => StepInfo | undefined
  getStepLabel: (step: JourneyStep) => string
  canNavigateTo: (step: JourneyStep) => boolean
  isFirstStep: boolean
  isLastStep: boolean
  currentStepIndex: number
  completedSteps: JourneyStep[]
  progressPercentage: number
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined)

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function getStepIndex(step: JourneyStep): number {
  const info = JOURNEY_STEPS.find(s => s.id === step)
  return info?.order ?? 0
}

function deriveStep(pathname: string, stepParam: string | null): JourneyStep {
  // /analysis route is always 'analysis'
  if (pathname === '/analysis') return 'analysis'

  // /upload route -- check step param
  if (pathname === '/upload') {
    if (stepParam === 'processing') return 'processing'
    if (stepParam === 'profile') return 'profile'
    return 'upload'
  }

  // Any other route defaults to upload
  return 'upload'
}

function deriveMode(modeParam: string | null): JourneyMode {
  return modeParam === 'reprocess' ? 'reprocess' : 'new'
}

// Build URL for a given step, preserving session
function buildUrl(step: JourneyStep, sessionId: string | null, mode?: JourneyMode): string {
  if (step === 'analysis' && sessionId) {
    return `/analysis?session=${sessionId}`
  }

  // All other steps are on /upload
  const params = new URLSearchParams()
  if (sessionId) params.set('session', sessionId)
  if (step !== 'upload') params.set('step', step)
  if (mode === 'reprocess') params.set('mode', 'reprocess')

  const qs = params.toString()
  return `/upload${qs ? `?${qs}` : ''}`
}

// -----------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------

export function JourneyProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Derive everything from URL
  const sessionId = searchParams.get('session')
  const stepParam = searchParams.get('step')
  const modeParam = searchParams.get('mode')

  const currentStep = deriveStep(pathname, stepParam)
  const journeyMode = deriveMode(modeParam)
  const currentStepIndex = getStepIndex(currentStep)

  // Navigation: just change the URL
  const goToStep = useCallback((step: JourneyStep) => {
    router.push(buildUrl(step, sessionId, journeyMode !== 'new' ? journeyMode : undefined))
  }, [router, sessionId, journeyMode])

  const nextStep = useCallback(() => {
    const nextIdx = currentStepIndex + 1
    if (nextIdx < JOURNEY_STEPS.length) {
      const next = JOURNEY_STEPS[nextIdx].id
      router.push(buildUrl(next, sessionId, journeyMode !== 'new' ? journeyMode : undefined))
    }
  }, [router, currentStepIndex, sessionId, journeyMode])

  const previousStep = useCallback(() => {
    const prevIdx = currentStepIndex - 1
    if (prevIdx >= 0) {
      router.push(buildUrl(JOURNEY_STEPS[prevIdx].id, sessionId, journeyMode !== 'new' ? journeyMode : undefined))
    }
  }, [router, currentStepIndex, sessionId, journeyMode])

  const resetJourney = useCallback(() => {
    router.push('/upload')
  }, [router])

  const skipToAnalysis = useCallback(() => {
    if (sessionId) {
      router.push(`/analysis?session=${sessionId}`)
    }
  }, [router, sessionId])

  const setJourneyMode = useCallback((mode: JourneyMode) => {
    // Rebuild current URL with new mode
    const params = new URLSearchParams(searchParams.toString())
    if (mode === 'reprocess') {
      params.set('mode', 'reprocess')
    } else {
      params.delete('mode')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const startReprocess = useCallback((sid: string) => {
    router.push(`/upload?session=${sid}&step=processing&mode=reprocess`)
  }, [router])

  // Step status (for stepper visualization)
  const getStepStatus = useCallback((step: JourneyStep): StepStatus => {
    const idx = getStepIndex(step)
    if (idx < currentStepIndex) return 'completed'
    if (idx === currentStepIndex) return 'current'
    return 'locked'
  }, [currentStepIndex])

  const getStepInfo = useCallback((step: JourneyStep): StepInfo | undefined => {
    return JOURNEY_STEPS.find(s => s.id === step)
  }, [])

  const getStepLabel = useCallback((step: JourneyStep): string => {
    if (journeyMode === 'reprocess' && step === 'upload') return 'Reprocess'
    return JOURNEY_STEPS.find(s => s.id === step)?.label ?? step
  }, [journeyMode])

  const canNavigateTo = useCallback((step: JourneyStep): boolean => {
    return getStepIndex(step) <= currentStepIndex
  }, [currentStepIndex])

  // Computed
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === JOURNEY_STEPS.length - 1

  const completedSteps = useMemo((): JourneyStep[] => {
    return JOURNEY_STEPS.filter(s => s.order < currentStepIndex).map(s => s.id)
  }, [currentStepIndex])

  const progressPercentage = useMemo(() => {
    return Math.round((currentStepIndex / (JOURNEY_STEPS.length - 1)) * 100)
  }, [currentStepIndex])

  const value: JourneyContextType = {
    currentStep,
    journeyMode,
    setJourneyMode,
    startReprocess,
    goToStep,
    nextStep,
    previousStep,
    resetJourney,
    skipToAnalysis,
    getStepStatus,
    getStepInfo,
    getStepLabel,
    canNavigateTo,
    isFirstStep,
    isLastStep,
    currentStepIndex,
    completedSteps,
    progressPercentage,
  }

  return (
    <JourneyContext.Provider value={value}>
      {children}
    </JourneyContext.Provider>
  )
}

// -----------------------------------------------------------------------
// Hooks (same API as before)
// -----------------------------------------------------------------------

export function useJourney(): JourneyContextType {
  const context = useContext(JourneyContext)
  if (!context) {
    throw new Error('useJourney must be used within JourneyProvider')
  }
  return context
}

export function useIsStepActive(step: JourneyStep): boolean {
  const { currentStep } = useJourney()
  return currentStep === step
}

export function useIsStepCompleted(step: JourneyStep): boolean {
  const { getStepStatus } = useJourney()
  return getStepStatus(step) === 'completed'
}
