"use client"

/**
 * HPOTermCard Component
 *
 * Displays a single selected HPO term with expandable definition.
 * Compact by default, shows full info on expand.
 * Supports read-only mode for variant detail panels.
 * Lazy loads definition from HPO API when expanded.
 */

import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useHPOTerm } from '@/hooks/queries'

interface HPOTermCardProps {
  hpoId: string
  name: string
  definition?: string
  onRemove?: (hpoId: string) => void
  readOnly?: boolean
}

export function HPOTermCard({
  hpoId,
  name,
  definition: providedDefinition,
  onRemove,
  readOnly = false
}: HPOTermCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(false)

  // Only fetch definition if not provided and card is expanded
  const { data: fetchedTerm, isLoading } = useHPOTerm(
    hpoId,
    shouldFetch && !providedDefinition
  )

  // Enable fetching when card is opened for the first time
  useEffect(() => {
    if (isOpen && !providedDefinition && !shouldFetch) {
      setShouldFetch(true)
    }
  }, [isOpen, providedDefinition, shouldFetch])

  // Get the definition from either provided prop or fetched data
  const definition = providedDefinition || fetchedTerm?.definition

  // Show loading state if we're fetching and don't have definition yet
  const showLoading = isOpen && !definition && isLoading

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="border rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
        {/* Header - Always visible and clickable */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between gap-3 p-3 cursor-pointer">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant="outline" className="text-sm font-mono flex-shrink-0">
                {hpoId}
              </Badge>
              <span className="text-md font-medium truncate">{name}</span>
              <div className="flex-shrink-0">
                {showLoading ? (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                ) : isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            {!readOnly && onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(hpoId)
                }}
                className="flex-shrink-0 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                aria-label={`Remove ${name}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CollapsibleTrigger>

        {/* Definition - Expandable */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0">
            <div className="pl-3 border-l-2 border-primary/30">
              {showLoading ? (
                <p className="text-md text-muted-foreground italic">
                  Loading definition...
                </p>
              ) : definition ? (
                <p className="text-md text-muted-foreground leading-relaxed">
                  {definition}
                </p>
              ) : (
                <p className="text-md text-muted-foreground italic">
                  No definition available
                </p>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
