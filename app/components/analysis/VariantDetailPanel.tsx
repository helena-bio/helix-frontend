"use client"

/**
 * VariantDetailPanel - Comprehensive variant information view
 *
 * Single Card layout with internal border-t sections.
 * Clinical priority: identity -> classification -> predictions -> population -> quality -> details
 *
 * Typography scale:
 *   text-2xl: gene name
 *   text-lg: section headers
 *   text-base: primary values
 *   text-base: labels, secondary text
 *   text-sm: HGVS values, smaller identifiers
 *   text-xs: badges, metadata
 *   No font-mono anywhere.
 */

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  Loader2,
  Dna,
  Shield,
  FileText,
  Gauge,
  Target,
  Star,
  Copy,
  AlertTriangle,
  GitMerge,
  CheckCircle2,
  XCircle,
  Globe,
} from 'lucide-react'
import { useVariant } from '@/hooks/queries'
import {
  ConsequenceBadges,
  getImpactColor,
  formatImpactDisplay,
  truncateSequence,
  StarButton,
  getZygosityBadge,
} from '@/components/shared'

interface VariantDetailPanelProps {
  sessionId: string
  variantIdx: number
  onBack: () => void
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------
const getACMGColor = (classification: string | null) => {
  if (!classification) return 'bg-muted text-muted-foreground border-border'
  const c = classification.toLowerCase()
  if (c.includes('pathogenic/likely') || c === 'pathogenic/likely_pathogenic') return 'bg-red-100 text-red-900 border-red-300'
  if (c === 'pathogenic') return 'bg-red-100 text-red-900 border-red-300'
  if (c === 'likely pathogenic') return 'bg-orange-100 text-orange-900 border-orange-300'
  if (c.includes('uncertain') || c === 'vus') return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  if (c === 'likely benign') return 'bg-blue-100 text-blue-900 border-blue-300'
  if (c === 'benign') return 'bg-green-100 text-green-900 border-green-300'
  return 'bg-muted text-muted-foreground border-border'
}

const getPredictionBadgeColor = (pred: string | null) => {
  if (!pred) return 'bg-muted text-muted-foreground border-border'
  const f = pred[0].toUpperCase()
  if (f === 'D' || f === 'T') return 'bg-red-100 text-red-900 border-red-300'
  if (f === 'P') return 'bg-orange-100 text-orange-900 border-orange-300'
  if (f === 'N' || f === 'B') return 'bg-green-100 text-green-900 border-green-300'
  return 'bg-muted text-muted-foreground border-border'
}

const getPredictionBarColor = (pred: string | null) => {
  if (!pred) return 'bg-foreground/30'
  const f = pred[0].toUpperCase()
  if (f === 'D' || f === 'T') return 'bg-red-500'
  if (f === 'P') return 'bg-orange-400'
  if (f === 'N' || f === 'B') return 'bg-green-500'
  return 'bg-foreground/30'
}

const getSpliceAIBadgeColor = (score: number | null): string => {
  if (score === null) return 'bg-muted text-muted-foreground border-border'
  if (score >= 0.8) return 'bg-red-100 text-red-900 border-red-300'
  if (score >= 0.5) return 'bg-orange-100 text-orange-900 border-orange-300'
  if (score >= 0.2) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  return 'bg-muted text-muted-foreground border-border'
}

const getSpliceAILabel = (score: number | null): string => {
  if (score === null) return 'No data'
  if (score >= 0.8) return 'High impact'
  if (score >= 0.5) return 'Likely impact'
  if (score >= 0.2) return 'Possible impact'
  return 'Unlikely impact'
}

const getSpliceAIBarColor = (score: number | null): string => {
  if (score === null) return 'bg-foreground/30'
  if (score >= 0.8) return 'bg-red-500'
  if (score >= 0.5) return 'bg-orange-400'
  if (score >= 0.2) return 'bg-yellow-500'
  return 'bg-foreground/30'
}

// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
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
  if (s.includes('pathogenic/likely') || s === 'pathogenic/likely_pathogenic') return 'P/LP'
  if (s === 'pathogenic') return 'P'
  if (s === 'likely pathogenic' || s === 'likely_pathogenic') return 'LP'
  if (s.includes('uncertain') || s === 'vus') return 'VUS'
  if (s === 'likely benign' || s === 'likely_benign') return 'LB'
  if (s === 'benign') return 'B'
  return sig.length > 12 ? sig.slice(0, 12) : sig
}

