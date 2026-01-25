"use client"

/**
 * ScreeningResultsContext - Store and provide screening analysis results
 * 
 * Stores screening results for AI context and analysis display
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface ScreeningResult {
  session_id: string
  total_variants_screened: number
  flagged_variants: number
  high_priority_count?: number
  medium_priority_count?: number
  low_priority_count?: number
  screening_mode: string
  ethnicity?: string
  patient_age?: number
  patient_sex?: string
  has_hpo_terms: boolean
  hpo_term_count?: number
  indication?: string
  has_family_history?: boolean
  timestamp: string
}

interface ScreeningResultsContextValue {
  screeningResult: ScreeningResult | null
  setScreeningResult: (result: ScreeningResult) => void
  clearScreeningResult: () => void
}

const ScreeningResultsContext = createContext<ScreeningResultsContextValue | undefined>(undefined)

interface ScreeningResultsProviderProps {
  children: ReactNode
}

export function ScreeningResultsProvider({ children }: ScreeningResultsProviderProps) {
  const [screeningResult, setScreeningResultState] = useState<ScreeningResult | null>(null)

  const setScreeningResult = useCallback((result: ScreeningResult) => {
    console.log('Setting screening result:', result)
    setScreeningResultState(result)
  }, [])

  const clearScreeningResult = useCallback(() => {
    console.log('Clearing screening result')
    setScreeningResultState(null)
  }, [])

  return (
    <ScreeningResultsContext.Provider
      value={{
        screeningResult,
        setScreeningResult,
        clearScreeningResult,
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
