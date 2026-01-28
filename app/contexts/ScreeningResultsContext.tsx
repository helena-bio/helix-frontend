"use client"

/**
 * ScreeningResultsContext - Store and provide screening analysis results
 *
 * Stores complete screening response (summary + tier results) for display and AI context
 * Auto-cleanup when session changes or becomes null
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { ScreeningResponse } from '@/lib/api/screening'

interface ScreeningResultsContextValue {
  screeningResponse: ScreeningResponse | null
  setScreeningResponse: (response: ScreeningResponse) => void
  clearScreeningResponse: () => void
}

const ScreeningResultsContext = createContext<ScreeningResultsContextValue | undefined>(undefined)

interface ScreeningResultsProviderProps {
  sessionId: string | null
  children: ReactNode
}

export function ScreeningResultsProvider({ sessionId, children }: ScreeningResultsProviderProps) {
  const [screeningResponse, setScreeningResponseState] = useState<ScreeningResponse | null>(null)

  // Auto-cleanup when session changes or becomes null
  useEffect(() => {
    if (sessionId === null) {
      console.log('[ScreeningResultsContext] Session cleared - resetting screening results')
      setScreeningResponseState(null)
    }
  }, [sessionId])

  const setScreeningResponse = useCallback((response: ScreeningResponse) => {
    console.log('='.repeat(80))
    console.log('SCREENING RESULTS SAVED TO CONTEXT')
    console.log('='.repeat(80))
    console.log('Summary:', JSON.stringify(response.summary, null, 2))
    console.log('Tier 1 results:', response.tier1_results.length)
    console.log('Tier 2 results:', response.tier2_results.length)
    console.log('Tier 3 results:', response.tier3_results.length)
    console.log('Tier 4 results:', response.tier4_results.length)
    console.log('='.repeat(80))
    setScreeningResponseState(response)
  }, [])

  const clearScreeningResponse = useCallback(() => {
    console.log('Clearing screening response')
    setScreeningResponseState(null)
  }, [])

  return (
    <ScreeningResultsContext.Provider
      value={{
        screeningResponse,
        setScreeningResponse,
        clearScreeningResponse,
      }}
    >
      {children}
    </ScreeningResultsContext.Provider>
  )
}

export function useScreeningResults() {
  const context = useContext(ScreeningResultsContext)
  if (!context) {
    throw new Error('useScreeningResults must be used within ScreeningResultsProvider')
  }
  return context
}
