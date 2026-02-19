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
  ExternalLink,
} from 'lucide-react'
import type { VariantsResponse } from '@/types/variant.types'

interface VariantsTableProps {
  data: VariantsResponse | undefined
  isFetching: boolean
  onPageChange: (page: number) => void
  onVariantClick?: (variantIdx: number) => void
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

  if (genotype === '0/1' || genotype === '1/0' || genotype === '0|1' || genotype === '1|0' || genotype === 'het') {
    return { label: 'Het', color: 'bg-blue-100 text-blue-900 border-blue-300' }
  }
  if (genotype === '1/1' || genotype === '1|1' || genotype === 'hom') {
    return { label: 'Hom', color: 'bg-purple-100 text-purple-900 border-purple-300' }
  }
  if (genotype === '1' || genotype === '1/.' || genotype === '.|1' || genotype === 'hemi') {
    return { label: 'Hemi', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' }
  }

  return { label: genotype, color: 'bg-gray-100' }
}

const truncateAllele = (allele: string, maxLength: number = 10): string => {
  if (allele.length <= maxLength) return allele
  return allele.substring(0, maxLength) + '...'
}

// ============================================================================
// ACMG CRITERIA BADGE
// Color-coded by evidence strength: PVS/PS = red, PM = orange, PP = yellow, BP/BA/BS = green
// ============================================================================

function ACMGCriteriaBadge({ code }: { code: string }) {
  const c = code.trim()
  let extra = ''
  if (c.startsWith('PVS') || c.startsWith('PS')) {
    extra = 'bg-red-50 text-red-700 border-red-200'
  } else if (c.startsWith('PM')) {
    extra = 'bg-orange-50 text-orange-700 border-orange-200'
  } else if (c.startsWith('PP')) {
    extra = 'bg-yellow-50 text-yellow-700 border-yellow-200'
  } else if (c.startsWith('BA') || c.startsWith('BS') || c.startsWith('BP')) {
    extra = 'bg-green-50 text-green-700 border-green-200'
  } else {
    extra = 'bg-muted text-muted-foreground border-border'
  }
  return (
    <Badge variant="outline" className={`text-xs font-mono ${extra}`}>
      {c}
    </Badge>
  )
}

// ============================================================================
// SCORE BAR
// ============================================================================

function ScoreBar({ value, colorClass = 'bg-foreground' }: { value: number | null | undefined; colorClass?: string }) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground font-mono">—</span>
  }
  const pct = Math.min(Math.max(value * 100, 0), 100)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono tabular-nums w-8 text-right text-foreground">
        {value.toFixed(3)}
      </span>
    </div>
  )
}

// ============================================================================
// SECTION LABEL - Vercel-style uppercase
// ============================================================================

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  )
}

// ============================================================================
// FORMAT AF
// ============================================================================

function formatAF(af: number | null | undefined): { text: string; colorClass: string } {
  if (af === null || af === undefined || af === 0) {
    return { text: 'Not found', colorClass: 'text-foreground font-semibold' }
  }
  if (af < 0.0001) {
    return { text: af.toExponential(2), colorClass: 'text-orange-700 font-semibold' }
  }
  return { text: af.toFixed(6).replace(/\.?0+$/, ''), colorClass: 'text-green-700 font-semibold' }
}

