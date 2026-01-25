"use client"

/**
 * ScreeningResultsContext - Store and provide screening analysis results
 * 
 * Stores screening summary for AI context and analysis display
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { ScreeningSummary } from '@/lib/api/screening'

interface ScreeningResultsContextValue {
  screeningSummary: ScreeningSummary | null
  setScreeningSummary: (summary: ScreeningSummary) => void
  clearScreeningSummary: () => void
}

const ScreeningResultsContext = createContext<ScreeningResultsContextValue | undefined>(undefined)

interface ScreeningResultsProviderProps {
  children: ReactNode
}

export function ScreeningResultsProvider({ children }: ScreeningResultsProviderProps) {
  const [screeningSummary, setScreeningSummaryState] = useState<ScreeningSummary | null>(null)

  const setScreeningSummary = useCallback((summary: ScreeningSummary) => {
    console.log('='.repeat(80))
    console.log('SCREENING RESULTS SAVED TO CONTEXT')
    console.log('='.repeat(80))
    console.log(JSON.stringify(summary, null, 2))
    console.log('='.repeat(80))
    setScreeningSummaryState(summary)
  }, [])

  const clearScreeningSummary = useCallback(() => {
    console.log('Clearing screening summary')
    setScreeningSummaryState(null)
  }, [])

  return (
    <ScreeningResultsContext.Provider
      value={{
        screeningSummary,
        setScreeningSummary,
        clearScreeningSummary,
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
