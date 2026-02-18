"use client"

/**
 * StarButton - Reusable star toggle for adding variants to Review Board.
 * Used in VariantAnalysisView, ClinicalScreeningView, and VariantDetailPanel.
 */

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useReviewBoard } from '@/contexts/ReviewBoardContext'

interface StarButtonProps {
  variantIdx: number
  className?: string
  size?: 'sm' | 'md'
}

export function StarButton({ variantIdx, className = '', size = 'sm' }: StarButtonProps) {
  const { isStarred, toggleStar, errorMessage } = useReviewBoard()
  const [isToggling, setIsToggling] = useState(false)
  const starred = isStarred(variantIdx)

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isToggling) return
    setIsToggling(true)
    try {
      await toggleStar(variantIdx)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            disabled={isToggling}
            className={`p-1 rounded hover:bg-accent/50 transition-colors ${
              isToggling ? 'opacity-50' : ''
            } ${className}`}
            aria-label={starred ? 'Remove from Review Board' : 'Add to Review Board'}
          >
            <Star
              className={`${iconSize} transition-colors ${
                starred
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground hover:text-yellow-400'
              }`}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {starred ? 'Remove from Review Board' : 'Add to Review Board'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
