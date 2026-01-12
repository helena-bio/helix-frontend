/**
 * Phenotype Context Provider
 *
 * Manages patient phenotype data (HPO terms) for the current session.
 * Provides methods to add/remove terms and update clinical notes.
 */

'use client'

import { createContext, useContext, ReactNode } from 'react'
import { usePhenotype } from '@/hooks/queries/use-phenotype'
import { useSavePhenotype } from '@/hooks/mutations/use-phenotype-mutations'
import { PatientPhenotype, SavePhenotypeRequest } from '@/lib/api/hpo'

interface PhenotypeContextValue {
  // Data
  phenotype: PatientPhenotype | null
  isLoading: boolean
  error: Error | null

  // Actions
  updatePhenotype: (data: SavePhenotypeRequest) => Promise<void>
  addHPOTerm: (term: { hpo_id: string; name: string; definition?: string }) => Promise<void>
  removeHPOTerm: (hpoId: string) => Promise<void>
  updateClinicalNotes: (notes: string) => Promise<void>
  refetch: () => Promise<void>

  // Computed
  hpoTermIds: string[]
  termCount: number
}

const PhenotypeContext = createContext<PhenotypeContextValue | undefined>(undefined)

interface PhenotypeProviderProps {
  sessionId: string | null
  children: ReactNode
}

export function PhenotypeProvider({ sessionId, children }: PhenotypeProviderProps) {
  const {
    data: phenotype,
    isLoading,
    error,
    refetch,
  } = usePhenotype(sessionId)

  const saveMutation = useSavePhenotype()

  const updatePhenotype = async (data: SavePhenotypeRequest) => {
    if (!sessionId) throw new Error('No session ID')
    await saveMutation.mutateAsync({ sessionId, data })
  }

  const addHPOTerm = async (term: { hpo_id: string; name: string; definition?: string }) => {
    if (!sessionId) throw new Error('No session ID')

    const existingTerms = phenotype?.hpo_terms || []
    
    // Check if term already exists
    if (existingTerms.some(t => t.hpo_id === term.hpo_id)) {
      return
    }

    const updatedData: SavePhenotypeRequest = {
      hpo_terms: [...existingTerms, term],
      clinical_notes: phenotype?.clinical_notes || '',
    }

    await saveMutation.mutateAsync({ sessionId, data: updatedData })
  }

  const removeHPOTerm = async (hpoId: string) => {
    if (!sessionId) throw new Error('No session ID')

    const existingTerms = phenotype?.hpo_terms || []
    const updatedData: SavePhenotypeRequest = {
      hpo_terms: existingTerms.filter(t => t.hpo_id !== hpoId),
      clinical_notes: phenotype?.clinical_notes || '',
    }

    await saveMutation.mutateAsync({ sessionId, data: updatedData })
  }

  const updateClinicalNotes = async (notes: string) => {
    if (!sessionId) throw new Error('No session ID')

    const updatedData: SavePhenotypeRequest = {
      hpo_terms: phenotype?.hpo_terms || [],
      clinical_notes: notes,
    }

    await saveMutation.mutateAsync({ sessionId, data: updatedData })
  }

  const value: PhenotypeContextValue = {
    phenotype,
    isLoading,
    error: error as Error | null,
    updatePhenotype,
    addHPOTerm,
    removeHPOTerm,
    updateClinicalNotes,
    refetch: async () => {
      await refetch()
    },
    hpoTermIds: phenotype?.hpo_terms.map(t => t.hpo_id) || [],
    termCount: phenotype?.term_count || 0,
  }

  return <PhenotypeContext.Provider value={value}>{children}</PhenotypeContext.Provider>
}

export function usePhenotypeContext(): PhenotypeContextValue {
  const context = useContext(PhenotypeContext)
  if (!context) {
    throw new Error('usePhenotypeContext must be used within PhenotypeProvider')
  }
  return context
}
