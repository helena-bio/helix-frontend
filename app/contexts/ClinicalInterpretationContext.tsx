"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

interface ClinicalInterpretationContextValue {
  interpretation: string | null
  setInterpretation: (text: string | ((prev: string | null) => string)) => void
  clearInterpretation: () => void
  hasInterpretation: () => boolean
}

const ClinicalInterpretationContext = createContext<ClinicalInterpretationContextValue | undefined>(
  undefined
)

export function ClinicalInterpretationProvider({ children }: { children: React.ReactNode }) {
  const [interpretation, setInterpretationState] = useState<string | null>(null)

  const setInterpretation = useCallback((text: string | ((prev: string | null) => string)) => {
    if (typeof text === 'function') {
      setInterpretationState((prev) => {
        const newText = text(prev)
        console.log('[ClinicalInterpretationContext] Setting interpretation (functional):', newText.substring(0, 100) + '...')
        return newText
      })
    } else {
      console.log('[ClinicalInterpretationContext] Setting interpretation:', text.substring(0, 100) + '...')
      setInterpretationState(text)
    }
  }, [])

  const clearInterpretation = useCallback(() => {
    console.log('[ClinicalInterpretationContext] Clearing interpretation')
    setInterpretationState(null)
  }, [])

  const hasInterpretation = useCallback(() => {
    return interpretation !== null && interpretation.length > 0
  }, [interpretation])

  return (
    <ClinicalInterpretationContext.Provider
      value={{
        interpretation,
        setInterpretation,
        clearInterpretation,
        hasInterpretation,
      }}
    >
      {children}
    </ClinicalInterpretationContext.Provider>
  )
}

export function useClinicalInterpretation() {
  const context = useContext(ClinicalInterpretationContext)
  if (context === undefined) {
    throw new Error('useClinicalInterpretation must be used within ClinicalInterpretationProvider')
  }
  return context
}
