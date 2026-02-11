"use client"

/**
 * VariantsCompactTable - Compact variant table for AI chat panel
 * DESIGN: Minimal columns, no overflow, click to open detail panel, pagination
 */

import { memo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

interface VariantsCompactTableProps {
  data: any[]
  onVariantClick?: (variantIdx: number) => void
}

const ITEMS_PER_PAGE = 5

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


const truncateAllele = (allele: string, maxLength: number = 6): string => {
  if (allele.length <= maxLength) return allele
  return allele.substring(0, maxLength) + '...'
}

const VariantRow = memo(function VariantRow({
  variant,
  onVariantClick,
}: {
  variant: any
  onVariantClick?: (variantIdx: number) => void
}) {
  const zygosity = getZygosityBadge(variant.genotype)
  const changeText = `${variant.reference_allele}/${variant.alternate_allele}`

  const handleClick = () => {
    if (onVariantClick) {
      onVariantClick(variant.variant_idx)
    }
  }

  return (
    <tr
      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          <span className="text-md font-medium truncate">{variant.gene_symbol || '-'}</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="text-sm font-mono text-muted-foreground">
          {variant.chromosome}:{variant.position.toLocaleString()}
        </div>
      </td>
      <td className="px-2 py-2">
        <div
          className="text-sm font-mono truncate max-w-[80px]"
          title={changeText}
        >
          {truncateAllele(variant.reference_allele)}/{truncateAllele(variant.alternate_allele)}
        </div>
      </td>
      <td className="px-2 py-2">
        {variant.acmg_class ? (
          <Badge variant="outline" className={`text-xs ${getACMGColor(variant.acmg_class)}`}>
            {getACMGShortName(variant.acmg_class)}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-2 py-2">
        <Badge variant="outline" className={`text-xs ${zygosity.color}`}>
          {zygosity.label}
        </Badge>
      </td>
      <td className="px-2 py-2">
        {tier ? (
          <Badge variant="outline" className={`text-sm ${tier.color}`}>
            {tier.label}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </td>
    </tr>
  )
})

export const VariantsCompactTable = memo(function VariantsCompactTable({
  data,
  onVariantClick,
}: VariantsCompactTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No variants found
      </div>
    )
  }

  // Pagination logic
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = data.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-2 py-2 text-md font-semibold">Gene</th>
              <th className="px-2 py-2 text-md font-semibold">Position</th>
              <th className="px-2 py-2 text-md font-semibold">Change</th>
              <th className="px-2 py-2 text-md font-semibold">ACMG</th>
              <th className="px-2 py-2 text-md font-semibold">Zyg</th>
              <th className="px-2 py-2 text-md font-semibold">Tier</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((variant: any) => (
              <VariantRow
                key={variant.variant_idx}
                variant={variant}
                onVariantClick={onVariantClick}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - only show if more than ITEMS_PER_PAGE */}
      {data.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={handlePreviousPage}
              className="h-7 px-2"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              <span className="text-xs">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={handleNextPage}
              className="h-7 px-2"
            >
              <span className="text-xs">Next</span>
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
})
