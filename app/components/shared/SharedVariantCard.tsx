"use client"

/**
 * SharedVariantCard - Unified variant card used across all views.
 *
 * Renders a consistent collapsed/expanded variant card.
 * Each view can inject additional content via slots:
 *   - collapsedRight: badges shown after ACMG in collapsed row (e.g. Tier, Score)
 *   - expandedChildren: extra sections before the footer (e.g. HPO matches, Score breakdown, Notes)
 */

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  getACMGColor,
  getImpactColor,
  getZygosityBadge,
  formatACMGDisplay,
  formatImpactDisplay,
  formatClinVarDisplay,
  ConsequenceBadges,
  truncateSequence,
} from './variant-helpers'
import { getRarityBadge } from '@helix/shared/lib/utils'
import { StarButton } from './StarButton'

// =============================================================================
// SHARED VARIANT DATA
// =============================================================================

/**
 * Normalized variant data consumed by SharedVariantCard.
 * Each view maps from its own type to this interface.
 */
export interface SharedVariantData {
  variantIdx: number
  hgvsProtein: string | null
  hgvsCdna: string | null
  consequence: string | null
  impact: string | null
  acmgClass: string | null
  acmgCriteria: string | null
  gnomadAf: number | null
  genotype: string | null
  clinvarSignificance: string | null
  depth: number | null
  quality: number | null
  alphamissenseScore: number | null
  siftScore: number | null
}

// =============================================================================
// PROPS
// =============================================================================

export interface SharedVariantCardProps {
  variant: SharedVariantData
  onViewDetails: (variantIdx: number) => void
  /** Extra badges after ACMG in collapsed row */
  collapsedRight?: ReactNode
  /** Extra sections before footer in expanded view */
  expandedChildren?: ReactNode
  /** Extra buttons next to View Full Details in footer */
  footerActions?: ReactNode
  /** Content rendered below the footer (e.g. Notes panel) */
  afterFooter?: ReactNode
}

// =============================================================================
// HELPERS (moved from VariantAnalysisView)
// =============================================================================

export function ACMGCriteriaBadge({ code }: { code: string }) {
  const c = code.trim()
  let extra = ''
  if (c.startsWith('PVS') || c.startsWith('PS')) {
    extra = 'bg-red-100 text-red-900 border-red-300'
  } else if (c.startsWith('PM')) {
    extra = 'bg-orange-100 text-orange-900 border-orange-300'
  } else if (c.startsWith('PP')) {
    extra = 'bg-yellow-100 text-yellow-900 border-yellow-300'
  } else if (c.startsWith('BA') || c.startsWith('BS') || c.startsWith('BP')) {
    extra = 'bg-green-100 text-green-900 border-green-300'
  } else {
    extra = 'bg-muted text-muted-foreground border-border'
  }
  return (
    <Badge variant="outline" className={`text-tiny font-medium ${extra}`}>
      {c}
    </Badge>
  )
}

export function ScoreBar({ value, colorClass = 'bg-foreground' }: { value: number | null | undefined; colorClass?: string }) {
  if (value === null || value === undefined) {
    return <span className="text-md text-muted-foreground font-mono">---</span>
  }
  const pct = Math.min(Math.max(value * 100, 0), 100)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-md font-mono tabular-nums w-10 text-right text-foreground">
        {value.toFixed(3)}
      </span>
    </div>
  )
}

// =============================================================================
// SHARED VARIANT CARD
// =============================================================================

