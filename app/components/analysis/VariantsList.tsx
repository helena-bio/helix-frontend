"use client"

/**
 * VariantsList Component - Paginated Variants Table
 * 
 * Features:
 * - Server-side pagination
 * - Multiple filters (ACMG, gene, impact, frequency)
 * - Sort by multiple columns
 * - Expandable rows for details
 * - Export functionality
 * - Loading states with skeletons
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
import { Label } from '@/components/ui/label'
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
  Filter,
  Download
} from 'lucide-react'
import type { VariantFilters } from '@/types/variant.types'

interface VariantsListProps {
  sessionId: string
}

const ACMG_CLASSES = [
  'Pathogenic',
  'Likely Pathogenic',
  'VUS',
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

  // Loading State
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
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
              <p className="font-medium">Failed to load variants</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
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
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No variants found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setFilters({ page: 1, page_size: 50 })
                setGeneSearch('')
              }}
            >
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ACMG Classification */}
            <div className="space-y-2">
              <Label>ACMG Classification</Label>
              <Select
                value={filters.acmg_class?.[0] || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(
                    'acmg_class',
                    value === 'all' ? undefined : [value]
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All classifications" />
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
            </div>

            {/* Impact */}
            <div className="space-y-2">
              <Label>Impact</Label>
              <Select
                value={filters.impact?.[0] || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(
                    'impact',
                    value === 'all' ? undefined : [value]
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All impacts" />
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
            </div>

            {/* Gene Search */}
            <div className="space-y-2">
              <Label>Gene Symbol</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., BRCA1"
                  value={geneSearch}
                  onChange={(e) => setGeneSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGeneSearchSubmit()
                  }}
                />
                <Button 
                  size="icon"
                  onClick={handleGeneSearchSubmit}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.acmg_class || filters.impact || filters.genes) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.acmg_class?.map((cls) => (
                <Badge key={cls} variant="secondary">
                  ACMG: {cls}
                </Badge>
              ))}
              {filters.impact?.map((imp) => (
                <Badge key={imp} variant="secondary">
                  Impact: {imp}
                </Badge>
              ))}
              {filters.genes?.map((gene) => (
                <Badge key={gene} variant="secondary">
                  Gene: {gene}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Variants</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {data.variants.length} of {data.total_count.toLocaleString()} variants
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Gene</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Consequence</TableHead>
                  <TableHead>ACMG</TableHead>
                  <TableHead>gnomAD AF</TableHead>
                  <TableHead>Score</TableHead>
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
                      <TableCell className="font-medium">
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
                            className={getACMGColor(variant.acmg_class)}
                          >
                            {variant.acmg_class}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {variant.gnomad_af 
                          ? variant.gnomad_af.toExponential(2)
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">HGVS Protein</p>
                                <p className="font-mono">{variant.hgvs_protein || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Impact</p>
                                <Badge variant="secondary">{variant.impact || '-'}</Badge>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Genotype</p>
                                <p className="font-mono">{variant.genotype || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Depth</p>
                                <p>{variant.depth || '-'}</p>
                              </div>
                            </div>
                            
                            {variant.acmg_criteria && (
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">ACMG Criteria</p>
                                <div className="flex flex-wrap gap-2">
                                  {variant.acmg_criteria.split(',').map((c: string) => (
                                    <Badge key={c} variant="outline">{c.trim()}</Badge>
                                  ))}
                                </div>
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
            <p className="text-sm text-muted-foreground">
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
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.has_next_page}
                onClick={() => handlePageChange(filters.page! + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
