/**
 * Journey Context - Workflow Step Management
 *
 * Manages the current step in the analysis workflow:
 * Upload -> Validation -> Processing -> Profile -> Analysis
 *
 * Following Lumiere pattern: UI state only, no server data
 * IMPORTANT: currentStep is persisted to localStorage to survive page refresh
 * 
 * SESSION INTEGRATION:
 * Journey resets to 'upload' when sessionId becomes null (multi-tab isolation)
 */

'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode
} from 'react'
import { useSession } from './SessionContext'

const STORAGE_KEY = 'helix_journey_step'

/**
 * Workflow steps in order
 */
export type JourneyStep = 'upload' | 'validation' | 'processing' | 'profile' | 'analysis'

/**
 * Step status for UI rendering
 */
export type StepStatus = 'completed' | 'current' | 'locked'

/**
 * Step metadata for rendering
 */
export interface StepInfo {
  id: JourneyStep
  label: string
  description: string
  order: number
}

/**
 * All steps with metadata
 * Order: Upload -> Validation -> Processing -> Profile -> Analysis
 *
 * Profile is AFTER Processing because:
 * 1. We need variants in DuckDB to run phenotype matching
 * 2. User can skip profile and go directly to analysis
 * 3. Better UX - user sees clinical context before analysis
 */
export const JOURNEY_STEPS: readonly StepInfo[] = [
  {
    id: 'upload',
    label: 'Upload',
    description: 'Upload VCF file for analysis',
    order: 0,
  },
  {
    id: 'validation',
    label: 'Validation',
    description: 'Quality control and validation',
    order: 1,
  },
  {
    id: 'processing',
    label: 'Processing',
    description: 'Analyzing variants with ACMG classification',
    order: 2,
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Patient clinical profile and phenotype matching',
    order: 3,
  },
  {
    id: 'analysis',
    label: 'Analysis',
    description: 'View and analyze variants',
    order: 4,
  },
] as const

/**
 * Context type definition
 */
interface JourneyContextType {
  // Current step
  currentStep: JourneyStep

  // Navigation actions
  goToStep: (step: JourneyStep) => void
  nextStep: () => void
  previousStep: () => void
  resetJourney: () => void
  skipToAnalysis: () => void

  // Step utilities
  getStepStatus: (step: JourneyStep) => StepStatus
  getStepInfo: (step: JourneyStep) => StepInfo | undefined
  canNavigateTo: (step: JourneyStep) => boolean

  // Computed values
  isFirstStep: boolean
  isLastStep: boolean
  currentStepIndex: number
  completedSteps: JourneyStep[]

  // Progress
  progressPercentage: number
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined)

interface JourneyProviderProps {
  children: ReactNode
  initialStep?: JourneyStep
}

export function JourneyProvider({
  children,
  initialStep = 'upload'
}: JourneyProviderProps) {
  const { currentSessionId } = useSession()
  const [currentStep, setCurrentStepState] = useState<JourneyStep>(initialStep)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        let step = parsed.step

        // Migration: phenotype -> profile
        if (step === 'phenotype') {
          step = 'profile'
        }

        if (step && JOURNEY_STEPS.some(s => s.id === step)) {
          setCurrentStepState(step)
        }
      } catch (e) {
        console.error('Failed to parse stored journey step:', e)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsHydrated(true)
  }, [])

  // Auto-reset journey when sessionId becomes null
  useEffect(() => {
    if (currentSessionId === null) {
      console.log('[JourneyContext] Session cleared - resetting to upload')
      setCurrentStepState('upload')
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [currentSessionId])

  // Persist step to localStorage
  const setCurrentStep = useCallback((step: JourneyStep) => {
    setCurrentStepState(step)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step }))
  }, [])

  // Get step order index
  const getStepIndex = useCallback((step: JourneyStep): number => {
    const stepInfo = JOURNEY_STEPS.find(s => s.id === step)
    return stepInfo?.order ?? 0
  }, [])

  // Current step index
  const currentStepIndex = useMemo(() => {
    return getStepIndex(currentStep)
  }, [currentStep, getStepIndex])

  // Check if can navigate to a step
  const canNavigateTo = useCallback((step: JourneyStep): boolean => {
    const targetIndex = getStepIndex(step)
    return targetIndex <= currentStepIndex
  }, [currentStepIndex, getStepIndex])

  // Navigate to specific step
  const goToStep = useCallback((step: JourneyStep) => {
    const targetIndex = getStepIndex(step)
    if (targetIndex <= currentStepIndex + 1) {
      setCurrentStep(step)
    }
  }, [currentStepIndex, getStepIndex, setCurrentStep])

  // Go to next step
  const nextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < JOURNEY_STEPS.length) {
      setCurrentStep(JOURNEY_STEPS[nextIndex].id)
    }
  }, [currentStepIndex, setCurrentStep])

  // Go to previous step
  const previousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(JOURNEY_STEPS[prevIndex].id)
    }
  }, [currentStepIndex, setCurrentStep])

  // Skip profile and go directly to analysis
  const skipToAnalysis = useCallback(() => {
    setCurrentStep('analysis')
  }, [setCurrentStep])

  // Reset to first step and clear storage
  const resetJourney = useCallback(() => {
    setCurrentStepState('upload')
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Get status of a step relative to current
  const getStepStatus = useCallback((step: JourneyStep): StepStatus => {
    const stepIndex = getStepIndex(step)

    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'current'
    return 'locked'
  }, [currentStepIndex, getStepIndex])

  // Get step info by id
  const getStepInfo = useCallback((step: JourneyStep): StepInfo | undefined => {
    return JOURNEY_STEPS.find(s => s.id === step)
  }, [])

  // Computed values
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === JOURNEY_STEPS.length - 1

  const completedSteps = useMemo((): JourneyStep[] => {
    return JOURNEY_STEPS
      .filter(step => step.order < currentStepIndex)
      .map(step => step.id)
  }, [currentStepIndex])

  const progressPercentage = useMemo(() => {
    return Math.round((currentStepIndex / (JOURNEY_STEPS.length - 1)) * 100)
  }, [currentStepIndex])

  const value: JourneyContextType = {
    currentStep,
    goToStep,
    nextStep,
    previousStep,
    resetJourney,
    skipToAnalysis,
    getStepStatus,
    getStepInfo,
    canNavigateTo,
    isFirstStep,
    isLastStep,
    currentStepIndex,
    completedSteps,
    progressPercentage,
  }

  // Don't render children until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return null
  }

  return (
    <JourneyContext.Provider value={value}>
      {children}
    </JourneyContext.Provider>
  )
}

/**
 * Hook to access journey context
 */
export function useJourney(): JourneyContextType {
  const context = useContext(JourneyContext)
  if (!context) {
    throw new Error('useJourney must be used within JourneyProvider')
  }
  return context
}

/**
 * Hook to check if a specific step is active
 */
export function useIsStepActive(step: JourneyStep): boolean {
  const { currentStep } = useJourney()
  return currentStep === step
}

/**
 * Hook to check if a specific step is completed
 */
export function useIsStepCompleted(step: JourneyStep): boolean {
  const { getStepStatus } = useJourney()
  return getStepStatus(step) === 'completed'
}