const formatAF = (af: number | null): string => {
  if (af === null) return '-'
  if (af === 0) return 'Absent'
  if (af < 0.0001) return af.toExponential(2)
  return af.toFixed(6)
}

const POPULATION_NAMES: Record<string, string> = {
  afr: 'African/African American',
  amr: 'Latino/Admixed American',
  asj: 'Ashkenazi Jewish',
  eas: 'East Asian',
  fin: 'Finnish',
  mid: 'Middle Eastern',
  nfe: 'Non-Finnish European',
  sas: 'South Asian',
  ami: 'Amish',
  oth: 'Other',
  remaining: 'Remaining',
}

const formatOneInX = (af: number | null): string => {
  if (af === null) return '-'
  if (af === 0) return 'Not observed'
  const oneIn = Math.round(1 / af)
  return `1 in ${oneIn.toLocaleString()}`
}

const getProgressWidth = (af: number | null): number => {
  if (af === null || af === 0) return 0
  const logAF = Math.log10(af)
  const normalized = ((logAF + 6) / 5.7) * 100
  return Math.max(2, Math.min(100, normalized))
}

// ---------------------------------------------------------------------------
// SectionHeader
// ---------------------------------------------------------------------------
const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-muted-foreground">{icon}</span>
    <h3 className="text-lg font-semibold">{title}</h3>
  </div>
)

// ---------------------------------------------------------------------------
// Row - key/value row used throughout
// ---------------------------------------------------------------------------
const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
    <span className="text-base text-muted-foreground">{label}</span>
    {children}
  </div>
)

