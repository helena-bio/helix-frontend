"use client"

/**
 * HPOTermCard Component
 *
 * Displays a single selected HPO term with expandable definition.
 * Compact by default, shows full info on expand.
 * Supports read-only mode for variant detail panels.
 */

import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

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
  definition, 
  onRemove,
  readOnly = false 
}: HPOTermCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="border rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
        {/* Header - Always visible and clickable */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between gap-3 p-3 cursor-pointer">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant="outline" className="text-xs font-mono flex-shrink-0">
                {hpoId}
              </Badge>
              <span className="text-md font-medium truncate">{name}</span>
              {definition && (
                <div className="flex-shrink-0">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}
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
        {definition && (
          <CollapsibleContent>
            <div className="px-3 pb-3 pt-0">
              <div className="pl-3 border-l-2 border-primary/30">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {definition}
                </p>
              </div>
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  )
}
