"use client"

/**
 * HPOTermCard Component
 * 
 * Displays a single selected HPO term with expandable definition.
 * Compact by default, shows full info on expand.
 */

import { useState } from 'react'
import { X, ChevronUp, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface HPOTermCardProps {
  hpoId: string
  name: string
  definition?: string
  onRemove: (hpoId: string) => void
}

export function HPOTermCard({ hpoId, name, definition, onRemove }: HPOTermCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="border rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
        {/* Header - Always visible */}
        <div className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge variant="outline" className="text-xs font-mono flex-shrink-0">
              {hpoId}
            </Badge>
            <span className="text-sm font-medium truncate">{name}</span>
            {definition && (
              <CollapsibleTrigger asChild>
                <button className="flex-shrink-0 p-1 hover:bg-primary/20 rounded transition-colors">
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Info className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
            )}
          </div>
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
        </div>

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