export function SharedVariantCard({ variant, onViewDetails, collapsedRight, expandedChildren, footerActions, afterFooter }: SharedVariantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const zygosity = getZygosityBadge(variant.genotype)
  const rarity = getRarityBadge(variant.gnomadAf)

  const acmgCriteria: string[] = variant.acmgCriteria
    ? variant.acmgCriteria.split(',').map((c: string) => c.trim()).filter(Boolean)
    : []

  const hasAlphaMissense = variant.alphamissenseScore !== null && variant.alphamissenseScore !== undefined
  const hasSift = variant.siftScore !== null && variant.siftScore !== undefined
  const hasAnyScores = hasAlphaMissense || hasSift

  return (
    <div
      className="border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Collapsed row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <StarButton variantIdx={variant.variantIdx} />
        {variant.hgvsProtein && (
          <span className="text-md font-medium text-foreground truncate min-w-28 max-w-48" title={variant.hgvsProtein}>
            {variant.hgvsProtein.includes(':') ? variant.hgvsProtein.split(':').pop() : truncateSequence(variant.hgvsProtein, 25)}
          </span>
        )}
        <ConsequenceBadges consequence={variant.consequence} maxBadges={1} />
        {variant.acmgClass && (
          <Badge variant="outline" className={`text-tiny ${getACMGColor(variant.acmgClass)}`}>
            {formatACMGDisplay(variant.acmgClass)}
          </Badge>
        )}
        {collapsedRight}
        <div className="flex-1" />
        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 space-y-4 border-t" onClick={(e) => e.stopPropagation()}>

          {/* HGVS */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="min-w-0">
              <p className="text-md text-muted-foreground">HGVS Protein</p>
              <div className="flex items-center gap-1 min-w-0">
                <p className="text-md font-mono truncate" title={variant.hgvsProtein || '-'}>
                  {variant.hgvsProtein || '-'}
                </p>
                {variant.hgvsProtein && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(variant.hgvsProtein!); toast.success("HGVS Protein copied") }}
                    className="flex-shrink-0 p-0.5 rounded hover:bg-muted"
                    title="Copy HGVS Protein"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-md text-muted-foreground">HGVS cDNA</p>
              <div className="flex items-center gap-1 min-w-0">
                <p className="text-md font-mono truncate" title={variant.hgvsCdna || '-'}>
                  {variant.hgvsCdna || '-'}
                </p>
                {variant.hgvsCdna && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(variant.hgvsCdna!); toast.success("HGVS cDNA copied") }}
                    className="flex-shrink-0 p-0.5 rounded hover:bg-muted"
                    title="Copy HGVS cDNA"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4-column classification grid */}
          <div className="grid grid-cols-4 divide-x divide-border rounded-md border border-border overflow-hidden">

            {/* ClinVar */}
            <div className="px-3 py-2 flex flex-col gap-1">
              <p className="text-md text-muted-foreground">ClinVar</p>
              {variant.clinvarSignificance ? (
                <Badge
                  variant="outline"
                  className={`text-tiny font-semibold w-fit ${getACMGColor(variant.clinvarSignificance)}`}
                >
                  {formatClinVarDisplay(variant.clinvarSignificance)}
                </Badge>
              ) : (
                <span className="text-md text-muted-foreground">---</span>
              )}
            </div>

            {/* gnomAD AF */}
            <div className="px-3 py-2 flex flex-col gap-1">
              <p className="text-md text-muted-foreground">gnomAD AF</p>
              {variant.gnomadAf !== null && variant.gnomadAf !== undefined && variant.gnomadAf > 0 ? (
                <span className="text-md font-mono tabular-nums text-foreground">
                  1 in {Math.round(1 / variant.gnomadAf).toLocaleString()}
                </span>
              ) : (
                <span className="text-md text-muted-foreground">Not found</span>
              )}
            </div>

            {/* Coverage */}
            <div className="px-3 py-2 flex flex-col gap-1">
              <p className="text-md text-muted-foreground">Coverage</p>
              <div className="flex items-end gap-3">
                <div>
                  <span className="font-mono text-md text-foreground tabular-nums">
                    {variant.depth ?? '---'}
                  </span>
                  <span className="text-md text-muted-foreground ml-0.5">x</span>
                  <p className="text-md text-muted-foreground leading-none mt-0.5">depth</p>
                </div>
                <div>
                  <span className="font-mono text-md text-foreground tabular-nums">
                    {variant.quality?.toFixed(0) ?? '---'}
                  </span>
                  <p className="text-md text-muted-foreground leading-none mt-0.5">qual</p>
                </div>
              </div>
            </div>

            {/* Impact */}
            <div className="px-3 py-2 flex flex-col gap-1">
              <p className="text-md text-muted-foreground">Impact</p>
              {variant.impact ? (
                <Badge variant="outline" className={`text-tiny w-fit ${getImpactColor(variant.impact)}`}>
                  {formatImpactDisplay(variant.impact)}
                </Badge>
              ) : (
                <span className="text-md text-muted-foreground">---</span>
              )}
            </div>
          </div>

          {/* ACMG Criteria + Frequency/Zygosity */}
          <div className="flex items-end justify-between">
            {acmgCriteria.length > 0 ? (
              <div>
                <p className="text-md text-muted-foreground mb-2">ACMG Criteria</p>
                <div className="flex gap-1 flex-wrap">
                  {acmgCriteria.map((code) => (
                    <ACMGCriteriaBadge key={code} code={code} />
                  ))}
                </div>
              </div>
            ) : <div />}
            <div className="flex items-end gap-3">
              <div className="text-right">
                <p className="text-md text-muted-foreground mb-1">Frequency</p>
                <Badge variant="outline" className="text-tiny font-medium bg-muted text-muted-foreground border-border">
                  {rarity.label}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-md text-muted-foreground mb-1">Zygosity</p>
                <Badge variant="outline" className="text-tiny font-medium bg-muted text-muted-foreground border-border">
                  {zygosity.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Computational Predictions */}
          {hasAnyScores && (
            <div className="grid grid-cols-2 gap-4">
              {hasAlphaMissense && (
                <div>
                  <p className="text-md text-muted-foreground mb-1">AlphaMissense</p>
                  <ScoreBar
                    value={variant.alphamissenseScore}
                    colorClass={(variant.alphamissenseScore ?? 0) > 0.7 ? 'bg-red-500' : 'bg-orange-400'}
                  />
                </div>
              )}
              {hasSift && (
                <div>
                  <p className="text-md text-muted-foreground mb-1">
                    SIFT <span className="text-md text-muted-foreground">({variant.siftScore?.toFixed(3) ?? '---'})</span>
                  </p>
                  <ScoreBar
                    value={variant.siftScore !== null ? 1 - variant.siftScore! : null}
                    colorClass="bg-red-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* Slot: extra content from each view */}
          {expandedChildren}

          {/* Footer */}
          <div className="pt-2 border-t flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails(variant.variantIdx)
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Full Details
            </Button>
            {footerActions}
          </div>

          {afterFooter}
        </div>
      )}
    </div>
  )
}
