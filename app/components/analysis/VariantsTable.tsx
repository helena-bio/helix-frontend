"use client"

/**
 * VariantsTable - Pure table component (re-renders on data change)
 * Separated from filters to prevent filter flicker
 */

import { useState, useCallback } from 'react'
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
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import type { VariantsResponse } from '@/types/variant.types'

interface VariantsTableProps {
  data: VariantsResponse | undefined
  isFetching: boolean
  onPageChange: (page: number) => void
}

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

const getZygosityBadge = (genotype: string | null) => {
  if (!genotype) return { label: '-', color: 'bg-gray-100' }
  
  if (genotype === '0/1' || genotype === '1/0' || genotype === '0|1' || genotype === '1|0') {
    return { label: 'Het', color: 'bg-blue-100 text-blue-900 border-blue-300' }
  }
  if (genotype === '1/1' || genotype === '1|1') {
    return { label: 'Hom', color: 'bg-purple-100 text-purple-900 border-purple-300' }
  }
  if (genotype === '1' || genotype === '1/.' || genotype === '.|1') {
    return { label: 'Hemi', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' }
  }
  
  return { label: genotype, color: 'bg-gray-100' }
}

const getTierBadge = (tier: number | null) => {
  if (!tier) return null
  
  const colors = {
    1: 'bg-red-100 text-red-900 border-red-300',
    2: 'bg-orange-100 text-orange-900 border-orange-300',
    3: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    4: 'bg-blue-100 text-blue-900 border-blue-300',
    5: 'bg-gray-100 text-gray-900 border-gray-300',
  }
  
  return { label: `T${tier}`, color: colors[tier as keyof typeof colors] || colors[5] }
}

export function VariantsTable({ data, isFetching, onPageChange }: VariantsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = useCallback((variantIdx: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(variantIdx)) {
        next.delete(variantIdx)
      } else {
        next.add(variantIdx)
      }
      return next
    })
  }, [])

  const totalPages = data?.total_pages ?? 0

  return (
    <div className="relative">
      {/* Progress bar */}
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/30 z-10 overflow-hidden">
          <div className="h-full bg-primary animate-[shimmer_1s_ease-in-out_infinite] w-1/3" />
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="text-base">Gene</TableHead>
              <TableHead className="text-base">Position</TableHead>
              <TableHead className="text-base">Change</TableHead>
              <TableHead className="text-base">Consequence</TableHead>
              <TableHead className="text-base">Zygosity</TableHead>
              <TableHead className="text-base">ACMG</TableHead>
              <TableHead className="text-base">gnomAD AF</TableHead>
              <TableHead className="text-base">Tier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data || data.variants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">No variants found</p>
                    <p className="text-md text-muted-foreground">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.variants.map((variant: any) => {
                const zygosity = getZygosityBadge(variant.genotype)
                const tier = getTierBadge(variant.priority_tier)
                
                return (
                  <>
                    <TableRow
                      key={variant.variant_idx}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
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
                      <TableCell className="font-mono text-sm">
                        {variant.chromosome}:{variant.position.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {variant.reference_allele}/{variant.alternate_allele}
                      </TableCell>
                      <TableCell className="text-sm">{variant.consequence || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-sm ${zygosity.color}`}>
                          {zygosity.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {variant.acmg_class ? (
                          <Badge variant="outline" className={`text-sm ${getACMGColor(variant.acmg_class)}`}>
                            {getACMGShortName(variant.acmg_class)}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {variant.global_af ? variant.global_af.toExponential(2) : '-'}
                      </TableCell>
                      <TableCell>
                        {tier ? (
                          <Badge variant="outline" className={`text-sm ${tier.color}`}>
                            {tier.label}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                    </TableRow>

                    {expandedRows.has(variant.variant_idx) && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/30">
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
                                <p className="text-sm text-muted-foreground mb-1">Depth</p>
                                <p className="text-base">{variant.depth || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Quality</p>
                                <p className="text-base">{variant.quality ? variant.quality.toFixed(1) : '-'}</p>
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
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.variants.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <p className="text-md text-muted-foreground">
            Page {data.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_previous_page || isFetching}
              onClick={() => onPageChange(data.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="text-base">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_next_page || isFetching}
              onClick={() => onPageChange(data.page + 1)}
            >
              <span className="text-base">Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
