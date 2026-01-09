"use client"

/**
 * Filter Section - Completely Isolated from Data Fetching
 * This component NEVER re-renders when table data changes
 * Only re-renders when filter state changes (user interaction)
 */

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, X, Loader2 } from 'lucide-react'
import { useVariantsFilter } from './VariantsFilterContext'

interface FilterSectionProps {
  isFetching: boolean
  totalCount?: number
  currentCount?: number
}

const ACMG_CLASSES = [
  'Pathogenic',
  'Likely Pathogenic',
  'Uncertain Significance',
  'Likely Benign',
  'Benign',
]

const IMPACT_LEVELS = ['HIGH', 'MODERATE', 'LOW', 'MODIFIER']

// Filter Controls - Pure UI Component
const FilterControls = memo(({ isFetching }: { isFetching: boolean }) => {
  const { geneInput, setGeneInput, filters, updateFilter, isSearching } = useVariantsFilter()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* ACMG Classification */}
      <div className="space-y-2">
        <Label htmlFor="acmg-filter" className="text-md text-muted-foreground">
          Classification
        </Label>
        <Select
          value={filters.acmg_class?.[0] || 'all'}
          onValueChange={(value) =>
            updateFilter('acmg_class', value === 'all' ? undefined : [value])
          }
        >
          <SelectTrigger id="acmg-filter" className="text-base">
            <SelectValue placeholder="All Classifications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classifications</SelectItem>
            {ACMG_CLASSES.map((cls) => (
              <SelectItem key={cls} value={cls}>{cls}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Impact Level */}
      <div className="space-y-2">
        <Label htmlFor="impact-filter" className="text-md text-muted-foreground">
          Impact Level
        </Label>
        <Select
          value={filters.impact?.[0] || 'all'}
          onValueChange={(value) =>
            updateFilter('impact', value === 'all' ? undefined : [value])
          }
        >
          <SelectTrigger id="impact-filter" className="text-base">
            <SelectValue placeholder="All Impact Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Impact Levels</SelectItem>
            {IMPACT_LEVELS.map((impact) => (
              <SelectItem key={impact} value={impact}>{impact}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gene Search */}
      <div className="space-y-2">
        <Label htmlFor="gene-search" className="text-md text-muted-foreground">
          Search by Gene
        </Label>
        <div className="relative">
          <Input
            id="gene-search"
            placeholder="e.g., BRCA1"
            value={geneInput}
            onChange={(e) => setGeneInput(e.target.value)}
            className="text-base pr-8"
          />
          {(isSearching || isFetching) && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  )
})
FilterControls.displayName = 'FilterControls'

// Active Filters Display
const ActiveFilters = memo(() => {
  const { filters, debouncedGene, hasActiveFilters, clearAllFilters } = useVariantsFilter()

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
      <Button variant="ghost" size="sm" onClick={clearAllFilters} className="shrink-0">
        <X className="h-4 w-4 mr-1" />
        <span className="text-sm">Clear All</span>
      </Button>
    </div>
  )
})
ActiveFilters.displayName = 'ActiveFilters'

// Main Filter Section Component
export const FilterSection = memo(({ isFetching, totalCount, currentCount }: FilterSectionProps) => {
  console.log('🎨 FilterSection render') // Debug log

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Variants</h2>
          <p className="text-md text-muted-foreground mt-1">
            {totalCount !== undefined 
              ? `Showing ${currentCount || 0} of ${totalCount.toLocaleString()} variants`
              : 'Loading...'}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          <span className="text-sm">Export</span>
        </Button>
      </div>

      {/* Filters */}
      <FilterControls isFetching={isFetching} />

      {/* Active Filters */}
      <ActiveFilters />
    </div>
  )
})
FilterSection.displayName = 'FilterSection'
