/**
 * Global Reset Hook
 * Clears ALL application contexts and resets to initial state
 * 
 * Use this when:
 * - User clicks "Clear File"
 * - User logs out
 * - Starting a completely new session
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/contexts/SessionContext'
import { useJourney } from '@/contexts/JourneyContext'
import { useClinicalInterpretation } from '@/contexts/ClinicalInterpretationContext'
import { useLiteratureResults } from '@/contexts/LiteratureResultsContext'
import { usePhenotypeResults } from '@/contexts/PhenotypeResultsContext'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'

/**
 * Hook that provides a single function to reset ALL application state
 */
export function useGlobalReset() {
  const router = useRouter()
  
  // Get all context setters
  const { setCurrentSessionId, setSelectedModule, setSelectedVariantId, setSelectedPublicationId, closeDetails, closePhenotypePanel, hideChat } = useSession()
  const { resetJourney } = useJourney()
  const { setInterpretation, setIsGenerating } = useClinicalInterpretation()
  const { clearResults: clearLiterature } = useLiteratureResults()
  const { clearResults: clearPhenotype } = usePhenotypeResults()
  const { clearScreeningResponse } = useScreeningResults()

  /**
   * Reset ALL application state and navigate to clean /analysis page
   * 
   * This will:
   * 1. Clear SessionContext (sessionId, selections, panels)
   * 2. Reset JourneyContext to 'upload' step
   * 3. Clear ClinicalInterpretationContext
   * 4. Clear LiteratureResultsContext
   * 5. Clear PhenotypeResultsContext
   * 6. Clear ScreeningResultsContext
   * 7. Navigate to /analysis (without sessionId)
   */
  const resetAll = useCallback(() => {
    console.log('[GlobalReset] Resetting all application state...')

    // 1. Clear Session Context
    setCurrentSessionId(null)
    setSelectedModule(null)
    setSelectedVariantId(null)
    setSelectedPublicationId(null)
    closeDetails()
    closePhenotypePanel()
    hideChat()

    // 2. Reset Journey to upload step
    resetJourney()

    // 3. Clear Clinical Interpretation
    setInterpretation('')
    setIsGenerating(false)

    // 4. Clear Literature Results
    clearLiterature()

    // 5. Clear Phenotype Results
    clearPhenotype()

    // 6. Clear Screening Results
    clearScreeningResponse()

    // 7. Navigate to clean /analysis page (without sessionId)
    router.push('/analysis')

    console.log('[GlobalReset] Reset complete - navigating to /analysis')
  }, [
    setCurrentSessionId,
    setSelectedModule,
    setSelectedVariantId,
    setSelectedPublicationId,
    closeDetails,
    closePhenotypePanel,
    hideChat,
    resetJourney,
    setInterpretation,
    setIsGenerating,
    clearLiterature,
    clearPhenotype,
    clearScreeningResponse,
    router,
  ])

  return { resetAll }
}