export function VariantsTable({ data, isFetching, onPageChange, onVariantClick }: VariantsTableProps) {
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

  const handleDetailClick = useCallback((variantIdx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onVariantClick) {
      onVariantClick(variantIdx)
    }
  }, [onVariantClick])

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
              <TableHead className="text-base w-[120px]">Change</TableHead>
              <TableHead className="text-base">Consequence</TableHead>
              <TableHead className="text-base">Zygosity</TableHead>
              <TableHead className="text-base">ACMG</TableHead>
              <TableHead className="text-base">gnomAD AF</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data || data.variants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>
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
                const changeText = `${variant.reference_allele}/${variant.alternate_allele}`
                const af = formatAF(variant.global_af)
                const isExpanded = expandedRows.has(variant.variant_idx)

                const acmgCriteria: string[] = variant.acmg_criteria
                  ? variant.acmg_criteria.split(',').map((c: string) => c.trim()).filter(Boolean)
                  : []

                const hasAlphaMissense = variant.alphamissense_score !== null && variant.alphamissense_score !== undefined
                const hasSift = variant.sift_score !== null && variant.sift_score !== undefined
                const hasAnyScores = hasAlphaMissense || hasSift

                return (
                  <>
                    <TableRow
                      key={variant.variant_idx}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleRow(variant.variant_idx)}
                    >
                      <TableCell>
                        {isExpanded ? (
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
                      <TableCell
                        className="font-mono text-sm max-w-[120px] truncate"
                        title={changeText}
                      >
                        {truncateAllele(variant.reference_allele)}/{truncateAllele(variant.alternate_allele)}
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
                      <TableCell className={`font-mono text-sm ${af.colorClass}`}>
                        {af.text}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDetailClick(variant.variant_idx, e)}
                          className="h-8 w-8 p-0"
                          title="View full details"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${variant.variant_idx}-expanded`}>
                        <TableCell colSpan={10} className="p-0 bg-muted/20">
                          <div className="px-6 py-4 space-y-3">

                            {/* -------------------------------------------- */}
                            {/* GENOMIC IDENTITY STRIP                         */}
                            {/* -------------------------------------------- */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/60 border border-border/60 flex-wrap">
                              <span className="font-mono text-sm text-foreground font-medium tracking-tight">
                                {variant.chromosome}:{variant.position?.toLocaleString()}{' '}
                                {variant.reference_allele}/{variant.alternate_allele}
                              </span>
                              {variant.hgvs_protein && (
                                <>
                                  <span className="text-muted-foreground/40 text-xs">·</span>
                                  <span className="font-mono text-sm font-semibold text-foreground">
                                    {variant.hgvs_protein}
                                  </span>
                                </>
                              )}
                              {variant.hgvs_cdna && (
                                <>
                                  <span className="text-muted-foreground/40 text-xs">·</span>
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {variant.hgvs_cdna}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* -------------------------------------------- */}
                            {/* 4-COLUMN CLASSIFICATION GRID                   */}
                            {/* ClinVar | gnomAD AF | Coverage | Confidence    */}
                            {/* -------------------------------------------- */}
                            <div className="grid grid-cols-4 divide-x divide-border rounded-md border border-border overflow-hidden">

                              {/* ClinVar */}
                              <div className="px-3 py-2 flex flex-col gap-1">
                                <SectionLabel>ClinVar</SectionLabel>
                                {variant.clinical_significance ? (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs font-semibold w-fit ${getACMGColor(variant.clinical_significance)}`}
                                  >
                                    {variant.clinical_significance}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </div>

                              {/* gnomAD AF */}
                              <div className="px-3 py-2 flex flex-col gap-1">
                                <SectionLabel>gnomAD AF</SectionLabel>
                                <span className={`font-mono text-sm tabular-nums ${af.colorClass}`}>
                                  {af.text}
                                </span>
                              </div>

                              {/* Coverage */}
                              <div className="px-3 py-2 flex flex-col gap-1">
                                <SectionLabel>Coverage</SectionLabel>
                                <div className="flex items-end gap-3">
                                  <div>
                                    <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                                      {variant.depth ?? '—'}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-0.5">x</span>
                                    <p className="text-xs text-muted-foreground leading-none mt-0.5">depth</p>
                                  </div>
                                  <div>
                                    <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                                      {variant.quality?.toFixed(0) ?? '—'}
                                    </span>
                                    <p className="text-xs text-muted-foreground leading-none mt-0.5">qual</p>
                                  </div>
                                </div>
                              </div>

                              {/* Impact */}
                              <div className="px-3 py-2 flex flex-col gap-1">
                                <SectionLabel>Impact</SectionLabel>
                                {variant.impact ? (
                                  <Badge variant="secondary" className="text-xs w-fit">
                                    {variant.impact}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </div>
                            </div>

                            {/* -------------------------------------------- */}
                            {/* ACMG CRITERIA                                  */}
                            {/* -------------------------------------------- */}
                            {acmgCriteria.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <SectionLabel>ACMG</SectionLabel>
                                <div className="flex gap-1 flex-wrap">
                                  {acmgCriteria.map((code) => (
                                    <ACMGCriteriaBadge key={code} code={code} />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* -------------------------------------------- */}
                            {/* COMPUTATIONAL PREDICTIONS                      */}
                            {/* Only when scores available                     */}
                            {/* -------------------------------------------- */}
                            {hasAnyScores && (
                              <div className="px-3 py-2 rounded-md bg-muted/30 border border-border/60">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                                  {hasAlphaMissense && (
                                    <div>
                                      <SectionLabel>AlphaMissense</SectionLabel>
                                      <div className="mt-1">
                                        <ScoreBar
                                          value={variant.alphamissense_score}
                                          colorClass={(variant.alphamissense_score ?? 0) > 0.7 ? 'bg-red-500' : 'bg-orange-400'}
                                        />
                                      </div>
                                    </div>
                                  )}
                                  {hasSift && (
                                    <div>
                                      <SectionLabel>SIFT</SectionLabel>
                                      <div className="mt-1 flex items-center gap-2">
                                        {/* SIFT: lower = more damaging -- invert for bar */}
                                        <ScoreBar
                                          value={variant.sift_score !== null ? 1 - variant.sift_score : null}
                                          colorClass="bg-red-400"
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                          ({variant.sift_score?.toFixed(3) ?? '—'})
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* -------------------------------------------- */}
                            {/* FOOTER: View full details                      */}
                            {/* -------------------------------------------- */}
                            <div className="flex justify-end pt-1 border-t border-border/60">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleDetailClick(variant.variant_idx, e)}
                                className="text-sm gap-1.5 h-7 px-3"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View full details
                              </Button>
                            </div>

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
