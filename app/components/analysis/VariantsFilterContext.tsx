"use client"

/**
 * Variants Filter Context - Isolated Filter State Management
 * This context manages filter state WITHOUT subscribing to data
 * Prevents filter UI from re-rendering when data changes
 */

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import type { VariantFilters } from '@/types/variant.types'

interface VariantsFilterContextType {
  // Filter state
  filters: VariantFilters
  geneInput: string
  debouncedGene: string
  
  // Computed
  activeFilters: VariantFilters
  isSearching: boolean
  hasActiveFilters: boolean
  
  // Actions
  setGeneInput: (value: string) => void
  updateFilter: (key: keyof VariantFilters, value: any) => void
  clearAllFilters: () => void
  setPage: (page: number) => void
}

const VariantsFilterContext = createContext<VariantsFilterContextType | undefined>(undefined)

interface VariantsFilterProviderProps {
  children: ReactNode
}

export function VariantsFilterProvider({ children }: VariantsFilterProviderProps) {
  // State
  const [geneInput, setGeneInput] = useState('')
  const [debouncedGene, setDebouncedGene] = useState('')
  const [filters, setFilters] = useState<VariantFilters>({
    page: 1,
    page_size: 50,
  })

  // Debounce gene input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGene(geneInput.trim())
    }, 200)
    return () => clearTimeout(timer)
  }, [geneInput])

  // Compute active filters (includes debounced gene)
  const activeFilters = useMemo(() => ({
    ...filters,
    genes: debouncedGene ? [debouncedGene] : undefined,
  }), [filters, debouncedGene])

  // Computed values
  const isSearching = geneInput.trim() !== debouncedGene
  const hasActiveFilters = !!(filters.acmg_class || filters.impact || debouncedGene)

  // Actions
  const updateFilter = useCallback((key: keyof VariantFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({ page: 1, page_size: 50 })
    setGeneInput('')
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  const value: VariantsFilterContextType = {
    filters,
    geneInput,
    debouncedGene,
    activeFilters,
    isSearching,
    hasActiveFilters,
    setGeneInput,
    updateFilter,
    clearAllFilters,
    setPage,
  }

  return (
    <VariantsFilterContext.Provider value={value}>
      {children}
    </VariantsFilterContext.Provider>
  )
}

export function useVariantsFilter(): VariantsFilterContextType {
  const context = useContext(VariantsFilterContext)
  if (!context) {
    throw new Error('useVariantsFilter must be used within VariantsFilterProvider')
  }
  return context
}
