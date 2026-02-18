"use client"

/**
 * ReviewBoardView - Curated variants for focused clinical review.
 *
 * Shows starred variants sorted by ACMG classification and impact.
 * Variant data loaded from DuckDB via existing API.
 * Notes integration for collaborative clinical annotation.
 * Layout consistent with VariantAnalysisView.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  ClipboardCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  Copy,
  MessageSquare,
  Send,
  Info,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useReviewBoard } from '@/contexts/ReviewBoardContext'
import { getVariant, listNotes, createNote } from '@/lib/api/variant-analysis'
import { VariantDetailPanel } from '@/components/analysis/VariantDetailPanel'
import {
  getACMGColor,
  getImpactColor,
  getZygosityBadge,
  formatACMGDisplay,
  ConsequenceBadges,
  truncateSequence,
  StarButton,
} from '@/components/shared'
import type { Variant, CaseNote } from '@/types/variant.types'

interface ReviewBoardViewProps {
  sessionId: string
}

// ACMG priority for sorting (lower = higher priority)
const ACMG_PRIORITY: Record<string, number> = {
  'Pathogenic': 0,
  'Likely Pathogenic': 1,
  'Uncertain Significance': 2,
  'Likely Benign': 3,
  'Benign': 4,
}

const IMPACT_PRIORITY: Record<string, number> = {
  'HIGH': 0,
  'MODERATE': 1,
  'LOW': 2,
  'MODIFIER': 3,
}

type ACMGFilter = 'all' | 'Pathogenic' | 'Likely Pathogenic' | 'VUS' | 'Likely Benign' | 'Benign'

const acmgFilterToClass = (filter: ACMGFilter): string | undefined => {
  if (filter === 'all') return undefined
  if (filter === 'VUS') return 'Uncertain Significance'
  return filter
}

// ============================================================================
// NOTES SECTION
// ============================================================================

interface NotesSectionProps {
  sessionId: string
  variantIdx: number
}

function NotesSection({ sessionId, variantIdx }: NotesSectionProps) {
  const [notes, setNotes] = useState<CaseNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newNoteText, setNewNoteText] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Load notes on mount
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    listNotes(sessionId, variantIdx)
      .then((res) => {
        if (!cancelled) setNotes(res.notes)
      })
      .catch(() => {
        if (!cancelled) setNotes([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [sessionId, variantIdx])

  const handleSend = async () => {
    if (!newNoteText.trim() || isSending) return
    setIsSending(true)
    try {
      const note = await createNote(sessionId, newNoteText.trim(), variantIdx)
      setNotes((prev) => [...prev, note])
      setNewNoteText('')
    } catch (err) {
      console.error('Failed to add note:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <p className="text-base font-semibold">
          Notes {notes.length > 0 && `(${notes.length})`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-md text-muted-foreground">Loading notes...</span>
        </div>
      ) : (
        <>
          {/* Existing notes */}
          {notes.length > 0 && (
            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="flex gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {note.user.initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-medium">{note.user.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-base mt-1 whitespace-pre-wrap">{note.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add note input */}
          <div className="flex gap-2">
            <Input
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a note..."
              className="flex-1 text-base h-11"
              disabled={isSending}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newNoteText.trim() || isSending}
              className="h-11 w-11 shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// VARIANT CARD
// ============================================================================

interface ReviewVariantCardProps {
  variant: Variant
  sessionId: string
  onViewDetails: (variantIdx: number) => void
}

function ReviewVariantCard({ variant, sessionId, onViewDetails }: ReviewVariantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const zygosity = getZygosityBadge(variant.genotype)

  return (
    <div
      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StarButton variantIdx={variant.variant_idx} />
            <span className="text-base font-semibold">{variant.gene_symbol || 'Unknown'}</span>
            {variant.acmg_class && (
              <Badge variant="outline" className={`text-sm ${getACMGColor(variant.acmg_class)}`}>
                {formatACMGDisplay(variant.acmg_class)}
              </Badge>
            )}
            {variant.impact && (
              <Badge variant="outline" className={`text-sm ${getImpactColor(variant.impact)}`}>
                {variant.impact}
              </Badge>
            )}
            <Badge variant="outline" className={`text-sm ${zygosity.color}`}>
              {zygosity.label}
            </Badge>
          </div>
          <p className="text-base font-mono text-muted-foreground truncate">
            {variant.chromosome}:{variant.position?.toLocaleString()}
            <span className="ml-2">
              {truncateSequence(variant.reference_allele, 15)}/{truncateSequence(variant.alternate_allele, 15)}
            </span>
          </p>
          {(variant.hgvs_cdna || variant.hgvs_protein) && (
            <p className="text-sm font-mono text-foreground/70 truncate mt-0.5">
              {variant.hgvs_cdna && <span>{truncateSequence(variant.hgvs_cdna, 40)}</span>}
              {variant.hgvs_cdna && variant.hgvs_protein && <span className="mx-1.5 text-muted-foreground">|</span>}
              {variant.hgvs_protein && <span>{truncateSequence(variant.hgvs_protein, 30)}</span>}
            </p>
          )}
          <ConsequenceBadges consequence={variant.consequence} className="mt-1" />
        </div>
        <div className="flex items-center gap-3">
          {variant.global_af !== null && variant.global_af !== undefined && (
            <div className="text-right">
              <p className="text-sm font-mono">{variant.global_af.toExponential(2)}</p>
              <p className="text-xs text-muted-foreground">gnomAD AF</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="min-w-0">
              <p className="text-md text-muted-foreground">HGVS Protein</p>
              <div className="flex items-center gap-1 min-w-0">
                <p className="text-md font-mono truncate">{truncateSequence(variant.hgvs_protein, 40)}</p>
                {variant.hgvs_protein && (
                  <button onClick={() => navigator.clipboard.writeText(variant.hgvs_protein!)} className="flex-shrink-0 p-0.5 rounded hover:bg-muted">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-md text-muted-foreground">HGVS cDNA</p>
              <div className="flex items-center gap-1 min-w-0">
                <p className="text-md font-mono truncate">{truncateSequence(variant.hgvs_cdna, 40)}</p>
                {variant.hgvs_cdna && (
                  <button onClick={() => navigator.clipboard.writeText(variant.hgvs_cdna!)} className="flex-shrink-0 p-0.5 rounded hover:bg-muted">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-md text-muted-foreground">ClinVar</p>
              <p className="text-md">{variant.clinical_significance || '-'}</p>
            </div>
            <div>
              <p className="text-md text-muted-foreground">Confidence</p>
              <p className="text-md">{variant.confidence_score?.toFixed(2) || '-'}</p>
            </div>
          </div>

          {/* ACMG Criteria */}
          {variant.acmg_criteria && (
            <div>
              <p className="text-md text-muted-foreground mb-2">ACMG Criteria</p>
              <div className="flex flex-wrap gap-1">
                {variant.acmg_criteria.split(',').filter(Boolean).map((c: string) => (
                  <Badge key={c} variant="outline" className="text-sm font-mono">
                    {c.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-base"
              onClick={() => onViewDetails(variant.variant_idx)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Full Details
            </Button>
            <Button
              variant={showNotes ? 'secondary' : 'outline'}
              size="sm"
              className="text-base"
              onClick={() => setShowNotes(!showNotes)}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Notes
            </Button>
          </div>

          {/* Notes */}
          {showNotes && (
            <NotesSection sessionId={sessionId} variantIdx={variant.variant_idx} />
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// FILTER CARD
// ============================================================================

interface FilterCardProps {
  count: number
  label: string
  tooltip: string
  isSelected: boolean
  onClick: () => void
  colorClasses: string
}

function FilterCard({ count, label, tooltip, isSelected, onClick, colorClasses }: FilterCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all py-0 gap-0 ${colorClasses} ${
        isSelected ? 'ring-2 ring-gray-400 ring-offset-2' : 'hover:border-gray-400'
      }`}
      onClick={onClick}
    >
      <CardContent className="py-1.5 px-3 text-center relative group">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-current/50 hover:text-current transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-sm max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <p className="text-lg font-semibold">{count.toLocaleString()}</p>
        <p className="text-sm font-medium">{label}</p>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ReviewBoardView({ sessionId }: ReviewBoardViewProps) {
  const { items, count, isLoading: isLoadingBoard, errorMessage } = useReviewBoard()
  const [variants, setVariants] = useState<Variant[]>([])
  const [isLoadingVariants, setIsLoadingVariants] = useState(false)
  const [acmgFilter, setAcmgFilter] = useState<ACMGFilter>('all')
  const [geneFilter, setGeneFilter] = useState('')
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null)

  // Load variant data for all starred items
  useEffect(() => {
    if (items.length === 0) {
      setVariants([])
      return
    }

    let cancelled = false
    setIsLoadingVariants(true)

    Promise.all(
      items.map((item) =>
        getVariant(sessionId, item.variant_idx)
          .then((res) => res.variant)
          .catch(() => null)
      )
    ).then((results) => {
      if (!cancelled) {
        const loaded = results.filter((v): v is Variant => v !== null)
        // Sort by ACMG priority, then impact priority
        loaded.sort((a, b) => {
          const acmgA = ACMG_PRIORITY[a.acmg_class || ''] ?? 99
          const acmgB = ACMG_PRIORITY[b.acmg_class || ''] ?? 99
          if (acmgA !== acmgB) return acmgA - acmgB
          const impA = IMPACT_PRIORITY[a.impact || ''] ?? 99
          const impB = IMPACT_PRIORITY[b.impact || ''] ?? 99
          return impA - impB
        })
        setVariants(loaded)
      }
    }).finally(() => {
      if (!cancelled) setIsLoadingVariants(false)
    })

    return () => { cancelled = true }
  }, [items, sessionId])

  // ACMG counts from loaded variants
  const acmgCounts = useMemo(() => {
    const counts = { total: variants.length, pathogenic: 0, likely_pathogenic: 0, vus: 0, likely_benign: 0, benign: 0 }
    for (const v of variants) {
      if (v.acmg_class === 'Pathogenic') counts.pathogenic++
      else if (v.acmg_class === 'Likely Pathogenic') counts.likely_pathogenic++
      else if (v.acmg_class === 'Uncertain Significance') counts.vus++
      else if (v.acmg_class === 'Likely Benign') counts.likely_benign++
      else if (v.acmg_class === 'Benign') counts.benign++
    }
    return counts
  }, [variants])

  // Filter variants
  const filteredVariants = useMemo(() => {
    let filtered = variants

    if (acmgFilter !== 'all') {
      const acmgClass = acmgFilterToClass(acmgFilter)
      filtered = filtered.filter((v) => v.acmg_class === acmgClass)
    }

    if (geneFilter.trim()) {
      const search = geneFilter.toLowerCase()
      filtered = filtered.filter((v) =>
        v.gene_symbol?.toLowerCase().includes(search)
      )
    }

    return filtered
  }, [variants, acmgFilter, geneFilter])

  const handleAcmgClick = (filter: ACMGFilter) => {
    setAcmgFilter((prev) => (prev === filter ? 'all' : filter))
  }

  const isLoading = isLoadingBoard || isLoadingVariants

  // View variant detail
  if (selectedVariantIdx !== null) {
    return (
      <VariantDetailPanel
        sessionId={sessionId}
        variantIdx={selectedVariantIdx}
        onBack={() => setSelectedVariantIdx(null)}
      />
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Review Board</h1>
          <p className="text-base text-muted-foreground mt-1">
            Curated variants for focused clinical review. Star variants from any view to add them here.
          </p>
        </div>

        {count > 0 && (
          <Badge variant="outline" className="text-sm bg-yellow-50 text-yellow-700 border-yellow-300">
            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
            {count} Starred
          </Badge>
        )}
      </div>

      {/* Error */}
      {errorMessage && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-3 px-4">
            <p className="text-base text-destructive">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-base font-medium">Loading review board...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && count === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">No Starred Variants</p>
            <p className="text-md text-muted-foreground">
              Star variants from Variant Analysis or Clinical Screening to add them to your review board.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!isLoading && count > 0 && (
        <>
          {/* ACMG Filter Cards */}
          <div className="grid grid-cols-6 gap-3">
            <FilterCard count={acmgCounts.total} label="Total" tooltip="Show all starred variants" isSelected={acmgFilter === 'all'} onClick={() => handleAcmgClick('all')} colorClasses="" />
            <FilterCard count={acmgCounts.pathogenic} label="P" tooltip="Pathogenic variants" isSelected={acmgFilter === 'Pathogenic'} onClick={() => handleAcmgClick('Pathogenic')} colorClasses="border-red-200 bg-red-50 text-red-900" />
            <FilterCard count={acmgCounts.likely_pathogenic} label="LP" tooltip="Likely Pathogenic variants" isSelected={acmgFilter === 'Likely Pathogenic'} onClick={() => handleAcmgClick('Likely Pathogenic')} colorClasses="border-orange-200 bg-orange-50 text-orange-900" />
            <FilterCard count={acmgCounts.vus} label="VUS" tooltip="Variants of Uncertain Significance" isSelected={acmgFilter === 'VUS'} onClick={() => handleAcmgClick('VUS')} colorClasses="border-yellow-200 bg-yellow-50 text-yellow-900" />
            <FilterCard count={acmgCounts.likely_benign} label="LB" tooltip="Likely Benign variants" isSelected={acmgFilter === 'Likely Benign'} onClick={() => handleAcmgClick('Likely Benign')} colorClasses="border-blue-200 bg-blue-50 text-blue-900" />
            <FilterCard count={acmgCounts.benign} label="B" tooltip="Benign variants" isSelected={acmgFilter === 'Benign'} onClick={() => handleAcmgClick('Benign')} colorClasses="border-green-200 bg-green-50 text-green-900" />
          </div>

          {/* Gene Filter + Count */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Filter by gene..."
              value={geneFilter}
              onChange={(e) => setGeneFilter(e.target.value)}
              className="max-w-xs text-base"
            />
            <span className="text-md text-muted-foreground">
              Showing {filteredVariants.length} of {variants.length} variants
              {(acmgFilter !== 'all' || geneFilter) && ' (filtered)'}
            </span>
          </div>

          <p className="text-md text-muted-foreground">
            Sorted by ACMG classification priority (Pathogenic first), then by impact.
            {acmgFilter !== 'all' && ' Click the filter card again to show all.'}
          </p>

          {/* Variant Cards */}
          <div className="space-y-2">
            {filteredVariants.map((variant) => (
              <ReviewVariantCard
                key={variant.variant_idx}
                variant={variant}
                sessionId={sessionId}
                onViewDetails={setSelectedVariantIdx}
              />
            ))}
          </div>

          {/* No filter results */}
          {filteredVariants.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium mb-2">No Variants Match Filter</p>
                <p className="text-md text-muted-foreground">
                  Try a different filter or show all variants.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