// ---------------------------------------------------------------------------
// ScoreBar - visual bar + score value (from SharedVariantCard pattern)
// ---------------------------------------------------------------------------
const ScoreBar = ({ barValue, displayValue, colorClass = 'bg-foreground/30' }: {
  barValue: number | null
  displayValue: number | null
  colorClass?: string
}) => {
  if (displayValue === null && barValue === null) {
    return <span className="text-base text-muted-foreground">---</span>
  }
  const pct = barValue !== null ? Math.min(Math.max(barValue * 100, 0), 100) : 0
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-base tabular-nums w-12 text-right">
        {displayValue !== null ? displayValue.toFixed(3) : '---'}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PredictionBar - label + badge + score bar for in silico predictors
// ---------------------------------------------------------------------------
const PredictionBar = ({ label, prediction, score, invert = false }: {
  label: string
  prediction: string | null
  score: number | null
  invert?: boolean
}) => {
  const pred = parsePrediction(prediction)
  const parsed = parseScore(score)
  if (!pred && parsed === null) return null

  const barValue = parsed !== null ? (invert ? 1 - parsed : parsed) : null

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base text-muted-foreground">{label}</span>
        {pred && (
          <Badge variant="outline" className={`text-tiny font-medium ${getPredictionBadgeColor(pred)}`}>{pred}</Badge>
        )}
      </div>
      <ScoreBar barValue={barValue} displayValue={parsed} colorClass={getPredictionBarColor(pred)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// FilterPassRow
// ---------------------------------------------------------------------------
const FilterPassRow = ({ label, pass }: { label: string; pass: boolean | null }) => {
  if (pass === null) return null
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
      <span className="text-base text-muted-foreground">{label}</span>
      {pass ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CopyableValue - HGVS and identifiers with copy button
// ---------------------------------------------------------------------------
const CopyableValue = ({ label, value }: { label: string; value: string | null }) => {
  if (!value) return null
  return (
    <div className="py-1.5 border-b border-border/50 last:border-0">
      <p className="text-base text-muted-foreground mb-1">{label}</p>
      <div className="flex items-start gap-1.5">
        <p className="text-base text-foreground break-all flex-1 leading-relaxed">{value}</p>
        <button
          onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied`) }}
          className="flex-shrink-0 p-0.5 rounded hover:bg-muted mt-0.5"
          title="Copy">
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

// ===========================================================================
// MAIN COMPONENT
// ===========================================================================
export function VariantDetailPanel({ sessionId, variantIdx, onBack }: VariantDetailPanelProps) {
  const { data, isLoading, error } = useVariant(sessionId, variantIdx)

  const variant = data?.variant

  // Section visibility
  const hasPredictions = variant && (
    variant.sift_pred || variant.sift_score !== null ||
    variant.alphamissense_pred || variant.alphamissense_score !== null ||
    variant.metasvm_pred || variant.metasvm_score !== null ||
    variant.dann_score !== null ||
    variant.spliceai_max_score !== null
  )
  const hasConservation = variant && (variant.phylop100way_vertebrate !== null || variant.gerp_rs !== null)
  const hasSpliceAI = variant && variant.spliceai_max_score !== null
  const hasConstraints = variant && (variant.pli !== null || variant.oe_lof_upper !== null || variant.oe_lof !== null || variant.mis_z !== null)
  const hasDosage = variant && (variant.haploinsufficiency_score !== null || variant.triplosensitivity_score !== null)
  const hasGnomAD = variant && (variant.global_af !== null || variant.global_ac !== null)
  const hasClinVar = variant && (variant.clinical_significance || variant.clinvar_variation_id)
  const hasFilters = variant && (variant.pass_quality_filter !== null || variant.pass_frequency_filter !== null || variant.pass_impact_filter !== null)
  const anyFilterFailed = variant && (variant.pass_quality_filter === false || variant.pass_frequency_filter === false || variant.pass_impact_filter === false)
  const zygosity = variant ? getZygosityBadge(variant.genotype) : null

  // Loading
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

  // Error
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
            <p className="text-base text-muted-foreground mt-1">{error?.message}</p>
          </div>
        </div>
      </div>
    )
  }

  const gnomadUrl = `https://gnomad.broadinstitute.org/variant/${variant.chromosome}-${variant.position}-${variant.reference_allele}-${variant.alternate_allele}?dataset=gnomad_r4`

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="h-full flex flex-col bg-background">

      {/* === HEADER (fixed) === */}
      <div className="flex-shrink-0 border-b">
        <div className="px-4 pt-3 pb-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span className="text-base">Back to Analysis</span>
          </Button>
        </div>

        {/* Identity */}
        <div className="px-4 pb-3">
          <div className="flex items-end gap-2.5 flex-wrap">
            <StarButton variantIdx={variantIdx} size="md" />
            <h2 className="text-2xl font-bold tracking-tight">{variant.gene_symbol || 'Unknown'}</h2>
            <span className="text-base text-muted-foreground truncate max-w-xs" title={`${variant.chromosome}:${variant.position} ${variant.reference_allele}>${variant.alternate_allele}`}>
              {variant.chromosome}:{variant.position.toLocaleString()}&nbsp;{truncateSequence(variant.reference_allele, 12)}&nbsp;&rarr;&nbsp;{truncateSequence(variant.alternate_allele, 12)}
            </span>
            {variant.variant_type && variant.variant_type !== 'SNV' && (
              <Badge variant="outline" className="text-tiny font-medium">{variant.variant_type}</Badge>
            )}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            {variant.hgvs_protein ? (
              <p className="text-base text-muted-foreground truncate max-w-lg" title={variant.hgvs_protein}>
                {truncateSequence(variant.hgvs_protein, 70)}
              </p>
            ) : <span />}
            {variant.acmg_class && (
              <Badge variant="outline" className={`text-md font-medium px-3 py-1 flex-shrink-0 ${getACMGColor(variant.acmg_class)}`}>
                {variant.acmg_class}
              </Badge>
          )}
          </div>
        </div>

        {/* Stat strip */}
        <div className="border-t grid grid-cols-5 divide-x">
          <div className="px-3 py-2 flex flex-col">
            <p className="text-base text-muted-foreground leading-none mb-1">ClinVar</p>
            <div className="mt-auto">
              {variant.clinical_significance ? (
                <Badge variant="outline" className={`text-tiny font-medium ${getACMGColor(variant.clinical_significance)}`}>
                  {formatClinVarShort(variant.clinical_significance)}
                </Badge>
              ) : <span className="text-base">-</span>}
            </div>
          </div>
          <div className="px-3 py-2 flex flex-col">
            <p className="text-base text-muted-foreground leading-none mb-1">gnomAD AF</p>
            <div className="mt-auto">
              {getRarityLabel(variant.global_af) ? (
                <Badge variant="outline" className={`text-tiny font-medium ${getRarityLabel(variant.global_af)!.color}`}>
                  {getRarityLabel(variant.global_af)!.label}
                </Badge>
              ) : <span className="text-base">{variant.global_af === 0 ? 'Absent' : '-'}</span>}
            </div>
          </div>
          <div className="px-3 py-2 flex flex-col">
            <p className="text-base text-muted-foreground leading-none mb-1">Impact</p>
            <div className="mt-auto">
              {variant.impact ? (
                <Badge variant="outline" className={`text-tiny font-medium ${getImpactColor(variant.impact)}`}>
                  {formatImpactDisplay(variant.impact)}
                </Badge>
              ) : <span className="text-base">-</span>}
            </div>
          </div>
          <div className="px-3 py-2 flex flex-col">
            <p className="text-base text-muted-foreground leading-none mb-1">Zygosity</p>
            <div className="mt-auto">
              {zygosity && zygosity.label !== '-' ? (
                <Badge variant="outline" className={`text-tiny font-medium ${zygosity.color}`}>
                  {zygosity.label}
                </Badge>
              ) : <span className="text-base">{variant.genotype || '-'}</span>}
            </div>
          </div>
          <div className="px-3 py-2 flex flex-col">
            <p className="text-base text-muted-foreground leading-none mb-1">Confidence</p>
            <span className="text-base font-medium mt-auto">
              {variant.confidence_score !== null ? variant.confidence_score?.toFixed(2) : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* === SCROLLABLE CONTENT === */}
      <div className="flex-1 overflow-y-auto">

        {/* Alert banners */}
        {(variant.compound_het_candidate || variant.is_flagged) && (
          <div className="border-b">
            {variant.compound_het_candidate && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
                <GitMerge className="h-4 w-4 text-amber-700 flex-shrink-0" />
                <span className="text-base font-medium text-amber-900">Compound heterozygote candidate</span>
                <span className="text-base text-amber-700">Review other variants in this gene</span>
              </div>
            )}
            {variant.is_flagged && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-700 flex-shrink-0" />
                <span className="text-base font-medium text-red-900">Variant flagged</span>
                {variant.flag_reason && <span className="text-base text-red-700">{String(variant.flag_reason)}</span>}
              </div>
            )}
          </div>
        )}

        <div className="p-4 space-y-4">

          {/* ============================================================
              ONE CARD - all detail sections with border-t dividers
              ============================================================ */}
          <Card className="overflow-hidden">

            {/* --- ACMG + ClinVar (two-column) --- */}
            <div>
              <div className="p-4">
                <SectionHeader icon={<Shield className="h-4 w-4" />} title="ACMG Classification" />
                {variant.acmg_criteria && (
                  <div className="mb-3">
                    <p className="text-base text-muted-foreground mb-2">Evidence Codes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {variant.acmg_criteria.split(',').filter(Boolean).map((c: string) => {
                        const code = c.trim()
                        let extra = 'bg-muted text-muted-foreground border-border'
                        if (code.startsWith('PVS') || code.startsWith('PS')) extra = 'bg-red-100 text-red-900 border-red-300'
                        else if (code.startsWith('PM')) extra = 'bg-orange-100 text-orange-900 border-orange-300'
                        else if (code === 'PP3_splice') extra = 'bg-purple-100 text-purple-900 border-purple-300'
                        else if (code.startsWith('PP')) extra = 'bg-yellow-100 text-yellow-900 border-yellow-300'
                        else if (code.startsWith('BA') || code.startsWith('BS') || code.startsWith('BP')) extra = 'bg-green-100 text-green-900 border-green-300'
                        return <Badge key={code} variant="outline" className={`text-tiny font-medium ${extra}`}>{code}</Badge>
                      })}
                    </div>
                  </div>
                )}
                {variant.confidence_score !== null && <Row label="Confidence"><span className="text-base">{variant.confidence_score?.toFixed(2)}</span></Row>}
                {variant.priority_score !== null && <Row label="Priority Score"><span className="text-base">{variant.priority_score?.toFixed(1)}</span></Row>}
                {variant.hpo_count !== null && variant.hpo_count > 0 && <Row label="Phenotype Matches"><span className="text-base">{variant.hpo_count}</span></Row>}
              </div>

              <div className="p-4 border-t">
                <SectionHeader icon={<FileText className="h-4 w-4" />} title="ClinVar" />
                {hasClinVar ? (
                  <>
                    {variant.clinical_significance && <Row label="Significance"><span className="text-base">{variant.clinical_significance}</span></Row>}
                    {variant.review_stars !== null && variant.review_stars > 0 && (
                      <Row label="Review Stars">
                        <div className="flex gap-0.5">
                          {[...Array(variant.review_stars)].map((_: any, i: number) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          ))}
                          {[...Array(Math.max(0, 4 - (variant.review_stars || 0)))].map((_: any, i: number) => (
                            <Star key={`e${i}`} className="h-3.5 w-3.5 text-border" />
                          ))}
                        </div>
                      </Row>
                    )}
                    {variant.review_status && (
                      <div className="py-1.5 border-b border-border/50">
                        <p className="text-base text-muted-foreground mb-1.5">Review Status</p>
                        <div className="flex flex-wrap gap-1">
                          {formatReviewStatus(variant.review_status).map((s: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-tiny font-medium">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {variant.disease_name && (
                      <div className="py-1.5 border-b border-border/50">
                        <p className="text-base text-muted-foreground mb-1.5">Disease</p>
                        <div className="flex flex-wrap gap-1">
                          {formatDiseaseName(variant.disease_name).map((d: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-tiny font-medium">{d}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {variant.clinvar_variation_id && (
                      <div className="pt-2">
                        <a href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.clinvar_variation_id}/`} target="_blank" rel="noopener noreferrer" className="text-base text-primary hover:underline flex items-center gap-1">View in ClinVar <ExternalLink className="h-3 w-3" /></a>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-base text-muted-foreground">No ClinVar record found for this variant.</p>
                )}
              </div>
            </div>

            {/* --- In Silico Predictions --- */}
            {hasPredictions && (
              <div className="border-t p-4">
                <SectionHeader icon={<Target className="h-4 w-4" />} title="In Silico Predictions" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  <PredictionBar label="SIFT" prediction={variant.sift_pred} score={variant.sift_score} invert />
                  <PredictionBar label="AlphaMissense" prediction={variant.alphamissense_pred} score={variant.alphamissense_score} />
                  <PredictionBar label="MetaSVM" prediction={variant.metasvm_pred} score={variant.metasvm_score} />
                  <PredictionBar label="DANN" prediction={null} score={variant.dann_score} />
                </div>
              </div>
            )}

            {/* --- SpliceAI Splice Predictions --- */}
            {hasSpliceAI && (
              <div className="border-t p-4">
                <SectionHeader icon={<Target className="h-4 w-4" />} title="Splice Predictions (SpliceAI)" />
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base text-muted-foreground">Max Delta Score</span>
                    <Badge variant="outline" className={`text-tiny font-medium ${getSpliceAIBadgeColor(variant.spliceai_max_score)}`}>
                      {getSpliceAILabel(variant.spliceai_max_score)}
                    </Badge>
                  </div>
                  <ScoreBar
                    barValue={variant.spliceai_max_score}
                    displayValue={variant.spliceai_max_score}
                    colorClass={getSpliceAIBarColor(variant.spliceai_max_score)}
                  />
                </div>
                {variant.spliceai_gene && variant.spliceai_gene !== variant.gene_symbol && (
                  <Row label="SpliceAI Gene"><span className="text-base">{variant.spliceai_gene}</span></Row>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-3">
                  {variant.spliceai_ds_ag !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Acceptor Gain</p>
                      <span className="text-base tabular-nums">{variant.spliceai_ds_ag?.toFixed(3)}</span>
                    </div>
                  )}
                  {variant.spliceai_ds_al !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Acceptor Loss</p>
                      <span className="text-base tabular-nums">{variant.spliceai_ds_al?.toFixed(3)}</span>
                    </div>
                  )}
                  {variant.spliceai_ds_dg !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Donor Gain</p>
                      <span className="text-base tabular-nums">{variant.spliceai_ds_dg?.toFixed(3)}</span>
                    </div>
                  )}
                  {variant.spliceai_ds_dl !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Donor Loss</p>
                      <span className="text-base tabular-nums">{variant.spliceai_ds_dl?.toFixed(3)}</span>
                    </div>
                  )}
                </div>
                {variant.acmg_criteria && variant.acmg_criteria.includes('PP3_splice') && (
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-tiny font-medium bg-purple-100 text-purple-900 border-purple-300">PP3_splice</Badge>
                    <span className="text-sm text-muted-foreground">SpliceAI score triggered splice prediction criterion</span>
                  </div>
                )}
              </div>
            )}

            {/* --- Conservation + Gene Constraints --- */}
            {(hasConservation || hasConstraints || hasDosage) && (
              <div className="border-t p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <div>
                    {hasConservation && (
                      <div className="mb-4">
                        <p className="text-base font-medium text-foreground mb-2">Conservation</p>
                        {variant.phylop100way_vertebrate !== null && <Row label="PhyloP 100-way"><span className="text-base">{variant.phylop100way_vertebrate?.toFixed(3)}</span></Row>}
                        {variant.gerp_rs !== null && <Row label="GERP++"><span className="text-base">{variant.gerp_rs?.toFixed(2)}</span></Row>}
                      </div>
                    )}
                    {hasDosage && (
                      <div>
                        <p className="text-base font-medium text-foreground mb-2">ClinGen Dosage</p>
                        {variant.haploinsufficiency_score !== null && <Row label="HI Score"><span className="text-base">{variant.haploinsufficiency_score}</span></Row>}
                        {variant.triplosensitivity_score !== null && <Row label="TS Score"><span className="text-base">{variant.triplosensitivity_score}</span></Row>}
                      </div>
                    )}
                  </div>
                  {hasConstraints && (
                    <div>
                      <p className="text-base font-medium text-foreground mb-2">Gene Constraints</p>
                      {variant.pli !== null && <Row label="pLI"><span className="text-base">{variant.pli?.toFixed(3)}</span></Row>}
                      {variant.oe_lof !== null && <Row label="oe LoF"><span className="text-base">{variant.oe_lof?.toFixed(3)}</span></Row>}
                      {variant.oe_lof_upper !== null && <Row label="LOEUF"><span className="text-base">{variant.oe_lof_upper?.toFixed(3)}</span></Row>}
                      {variant.mis_z !== null && <Row label="Missense Z"><span className="text-base">{variant.mis_z?.toFixed(2)}</span></Row>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- Population Frequency --- */}
            {hasGnomAD && (
              <div className="border-t p-4">
                <SectionHeader icon={<Globe className="h-4 w-4" />} title="Population Frequency" />

                {/* Frequency bar + 1 in X */}
                {variant.global_af !== null && variant.global_af > 0 ? (
                  <div className="mb-3">
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                        style={{ width: `${getProgressWidth(variant.global_af)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base">{formatOneInX(variant.global_af)}</span>
                      {getRarityLabel(variant.global_af) && (
                        <Badge variant="outline" className={`text-tiny font-medium ${getRarityLabel(variant.global_af)!.color}`}>
                          {getRarityLabel(variant.global_af)!.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : variant.global_af === 0 ? (
                  <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="text-base text-purple-900">Not observed in gnomAD</span>
                  </div>
                ) : null}

                {(variant.global_ac !== null || variant.global_an !== null) && (
                  <Row label="Allele Count">
                    <span className="text-base">
                      {variant.global_ac?.toLocaleString() ?? '-'} / {variant.global_an?.toLocaleString() ?? '-'}
                      {variant.global_hom !== null && variant.global_hom > 0 && ` (${variant.global_hom} hom)`}
                    </span>
                  </Row>
                )}
                {variant.popmax && (
                  <Row label="PopMax Population">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{POPULATION_NAMES[variant.popmax.toLowerCase()] || variant.popmax}</span>
                      <Badge variant="outline" className="text-tiny font-medium">{variant.popmax.toUpperCase()}</Badge>
                    </div>
                  </Row>
                )}
                {variant.popmax && variant.af_grpmax !== null && (
                  <Row label="PopMax Frequency">
                    <span className="text-base">{formatOneInX(variant.af_grpmax)}</span>
                  </Row>
                )}
                {(variant.rsid || variant.clinvar_rsid) && (
                  <Row label="rsID"><span className="text-base">{variant.rsid || `ClinVar:${variant.clinvar_rsid}`}</span></Row>
                )}
                <div className="pt-2">
                  <a href={gnomadUrl} target="_blank" rel="noopener noreferrer" className="text-base text-primary hover:underline flex items-center gap-1">View in gnomAD <ExternalLink className="h-3 w-3" /></a>
                </div>
              </div>
            )}

            {/* --- Sequencing Quality --- */}
            <div className="border-t p-4">
              <SectionHeader icon={<Gauge className="h-4 w-4" />} title="Sequencing Quality" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div>
                  {variant.genotype && (
                    <Row label="Genotype">
                      <div className="flex items-center gap-2">
                        {(!zygosity || zygosity.label === '-') && <span className="text-base">{variant.genotype}</span>}
                        {zygosity && zygosity.label !== '-' && (
                          <Badge variant="outline" className={`text-tiny font-medium ${zygosity.color}`}>{zygosity.label}</Badge>
                        )}
                      </div>
                    </Row>
                  )}
                  {variant.depth !== null && <Row label="Depth"><span className="text-base">{variant.depth}x</span></Row>}
                  {variant.allelic_depth !== null && <Row label="Allelic Depth"><span className="text-base">{variant.allelic_depth}</span></Row>}
                </div>
                <div>
                  {variant.genotype_quality !== null && <Row label="GQ"><span className="text-base">{variant.genotype_quality}</span></Row>}
                  {variant.quality !== null && <Row label="QUAL"><span className="text-base">{variant.quality?.toFixed(1)}</span></Row>}
                  {variant.filter_status && (
                    <Row label="Filter">
                      <Badge variant="outline" className={`text-tiny font-medium ${variant.filter_status === 'PASS' ? 'bg-green-100 text-green-900 border-green-300' : 'bg-red-100 text-red-900 border-red-300'}`}>
                        {variant.filter_status}
                      </Badge>
                    </Row>
                  )}
                </div>
              </div>
              {hasFilters && (
                <div className={`mt-3 pt-3 border-t border-border/50 ${anyFilterFailed ? 'rounded-lg bg-red-50/50 p-2' : ''}`}>
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
            </div>

            {/* --- Variant Details --- */}
            <div className="border-t p-4">
              <SectionHeader icon={<Dna className="h-4 w-4" />} title="Variant Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div>
                  <CopyableValue label="HGVS Genomic" value={variant.hgvs_genomic} />
                  <CopyableValue label="HGVS cDNA" value={variant.hgvs_cdna} />
                  <CopyableValue label="HGVS Protein" value={variant.hgvs_protein} />
                  {variant.consequence && (
                    <div className="py-1.5 border-b border-border/50">
                      <p className="text-base text-muted-foreground mb-1.5">Consequence</p>
                      <ConsequenceBadges consequence={variant.consequence} maxBadges={6} className="text-xs" />
                    </div>
                  )}
                </div>
                <div>
                  {variant.impact && (
                    <Row label="Impact">
                      <Badge variant="outline" className={`text-tiny font-medium ${getImpactColor(variant.impact)}`}>{formatImpactDisplay(variant.impact)}</Badge>
                    </Row>
                  )}
                  {variant.transcript_id && <Row label="Transcript"><span className="text-sm">{variant.transcript_id}</span></Row>}
                  {variant.exon_number && <Row label="Exon"><span className="text-base">{variant.exon_number}</span></Row>}
                  {variant.gene_id && (
                    <Row label="Gene">
                      <a href={`https://www.ensembl.org/Homo_sapiens/Gene/Summary?g=${variant.gene_id}`} target="_blank" rel="noopener noreferrer" className="text-base text-primary hover:underline flex items-center gap-1">{variant.gene_id} <ExternalLink className="h-3 w-3" /></a>
                    </Row>
                  )}
                  {variant.biotype && (
                    <Row label="Biotype">
                      <Badge variant="secondary" className="text-tiny font-medium">{formatBiotype(variant.biotype)}</Badge>
                    </Row>
                  )}
                  {variant.domains && (
                    <div className="py-1.5 border-b border-border/50">
                      <p className="text-base text-muted-foreground mb-1.5">Protein Domains</p>
                      <div className="flex flex-wrap gap-1">
                        {variant.domains.split(',').filter(Boolean).slice(0, 4).map((d: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-tiny font-medium">{d.trim()}</Badge>
                        ))}
                        {variant.domains.split(',').length > 4 && (
                          <Badge variant="outline" className="text-tiny font-medium">+{variant.domains.split(',').length - 4} more</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>


        </div>
      </div>
    </div>
  )
}
