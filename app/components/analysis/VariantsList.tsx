"use client"

/**
 * VariantsList - Filters + Table wrapper
 * Filters are MEMOIZED to prevent re-render
 */

import { useState, useMemo, useCallback, useEffect, memo } from 'react'
import { useVariants } from '@/hooks/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, X, Loader2, AlertCircle } from 'lucide-react'
import { VariantsTable } from './VariantsTable'
import type { VariantFilters } from '@/types/variant.types'

interface VariantsListProps {
  sessionId: string
}

const ACMG_CLASSES = [
  'Pathogenic',
  'Likely Pathogenic',
  'Uncertain Significance',
  'Likely Benign',
  'Benign',
]

const IMPACT_LEVELS = ['HIGH', 'MODERATE', 'LOW', 'MODIFIER']

// Memoized Filter Controls - won't re-render
const FilterControls = memo(({ 
  geneInput, 
  onGeneInputChange, 
  filters, 
  onFilterChange,
  isSearching,
  isFetching 
}: {
  geneInput: string
  onGeneInputChange: (value: string) => void
  filters: VariantFilters
  onFilterChange: (key: keyof VariantFilters, value: any) => void
  isSearching: boolean
  isFetching: boolean
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    <Select
      value={filters.acmg_class?.[0] || 'all'}
      onValueChange={(value) =>
        onFilterChange('acmg_class', value === 'all' ? undefined : [value])
      }
    >
      <SelectTrigger className="text-base">
        <SelectValue placeholder="ACMG Classification" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        {ACMG_CLASSES.map((cls) => (
          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Select
      value={filters.impact?.[0] || 'all'}
      onValueChange={(value) =>
        onFilterChange('impact', value === 'all' ? undefined : [value])
      }
    >
      <SelectTrigger className="text-base">
        <SelectValue placeholder="Impact" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        {IMPACT_LEVELS.map((impact) => (
          <SelectItem key={impact} value={impact}>{impact}</SelectItem>
        ))}
      </SelectContent>
    </Select>

    <div className="relative">
      <Input
        placeholder="e.g., BRCA1"
        value={geneInput}
        onChange={(e) => onGeneInputChange(e.target.value)}
        className="text-base pr-8"
      />
      {(isSearching || isFetching) && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  </div>
))
FilterControls.displayName = 'FilterControls'

// Memoized Active Filters Display
const ActiveFilters = memo(({ 
  filters, 
  debouncedGene, 
  onClearAll 
}: {
  filters: VariantFilters
  debouncedGene: string
  onClearAll: () => void
}) => {
  const hasActiveFilters = !!(filters.acmg_class || filters.impact || debouncedGene)
  
  if (!hasActiveFilters) return null

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-2">
        {filters.acmg_class?.map((cls) => (
          <Badge key={cls} variant="secondary" className="text-sm">{cls}</Badge>
        ))}
        {filters.impact?.map((imp) => (
          <Badge key={imp} variant="secondary" className="text-sm">{imp}</Badge>
        ))}
        {debouncedGene && (
          <Badge variant="secondary" className="text-sm">{debouncedGene}</Badge>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onClearAll} className="shrink-0">
        <X className="h-4 w-4 mr-1" />
        <span className="text-sm">Clear All</span>
      </Button>
    </div>
  )
})
ActiveFilters.displayName = 'ActiveFilters'

export function VariantsList({ sessionId }: VariantsListProps) {
  // State
  const [geneInput, setGeneInput] = useState('')
  const [debouncedGene, setDebouncedGene] = useState('')
  const [filters, setFilters] = useState<VariantFilters>({
    page: 1,
    page_size: 50,
  })

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGene(geneInput.trim())
    }, 200)
    return () => clearTimeout(timer)
  }, [geneInput])

  // Compute filters
  const activeFilters = useMemo(() => ({
    ...filters,
    genes: debouncedGene ? [debouncedGene] : undefined,
  }), [filters, debouncedGene])

  // Query
  const { data, isLoading, error, isFetching } = useVariants(sessionId, activeFilters)

  // Handlers - memoized
  const handleFilterChange = useCallback((key: keyof VariantFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({ page: 1, page_size: 50 })
    setGeneInput('')
  }, [])

  const isSearching = geneInput.trim() !== debouncedGene

  // Initial Loading
  if (isLoading && !data) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Variants</CardTitle>
              <p className="text-md text-muted-foreground mt-1">Loading variants...</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error State
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="text-base font-medium">Failed to load variants</p>
              <p className="text-md text-muted-foreground">{error.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Variants</CardTitle>
            {/* This updates but doesn't cause filter re-render */}
            <p className="text-md text-muted-foreground mt-1">
              {data ? `Showing ${data.variants.length} of ${data.total_count.toLocaleString()} variants` : 'Loading...'}
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            <span className="text-sm">Export</span>
          </Button>
        </div>

        {/* Memoized Filters - won't re-render on data change */}
        <div className="pt-4 space-y-3">
          <FilterControls
            geneInput={geneInput}
            onGeneInputChange={setGeneInput}
            filters={filters}
            onFilterChange={handleFilterChange}
            isSearching={isSearching}
            isFetching={isFetching}
          />
          
          <ActiveFilters
            filters={filters}
            debouncedGene={debouncedGene}
            onClearAll={clearAllFilters}
          />
        </div>
      </CardHeader>

      {/* TABLE - Only this re-renders on data change */}
      <CardContent className="p-0">
        <VariantsTable
          data={data}
          isFetching={isFetching}
          onPageChange={handlePageChange}
        />
      </CardContent>
    </Card>
  )
}
