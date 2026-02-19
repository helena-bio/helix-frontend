"use client"

/**
 * VariantDetailPanel - Comprehensive variant information view
 *
 * Stripe-style layout: compact header, stat strip, section-based content
 * Follows Helix UI Guidelines typography scale strictly.
 *
 * Clinical priority order (top-down decision flow):
 * 1. Header: identity + ACMG verdict (no scroll)
 * 2. Stat strip: 5 key facts at a glance
 * 3. ACMG + ClinVar (classification evidence)
 * 4. Computational evidence (predictions + conservation)
 * 5. Population + Quality (gnomAD + sequencing)
 * 6. Variant Details (molecular identity)
 * 7. HPO Phenotypes (patient context)
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  Loader2,
  Dna,
  Shield,
  Activity,
  FileText,
  Gauge,
  Target,
  TrendingUp,
  Star,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertTriangle,
  GitMerge,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useVariant } from '@/hooks/queries'
import { useHPOTerm } from '@/hooks/queries'
import {
  ConsequenceBadges,
  getImpactColor,
  formatImpactDisplay,
  truncateSequence,
  StarButton,
  getZygosityBadge,
} from '@/components/shared'
import { GnomADCard } from './GnomADCard'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface VariantDetailPanelProps {
  sessionId: string
  variantIdx: number
  onBack: () => void
}

// ----------------------------------------------------------------------------
// SectionHeader - consistent section labels
// icon: h-4 w-4 text-muted-foreground, title: text-lg font-semibold
// ----------------------------------------------------------------------------
const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-muted-foreground">{icon}</span>
    <h3 className="text-lg font-semibold">{title}</h3>
  </div>
)

// ----------------------------------------------------------------------------
// ACMG classification colors
// ----------------------------------------------------------------------------
const getACMGColor = (classification: string | null) => {
  if (!classification) return 'bg-muted text-muted-foreground border-border'
  const c = classification.toLowerCase()
  if (c === 'pathogenic') return 'bg-red-100 text-red-900 border-red-300'
  if (c === 'likely pathogenic') return 'bg-orange-100 text-orange-900 border-orange-300'
  if (c.includes('uncertain') || c === 'vus') return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  if (c === 'likely benign') return 'bg-blue-100 text-blue-900 border-blue-300'
  if (c === 'benign') return 'bg-green-100 text-green-900 border-green-300'
  return 'bg-muted text-muted-foreground border-border'
}

// ----------------------------------------------------------------------------
// Prediction helpers
// ----------------------------------------------------------------------------
const getPredictionColor = (pred: string | null) => {
  if (!pred) return 'bg-muted text-muted-foreground border-border'
  const first = pred[0].toUpperCase()
  if (first === 'D' || first === 'T') return 'bg-red-100 text-red-900 border-red-300'
  if (first === 'P') return 'bg-orange-100 text-orange-900 border-orange-300'
  if (first === 'N' || first === 'B') return 'bg-green-100 text-green-900 border-green-300'
  return 'bg-muted text-muted-foreground border-border'
}

const parsePrediction = (raw: string | null): string | null => {
  if (!raw) return null
  const values = raw.split(';').map(v => v.trim()).filter(v => v && v !== '.')
  return values[0] ?? null
}

const parseScore = (raw: any): number | null => {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') {
    const values = raw.split(';').map(v => v.trim()).filter(v => v && v !== '.')
    if (values.length === 0) return null
    const num = parseFloat(values[0])
    return isNaN(num) ? null : num
  }
  return null
}

// ----------------------------------------------------------------------------
// Format helpers
// ----------------------------------------------------------------------------
const formatDiseaseName = (disease: string | null | undefined): string[] => {
  if (!disease) return []
  return disease.split('|').map(d => d.trim().replace(/_/g, ' ')).filter(Boolean)
}

const formatReviewStatus = (status: string | null | undefined): string[] => {
  if (!status) return []
  return status.split(',').map(s => s.trim().replace(/_/g, ' ')).filter(Boolean)
}

const formatBiotype = (biotype: string | null | undefined): string => {
  if (!biotype) return ''
  return biotype.replace(/_/g, ' ')
}

const getRarityLabel = (af: number | null): { label: string; color: string } | null => {
  if (af === null || af === 0) return null
  if (af > 0.05) return { label: 'Common', color: 'bg-blue-100 text-blue-900 border-blue-300' }
  if (af > 0.01) return { label: 'Low freq', color: 'bg-blue-100 text-blue-900 border-blue-300' }
  if (af > 0.001) return { label: 'Rare', color: 'bg-orange-100 text-orange-900 border-orange-300' }
  if (af > 0.0001) return { label: 'Very rare', color: 'bg-red-100 text-red-900 border-red-300' }
  return { label: 'Ultra-rare', color: 'bg-purple-100 text-purple-900 border-purple-300' }
}

const formatClinVarShort = (sig: string | null): string => {
  if (!sig) return '-'
  const s = sig.toLowerCase()
  if (s === 'pathogenic') return 'P'
  if (s === 'likely pathogenic' || s === 'likely_pathogenic') return 'LP'
  if (s.includes('uncertain') || s === 'vus') return 'VUS'
  if (s === 'likely benign' || s === 'likely_benign') return 'LB'
  if (s === 'benign') return 'B'
  return sig.length > 12 ? sig.slice(0, 12) : sig
}

// ----------------------------------------------------------------------------
// FilterPassRow
// ----------------------------------------------------------------------------
const FilterPassRow = ({
  label,
  pass,
}: {
  label: string
  pass: boolean | null
}) => {
  if (pass === null) return null
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
      <span className="text-md text-muted-foreground">{label}</span>
      {pass ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// PredictionRow - consistent row for in silico predictors
// ----------------------------------------------------------------------------
const PredictionRow = ({
  label,
  prediction,
  score,
}: {
  label: string
  prediction: string | null
  score: number | null
}) => {
  const pred = parsePrediction(prediction)
  const parsed = parseScore(score)
  if (!pred && parsed === null) return null

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-md text-muted-foreground w-28">{label}</span>
        {pred && (
          <Badge variant="outline" className={`text-xs font-medium ${getPredictionColor(pred)}`}>
            {pred}
          </Badge>
        )}
      </div>
      <span className="text-base font-medium">
        {parsed !== null ? parsed.toFixed(3) : '-'}
      </span>
    </div>
  )
}

// ----------------------------------------------------------------------------
// CopyableValue - HGVS and identifiers with copy button
// text-xs break-all leading-relaxed per guidelines
// ----------------------------------------------------------------------------
const CopyableValue = ({ label, value }: { label: string; value: string | null }) => {
  if (!value) return null
  return (
    <div className="py-1.5 border-b border-border/50 last:border-0">
      <p className="text-md text-muted-foreground mb-1">{label}</p>
      <div className="flex items-start gap-1.5">
        <p className="text-sm text-foreground break-all flex-1 leading-relaxed">
          {value}
        </p>
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="flex-shrink-0 p-0.5 rounded hover:bg-muted mt-0.5"
          title="Copy"
        >
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// HPO Term Card - lazy-loaded expandable
// ----------------------------------------------------------------------------
interface HPOTermData {
  hpo_id: string
  name: string
}

interface HPOPhenotypeCardProps {
  hpoId: string
  name: string
  index: number
}

function HPOPhenotypeCard({ hpoId, name, index }: HPOPhenotypeCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(false)
  const { data: hpoData, isLoading } = useHPOTerm(hpoId, shouldFetch)

  useEffect(() => {
    if (isOpen && !shouldFetch) setShouldFetch(true)
  }, [isOpen, shouldFetch])

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card">
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer hover:bg-accent/50 transition-colors py-2.5 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-md text-muted-foreground w-7 flex-shrink-0">
                  #{index + 1}
                </span>
                <span className="text-base font-medium">{name}</span>
                <Badge variant="outline" className="text-xs hidden sm:flex">
                  {hpoId}
                </Badge>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="border rounded-lg p-4 bg-muted/30 ml-10">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-md">Loading details...</span>
                </div>
              ) : hpoData ? (
                <div className="space-y-3">
                  {hpoData.definition && (
                    <div>
                      <p className="text-md text-muted-foreground mb-1">Definition</p>
                      <p className="text-base leading-relaxed">{hpoData.definition}</p>
                    </div>
                  )}
                  {hpoData.synonyms && hpoData.synonyms.length > 0 && (
                    <div>
                      <p className="text-md text-muted-foreground mb-2">Synonyms</p>
                      <div className="flex flex-wrap gap-1.5">
                        {hpoData.synonyms.slice(0, 5).map((syn: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs font-normal">
                            {syn}
                          </Badge>
                        ))}
                        {hpoData.synonyms.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{hpoData.synonyms.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                    <a href={`https://hpo.jax.org/browse/term/${hpoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-md text-primary hover:underline flex items-center gap-1 pt-1"
                  >
                    View in HPO Browser
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <p className="text-md text-muted-foreground italic">No additional details available</p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

// ----------------------------------------------------------------------------
// HPO lazy loading constants
// ----------------------------------------------------------------------------
const HPO_INITIAL_COUNT = 10
const HPO_LOAD_MORE_COUNT = 10

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function VariantDetailPanel({ sessionId, variantIdx, onBack }: VariantDetailPanelProps) {
  const { data, isLoading, error } = useVariant(sessionId, variantIdx)
  const [hpoSearchQuery, setHpoSearchQuery] = useState('')
  const [visibleHPOCount, setVisibleHPOCount] = useState(HPO_INITIAL_COUNT)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const variant = data?.variant

  // HPO parsing
  const hpoTerms = useMemo<HPOTermData[]>(() => {
    if (!variant?.hpo_ids || !variant?.hpo_names) return []
    const ids = variant.hpo_ids.split(';').map((t: string) => t.trim()).filter(Boolean)
    const names = variant.hpo_names.split(';').map((p: string) => p.trim()).filter(Boolean)
    return ids.map((hpo_id: string, idx: number) => ({
      hpo_id,
      name: names[idx] || 'Unknown phenotype',
    }))
  }, [variant?.hpo_ids, variant?.hpo_names])

  const filteredHPOTerms = useMemo(() => {
    if (!hpoSearchQuery) return hpoTerms
    const q = hpoSearchQuery.toLowerCase()
    return hpoTerms.filter(
      (t: HPOTermData) => t.name.toLowerCase().includes(q) || t.hpo_id.toLowerCase().includes(q)
    )
  }, [hpoTerms, hpoSearchQuery])

  const displayedHPOTerms = useMemo(
    () => filteredHPOTerms.slice(0, visibleHPOCount),
    [filteredHPOTerms, visibleHPOCount]
  )

  const hasMoreHPO = visibleHPOCount < filteredHPOTerms.length

  useEffect(() => {
    setVisibleHPOCount(HPO_INITIAL_COUNT)
  }, [hpoSearchQuery])

  const loadMoreHPO = useCallback(() => {
    if (hasMoreHPO) setVisibleHPOCount(prev => prev + HPO_LOAD_MORE_COUNT)
  }, [hasMoreHPO])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMoreHPO) loadMoreHPO() },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMoreHPO, loadMoreHPO])

  // Section visibility flags
  const hasPredictions = variant && (
    variant.sift_pred || variant.sift_score !== null ||
    variant.alphamissense_pred || variant.alphamissense_score !== null ||
    variant.metasvm_pred || variant.metasvm_score !== null ||
    variant.dann_score !== null
  )

  const hasConservation = variant && (
    variant.phylop100way_vertebrate !== null || variant.gerp_rs !== null
  )

  const hasConstraints = variant && (
    variant.pli !== null || variant.oe_lof_upper !== null ||
    variant.oe_lof !== null || variant.mis_z !== null
  )

  const hasDosage = variant && (
    variant.haploinsufficiency_score !== null || variant.triplosensitivity_score !== null
  )

  const hasComputationalEvidence = hasPredictions || hasConservation || hasConstraints || hasDosage

  const hasGnomAD = variant && (
    variant.global_af !== null || variant.global_ac !== null ||
    variant.global_an !== null || variant.global_hom !== null
  )

  const hasClinVar = variant && (variant.clinical_significance || variant.clinvar_variation_id)

  const hasFilters = variant && (
    variant.pass_quality_filter !== null ||
    variant.pass_frequency_filter !== null ||
    variant.pass_impact_filter !== null
  )

  const anyFilterFailed = variant && (
    variant.pass_quality_filter === false ||
    variant.pass_frequency_filter === false ||
    variant.pass_impact_filter === false
  )

  const zygosity = variant ? getZygosityBadge(variant.genotype) : null

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-base">Back to Analysis</span>
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !variant) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-base">Back to Analysis</span>
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-base font-medium">Failed to load variant</p>
            <p className="text-md text-muted-foreground mt-1">{error?.message}</p>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="h-full flex flex-col bg-background">

      {/* ====================================================================
          HEADER - compact, all critical info visible without scroll
          ==================================================================== */}
      <div className="flex-shrink-0 border-b">

        {/* Navigation */}
        <div className="px-4 pt-3 pb-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span className="text-base">Back to Analysis</span>
          </Button>
        </div>

        {/* Identity row */}
        <div className="px-4 pb-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-end gap-2.5 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight">
                {variant.gene_symbol || 'Unknown'}
              </h2>
              <StarButton variantIdx={variantIdx} size="md" />
              <span
                className="text-md text-muted-foreground truncate max-w-xs"
                title={`${variant.chromosome}:${variant.position} ${variant.reference_allele}>${variant.alternate_allele}`}
              >
                {variant.chromosome}:{variant.position.toLocaleString()}&nbsp;
                {truncateSequence(variant.reference_allele, 12)}&nbsp;&rarr;&nbsp;{truncateSequence(variant.alternate_allele, 12)}
              </span>
            </div>
            {variant.hgvs_protein && (
              <p
                className="text-md text-muted-foreground mt-0.5 truncate max-w-lg"
                title={variant.hgvs_protein}
              >
                {truncateSequence(variant.hgvs_protein, 70)}
              </p>
            )}
          </div>

          {/* ACMG badge - prominent, top right */}
          {variant.acmg_class && (
            <Badge
              variant="outline"
              className={`text-base font-semibold px-3 py-1 flex-shrink-0 border-2 ${getACMGColor(variant.acmg_class)}`}
            >
              {variant.acmg_class}
            </Badge>
          )}
        </div>

        {/* ================================================================
            STAT STRIP - 5 key facts, no scroll required
            Labels: text-xs text-muted-foreground
            Values: text-base font-medium
            ================================================================ */}
        <div className="border-t grid grid-cols-5 divide-x">

          {/* ClinVar */}
          <div className="px-3 py-2 flex flex-col">
            <p className="text-sm text-muted-foreground leading-none mb-1">ClinVar</p>
            <div className="mt-auto">
              {variant.clinical_significance ? (
                <Badge variant="outline" className={`text-xs ${getACMGColor(variant.clinical_significance)}`}>
                  {formatClinVarShort(variant.clinical_significance)}
                </Badge>
              ) : (
                <span className="text-base font-medium">-</span>
              )}
            </div>
          </div>

          {/* gnomAD AF */}
          <div className="px-3 py-2 flex flex-col">
            <p className="text-sm text-muted-foreground leading-none mb-1">gnomAD AF</p>
            <div className="mt-auto flex items-center gap-1.5 flex-wrap">
              {getRarityLabel(variant.global_af) ? (
                <Badge variant="outline" className={`text-xs ${getRarityLabel(variant.global_af)!.color}`}>
                  {getRarityLabel(variant.global_af)!.label}
                </Badge>
              ) : (
                <span className="text-base font-medium">{variant.global_af === 0 ? 'Absent' : '-'}</span>
              )}
            </div>
          </div>

          {/* Impact */}
          <div className="px-3 py-2 flex flex-col">
            <p className="text-sm text-muted-foreground leading-none mb-1">Impact</p>
            <div className="mt-auto">
              {variant.impact ? (
                <Badge variant="outline" className={`text-xs ${getImpactColor(variant.impact)}`}>
                  {formatImpactDisplay(variant.impact)}
                </Badge>
              ) : (
                <span className="text-base font-medium">-</span>
              )}
            </div>
          </div>

          {/* Zygosity */}
          <div className="px-3 py-2 flex flex-col">
            <p className="text-sm text-muted-foreground leading-none mb-1">Zygosity</p>
            <div className="mt-auto">
              {zygosity && zygosity.label !== '-' ? (
                <Badge variant="outline" className={`text-xs ${zygosity.color}`}>
                  {zygosity.label}
                </Badge>
              ) : (
                <span className="text-base font-medium">{variant.genotype || '-'}</span>
              )}
            </div>
          </div>

          {/* Confidence */}
          <div className="px-3 py-2 flex flex-col">
            <p className="text-sm text-muted-foreground leading-none mb-1">Confidence</p>
            <span className="text-base font-medium mt-auto">
              {variant.confidence_score !== null ? variant.confidence_score.toFixed(2) : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SCROLLABLE CONTENT
          ==================================================================== */}
      <div className="flex-1 overflow-y-auto">

        {/* ================================================================
            ALERT BANNERS - between header and content
            ================================================================ */}
        {(variant.compound_het_candidate || variant.is_flagged) && (
          <div className="border-b">
            {variant.compound_het_candidate && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
                <GitMerge className="h-4 w-4 text-amber-700 flex-shrink-0" />
                <span className="text-base font-medium text-amber-900">
                  Compound heterozygote candidate
                </span>
                <span className="text-md text-amber-700">
                  Review other variants in this gene for compound het interpretation
                </span>
              </div>
            )}
            {variant.is_flagged && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-700 flex-shrink-0" />
                <span className="text-base font-medium text-red-900">Variant flagged</span>
                {variant.flag_reason && (
                  <span className="text-md text-red-700">{String(variant.flag_reason)}</span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-4 space-y-4">

          {/* ==============================================================
              SECTION 1: ACMG + ClinVar (classification evidence)
              ============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ACMG Classification */}
            <Card>
              <CardContent className="pt-4">
                <SectionHeader icon={<Shield className="h-4 w-4" />} title="ACMG Classification" />

                {variant.acmg_criteria && (
                  <div className="mb-3">
                    <p className="text-md text-muted-foreground mb-2">Evidence Codes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {variant.acmg_criteria.split(',').filter(Boolean).map((c: string) => {
                        const code = c.trim()
                        let extra = 'bg-muted text-muted-foreground border-border'
                        if (code.startsWith('PVS') || code.startsWith('PS')) extra = 'bg-red-100 text-red-900 border-red-300'
                        else if (code.startsWith('PM')) extra = 'bg-orange-100 text-orange-900 border-orange-300'
                        else if (code.startsWith('PP')) extra = 'bg-yellow-100 text-yellow-900 border-yellow-300'
                        else if (code.startsWith('BA') || code.startsWith('BS') || code.startsWith('BP')) extra = 'bg-green-100 text-green-900 border-green-300'
                        return (
                          <Badge key={code} variant="outline" className={`text-md font-medium ${extra}`}>
                            {code}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                {variant.confidence_score !== null && (
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-md text-muted-foreground">Confidence</span>
                    <span className="text-base font-medium">{variant.confidence_score.toFixed(2)}</span>
                  </div>
                )}

                {variant.priority_score !== null && (
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-md text-muted-foreground">Priority Score</span>
                    <span className="text-base font-medium">{variant.priority_score.toFixed(1)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ClinVar */}
            {hasClinVar ? (
              <Card>
                <CardContent className="pt-4">
                  <SectionHeader icon={<FileText className="h-4 w-4" />} title="ClinVar" />

                  {variant.clinical_significance && (
                    <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                      <span className="text-md text-muted-foreground">Significance</span>
                      <span className="text-base font-medium">{variant.clinical_significance}</span>
                    </div>
                  )}

                  {variant.review_stars !== null && variant.review_stars > 0 && (
                    <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                      <span className="text-md text-muted-foreground">Review Stars</span>
                      <div className="flex gap-0.5">
                        {[...Array(variant.review_stars)].map((_: any, i: number) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        ))}
                        {[...Array(Math.max(0, 4 - (variant.review_stars || 0)))].map((_: any, i: number) => (
                          <Star key={`e${i}`} className="h-3.5 w-3.5 text-border" />
                        ))}
                      </div>
                    </div>
                  )}

                  {variant.review_status && (
                    <div className="py-1.5 border-b border-border/50">
                      <p className="text-md text-muted-foreground mb-1.5">Review Status</p>
                      <div className="flex flex-wrap gap-1">
                        {formatReviewStatus(variant.review_status).map((s: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs font-normal">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {variant.disease_name && (
                    <div className="py-1.5 border-b border-border/50">
                      <p className="text-md text-muted-foreground mb-1.5">Disease</p>
                      <div className="flex flex-wrap gap-1">
                        {formatDiseaseName(variant.disease_name).map((d: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs font-normal">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {variant.clinvar_variation_id && (
                    <div className="pt-2">
                      
                        <a href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.clinvar_variation_id}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-md text-primary hover:underline flex items-center gap-1"
                      >
                        View in ClinVar
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-4">
                  <SectionHeader icon={<FileText className="h-4 w-4" />} title="ClinVar" />
                  <p className="text-md text-muted-foreground">No ClinVar record found for this variant.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ==============================================================
              SECTION 2: Computational Evidence
              (Predictions + Conservation + Gene Constraints)
              ============================================================== */}
          {hasComputationalEvidence && (
            <Card>
              <CardContent className="pt-4">
                <SectionHeader icon={<Target className="h-4 w-4" />} title="Computational Evidence" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">

                  {/* Left column: In Silico Predictions */}
                  <div>
                    {hasPredictions && (
                      <div className="mb-4">
                        <p className="text-md text-muted-foreground mb-2">In Silico Predictions</p>
                        <PredictionRow label="SIFT" prediction={variant.sift_pred} score={variant.sift_score} />
                        <PredictionRow label="AlphaMissense" prediction={variant.alphamissense_pred} score={variant.alphamissense_score} />
                        <PredictionRow label="MetaSVM" prediction={variant.metasvm_pred} score={variant.metasvm_score} />
                        {variant.dann_score !== null && (() => {
                          const score = parseScore(variant.dann_score)
                          if (score === null) return null
                          const pct = Math.min(Math.max(score * 100, 0), 100)
                          return (
                            <div className="py-2 border-b border-border/50 last:border-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-md text-muted-foreground">DANN</span>
                                <span className="text-base font-medium tabular-nums">{score.toFixed(3)}</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-red-500" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {hasConservation && (
                      <div>
                        <p className="text-md text-muted-foreground mb-2">Conservation</p>
                        {variant.phylop100way_vertebrate !== null && (
                          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                            <span className="text-md text-muted-foreground">PhyloP 100-way</span>
                            <span className="text-base font-medium">{variant.phylop100way_vertebrate.toFixed(3)}</span>
                          </div>
                        )}
                        {variant.gerp_rs !== null && (
                          <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                            <span className="text-md text-muted-foreground">GERP++</span>
                            <span className="text-base font-medium">{variant.gerp_rs.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right column: Gene Constraints + Dosage */}
                  <div>
                    {hasConstraints && (
                      <div className="mb-4">
                        <p className="text-md text-muted-foreground mb-2">Gene Constraints</p>
                        {variant.pli !== null && (
                          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                            <span className="text-md text-muted-foreground">pLI</span>
                            <span className="text-base font-medium">{variant.pli.toFixed(3)}</span>
                          </div>
                        )}
                        {variant.oe_lof !== null && (
                          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                            <span className="text-md text-muted-foreground">oe LoF</span>
                            <span className="text-base font-medium">{variant.oe_lof.toFixed(3)}</span>
                          </div>
                        )}
                        {variant.oe_lof_upper !== null && (
                          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                            <span className="text-md text-muted-foreground">LOEUF</span>
                            <span className="text-base font-medium">{variant.oe_lof_upper.toFixed(3)}</span>
                          </div>
                        )}
                        {variant.mis_z !== null && (
                          <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                            <span className="text-md text-muted-foreground">Missense Z</span>
                            <span className="text-base font-medium">{variant.mis_z.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {hasDosage && (
                      <div>
                        <p className="text-md text-muted-foreground mb-2">ClinGen Dosage</p>
                        {variant.haploinsufficiency_score !== null && (
                          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                            <span className="text-md text-muted-foreground">HI Score</span>
                            <span className="text-base font-medium">{variant.haploinsufficiency_score}</span>
                          </div>
                        )}
                        {variant.triplosensitivity_score !== null && (
                          <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                            <span className="text-md text-muted-foreground">TS Score</span>
                            <span className="text-base font-medium">{variant.triplosensitivity_score}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ==============================================================
              SECTION 3: Population + Quality (two-column)
              ============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {hasGnomAD && (
              <GnomADCard
                globalAF={variant.global_af}
                globalAC={variant.global_ac}
                globalAN={variant.global_an}
                globalHom={variant.global_hom}
                popmax={variant.popmax}
                popmaxAF={variant.af_grpmax}
                rsid={variant.rsid}
                chromosome={variant.chromosome}
                position={variant.position}
                refAllele={variant.reference_allele}
                altAllele={variant.alternate_allele}
              />
            )}

            <Card>
              <CardContent className="pt-4">
                <SectionHeader icon={<Gauge className="h-4 w-4" />} title="Sequencing Quality" />

                {variant.genotype && (
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-md text-muted-foreground">Genotype</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium">{variant.genotype}</span>
                      {zygosity && zygosity.label !== '-' && zygosity.label !== variant.genotype && (
                        <Badge variant="outline" className={`text-xs ${zygosity.color}`}>
                          {zygosity.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {variant.depth !== null && (
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-md text-muted-foreground">Depth</span>
                    <span className="text-base font-medium">{variant.depth}x</span>
                  </div>
                )}

                {variant.allelic_depth !== null && (
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-md text-muted-foreground">Allelic Depth</span>
                    <span className="text-base font-medium">{variant.allelic_depth}</span>
                  </div>
                )}

                {variant.genotype_quality !== null && (
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-md text-muted-foreground">GQ</span>
                    <span className="text-base font-medium">{variant.genotype_quality}</span>
                  </div>
                )}

                {variant.quality !== null && (
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-md text-muted-foreground">QUAL</span>
                    <span className="text-base font-medium">{variant.quality.toFixed(1)}</span>
                  </div>
                )}

                {variant.filter_status && (
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-md text-muted-foreground">Filter</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${variant.filter_status === 'PASS'
                        ? 'bg-green-100 text-green-900 border-green-300'
                        : 'bg-red-100 text-red-900 border-red-300'}`}
                    >
                      {variant.filter_status}
                    </Badge>
                  </div>
                )}

                {hasFilters && (
                  <div className={`mt-3 pt-3 border-t border-border/50 ${anyFilterFailed ? 'rounded-lg bg-red-50/50 p-2 -mx-1' : ''}`}>
                    {anyFilterFailed && (
                      <p className="text-xs text-red-700 font-medium mb-1.5 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        QC filter warnings
                      </p>
                    )}
                    <FilterPassRow label="Quality filter" pass={variant.pass_quality_filter} />
                    <FilterPassRow label="Frequency filter" pass={variant.pass_frequency_filter} />
                    <FilterPassRow label="Impact filter" pass={variant.pass_impact_filter} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ==============================================================
              SECTION 4: Variant Details (full width)
              ============================================================== */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader icon={<Dna className="h-4 w-4" />} title="Variant Details" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">

                {/* Left: HGVS notations (copyable, full width within column) */}
                <div>
                  <CopyableValue label="HGVS Genomic" value={variant.hgvs_genomic} />
                  <CopyableValue label="HGVS cDNA" value={variant.hgvs_cdna} />
                  <CopyableValue label="HGVS Protein" value={variant.hgvs_protein} />

                  {variant.consequence && (
                    <div className="py-1.5 border-b border-border/50">
                      <p className="text-md text-muted-foreground mb-1.5">Consequence</p>
                      <ConsequenceBadges consequence={variant.consequence} maxBadges={6} className="text-xs" />
                    </div>
                  )}
                </div>

                {/* Right: Molecular identity */}
                <div>
                  {variant.impact && (
                    <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                      <span className="text-md text-muted-foreground">Impact</span>
                      <Badge variant="outline" className={`text-xs ${getImpactColor(variant.impact)}`}>
                        {formatImpactDisplay(variant.impact)}
                      </Badge>
                    </div>
                  )}

                  {variant.transcript_id && (
                    <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                      <span className="text-md text-muted-foreground">Transcript</span>
                      <span className="text-sm font-medium">{variant.transcript_id}</span>
                    </div>
                  )}

                  {variant.exon_number && (
                    <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                      <span className="text-md text-muted-foreground">Exon</span>
                      <span className="text-base font-medium">{variant.exon_number}</span>
                    </div>
                  )}

                  {variant.biotype && (
                    <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                      <span className="text-md text-muted-foreground">Biotype</span>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {formatBiotype(variant.biotype)}
                      </Badge>
                    </div>
                  )}

                  {variant.domains && (
                    <div className="py-1.5 border-b border-border/50">
                      <p className="text-md text-muted-foreground mb-1.5">Protein Domains</p>
                      <div className="flex flex-wrap gap-1">
                        {variant.domains.split(',').filter(Boolean).slice(0, 4).map((d: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs font-normal">
                            {d.trim()}
                          </Badge>
                        ))}
                        {variant.domains.split(',').length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{variant.domains.split(',').length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {variant.rsid && (
                    <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-md text-muted-foreground">rsID</span>
                      <span className="text-sm font-medium">{variant.rsid}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ==============================================================
              SECTION 5: HPO Phenotypes (full width)
              ============================================================== */}
          {hpoTerms.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Phenotypes (HPO)</h3>
                  <Badge variant="secondary" className="text-xs">
                    {filteredHPOTerms.length}
                  </Badge>
                </div>
                <span className="text-md text-muted-foreground">
                  {displayedHPOTerms.length} of {filteredHPOTerms.length}
                </span>
              </div>

              {hpoTerms.length > 10 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={hpoSearchQuery}
                    onChange={e => setHpoSearchQuery(e.target.value)}
                    placeholder="Search phenotypes..."
                    className="pl-9 pr-9 text-base h-10"
                  />
                  {hpoSearchQuery && (
                    <button
                      onClick={() => setHpoSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {displayedHPOTerms.map((term: HPOTermData, idx: number) => (
                  <HPOPhenotypeCard
                    key={term.hpo_id}
                    hpoId={term.hpo_id}
                    name={term.name}
                    index={idx}
                  />
                ))}
              </div>

              {hasMoreHPO && (
                <div ref={loadMoreRef} className="flex justify-center py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {hpoSearchQuery && filteredHPOTerms.length === 0 && (
                <p className="text-center text-md text-muted-foreground py-4">
                  No matching phenotypes found
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
