"use client"

/**
 * VariantsList Component - Paginated Variants Table with Integrated Filters
 */

import { useState, useMemo } from 'react'
import { useVariants } from '@/hooks/queries'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Search,
  Download,
  X
} from 'lucide-react'
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

const getACMGColor = (classification: string | null) => {
  switch (classification) {
    case 'Pathogenic':
      return 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100 border-red-300'
    case 'Likely Pathogenic':
      return 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100 border-orange-300'
    case 'Uncertain Significance':
    case 'VUS':
      return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100 border-yellow-300'
    case 'Likely Benign':
      return 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100 border-blue-300'
    case 'Benign':
      return 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100 border-green-300'
    default:
      return 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
  }
}

const getACMGShortName = (classification: string | null) => {
  if (classification === 'Uncertain Significance') return 'VUS'
  return classification
}

export function VariantsList({ sessionId }: VariantsListProps) {
  // Filters state
  const [filters, setFilters] = useState<VariantFilters>({
    page: 1,
    page_size: 50,
  })
  const [geneSearch, setGeneSearch] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Query
  const { data, isLoading, error } = useVariants(sessionId, filters)

  // Handlers
  const handleFilterChange = (key: keyof VariantFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleGeneSearchSubmit = () => {
    if (geneSearch.trim()) {
      handleFilterChange('genes', [geneSearch.trim().toUpperCase()])
    } else {
      handleFilterChange('genes', undefined)
    }
  }

  const clearAllFilters = () => {
    setFilters({ page: 1, page_size: 50 })
    setGeneSearch('')
  }

  const toggleRow = (variantIdx: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(variantIdx)) {
        next.delete(variantIdx)
      } else {
        next.add(variantIdx)
      }
      return next
    })
  }

  // Computed
  const totalPages = useMemo(() => {
    if (!data) return 0
    return data.total_pages
  }, [data])

  const hasActiveFilters = !!(filters.acmg_class || filters.impact || filters.genes)

  // Loading State
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
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

  // Empty State
  if (!data || data.variants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No variants found</p>
            <p className="text-md text-muted-foreground">
              Try adjusting your filters
            </p>
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
            <p className="text-md text-muted-foreground mt-1">
              Showing {data.variants.length} of {data.total_count.toLocaleString()} variants
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            <span className="text-sm">Export</span>
          </Button>
        </div>

        {/* Integrated Filters */}
        <div className="pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* ACMG Classification */}
            <Select
              value={filters.acmg_class?.[0] || 'all'}
              onValueChange={(value) =>
                handleFilterChange(
                  'acmg_class',
                  value === 'all' ? undefined : [value]
                )
              }
            >
              <SelectTrigger className="text-base">
                <SelectValue placeholder="ACMG Classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {ACMG_CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Impact */}
            <Select
              value={filters.impact?.[0] || 'all'}
              onValueChange={(value) =>
                handleFilterChange(
                  'impact',
                  value === 'all' ? undefined : [value]
                )
              }
            >
              <SelectTrigger className="text-base">
                <SelectValue placeholder="Impact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {IMPACT_LEVELS.map((impact) => (
                  <SelectItem key={impact} value={impact}>
                    {impact}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Gene Search */}
            <div className="flex gap-2">
              <Input
                placeholder="e.g., BRCA1"
                value={geneSearch}
                onChange={(e) => setGeneSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGeneSearchSubmit()
                }}
                className="text-base"
              />
              <Button
                size="icon"
                onClick={handleGeneSearchSubmit}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters + Clear All */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {filters.acmg_class?.map((cls) => (
                  <Badge key={cls} variant="secondary" className="text-sm">
                    {cls}
                  </Badge>
                ))}
                {filters.impact?.map((imp) => (
                  <Badge key={imp} variant="secondary" className="text-sm">
                    {imp}
                  </Badge>
                ))}
                {filters.genes?.map((gene) => (
                  <Badge key={gene} variant="secondary" className="text-sm">
                    {gene}
                  </Badge>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="shrink-0"
              >
                <X className="h-4 w-4 mr-1" />
                <span className="text-sm">Clear All</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="text-base">Gene</TableHead>
                <TableHead className="text-base">Position</TableHead>
                <TableHead className="text-base">Change</TableHead>
                <TableHead className="text-base">Consequence</TableHead>
                <TableHead className="text-base">ACMG</TableHead>
                <TableHead className="text-base">gnomAD AF</TableHead>
                <TableHead className="text-base">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.variants.map((variant: any) => (
                <>
                  <TableRow
                    key={variant.variant_idx}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleRow(variant.variant_idx)}
                  >
                    <TableCell>
                      {expandedRows.has(variant.variant_idx) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="text-base font-medium">
                      {variant.gene_symbol || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {variant.chromosome}:{variant.position.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {variant.reference_allele}/{variant.alternate_allele}
                    </TableCell>
                    <TableCell className="text-sm">
                      {variant.consequence || '-'}
                    </TableCell>
                    <TableCell>
                      {variant.acmg_class ? (
                        <Badge
                          variant="outline"
                          className={`text-sm ${getACMGColor(variant.acmg_class)}`}
                        >
                          {getACMGShortName(variant.acmg_class)}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {variant.global_af
                        ? variant.global_af.toExponential(2)
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-base">
                      {variant.priority_score
                        ? variant.priority_score.toFixed(1)
                        : '-'
                      }
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row */}
                  {expandedRows.has(variant.variant_idx) && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-muted/30">
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">HGVS Protein</p>
                              <p className="text-base font-mono">{variant.hgvs_protein || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Impact</p>
                              <Badge variant="secondary" className="text-sm">{variant.impact || '-'}</Badge>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Genotype</p>
                              <p className="text-base font-mono">{variant.genotype || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Depth</p>
                              <p className="text-base">{variant.depth || '-'}</p>
                            </div>
                          </div>

                          {variant.acmg_criteria && variant.acmg_criteria.length > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">ACMG Criteria</p>
                              <div className="flex flex-wrap gap-2">
                                {variant.acmg_criteria.split(',').filter((c: string) => c.trim()).map((c: string) => (
                                  <Badge key={c} variant="outline" className="text-sm">{c.trim()}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {variant.clinical_significance && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">ClinVar</p>
                              <p className="text-base">{variant.clinical_significance}</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <p className="text-md text-muted-foreground">
            Page {data.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_previous_page}
              onClick={() => handlePageChange(filters.page! - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="text-base">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_next_page}
              onClick={() => handlePageChange(filters.page! + 1)}
            >
              <span className="text-base">Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
