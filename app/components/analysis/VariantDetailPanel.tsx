"use client"

/**
 * VariantDetailPanel - Comprehensive variant information view
 * Organized in cards by clinical priority for geneticists
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  Loader2,
  Dna,
  Shield,
  Activity,
  Users,
  FileText,
  Gauge,
  Target,
  TrendingUp,
  Star,
  Search,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useVariant } from '@/hooks/queries'
import { useHPOTerm } from '@/hooks/queries'
import { ConsequenceBadges, getImpactColor } from '@/components/shared'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface VariantDetailPanelProps {
  sessionId: string
  variantIdx: number
  onBack: () => void
}

const InfoRow = ({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) => {
  if (value === null || value === undefined || value === '') return null

  return (
    <div className="flex justify-between items-start py-1.5">
      <span className="text-base text-muted-foreground">{label}</span>
      <span className={`text-md font-medium text-right ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
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

const getPredictionColor = (pred: string | null) => {
  if (!pred) return 'bg-gray-100'
  const first = pred[0].toUpperCase()
  if (first === 'D' || first === 'T') return 'bg-red-100 text-red-900 border-red-300'
  if (first === 'P') return 'bg-orange-100 text-orange-900 border-orange-300'
  if (first === 'N') return 'bg-green-100 text-green-900 border-green-300'
  return 'bg-gray-100'
}

const formatDiseaseName = (disease: string | null | undefined): string[] => {
  if (!disease) return []
  return disease
    .split('|')
    .map(d => d.trim().replace(/_/g, ' '))
    .filter(Boolean)
}

const formatReviewStatus = (status: string | null | undefined): string[] => {
  if (!status) return []
  return status
    .split(',')
    .map(s => s.trim().replace(/_/g, ' '))
    .filter(Boolean)
}

const formatBiotype = (biotype: string | null | undefined): string => {
  if (!biotype) return ''
  return biotype.replace(/_/g, ' ')
}

interface HPOTermData {
  hpo_id: string
  name: string
}

// HPO Term Card Component - similar to gene cards
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
    if (isOpen && !shouldFetch) {
      setShouldFetch(true)
    }
  }, [isOpen, shouldFetch])

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card text-card-foreground">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-8">
                  #{index + 1}
                </span>
                <span className="text-lg font-semibold">{name}</span>
                <Badge variant="outline" className="text-sm font-mono">
                  {hpoId}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-md">Loading phenotype details...</span>
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
                        {hpoData.synonyms.slice(0, 5).map((syn, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm font-normal">
                            {syn}
                          </Badge>
                        ))}
                        {hpoData.synonyms.length > 5 && (
                          <Badge variant="outline" className="text-sm">
                            +{hpoData.synonyms.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    
                      <a href={`https://hpo.jax.org/browse/term/${hpoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-md text-primary hover:underline flex items-center gap-1"
                    >
                      View in HPO Browser
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-md text-muted-foreground italic">
                  No additional details available
                </p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

// Constants for lazy loading
const HPO_INITIAL_COUNT = 10
const HPO_LOAD_MORE_COUNT = 10

export function VariantDetailPanel({ sessionId, variantIdx, onBack }: VariantDetailPanelProps) {
  const { data, isLoading, error } = useVariant(sessionId, variantIdx)
  const [hpoSearchQuery, setHpoSearchQuery] = useState('')
  const [visibleHPOCount, setVisibleHPOCount] = useState(HPO_INITIAL_COUNT)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const variant = data?.variant

  // Parse HPO data from variant
  const hpoTerms = useMemo<HPOTermData[]>(() => {
    if (!variant?.hpo_ids || !variant?.hpo_names) {
      return []
    }

    const idsList = variant.hpo_ids
      .split(';')
      .map(t => t.trim())
      .filter(Boolean)

    const namesList = variant.hpo_names
      .split(';')
      .map(p => p.trim())
      .filter(Boolean)

    return idsList.map((hpo_id, idx) => ({
      hpo_id,
      name: namesList[idx] || 'Unknown phenotype',
    }))
  }, [variant?.hpo_ids, variant?.hpo_names])

  // Filter HPO terms
  const filteredHPOTerms = useMemo(() => {
    if (!hpoSearchQuery) return hpoTerms

    const query = hpoSearchQuery.toLowerCase()
    return hpoTerms.filter(term =>
      term.name.toLowerCase().includes(query) ||
      term.hpo_id.toLowerCase().includes(query)
    )
  }, [hpoTerms, hpoSearchQuery])

  // Visible HPO terms with lazy loading
  const displayedHPOTerms = useMemo(() => {
    return filteredHPOTerms.slice(0, visibleHPOCount)
  }, [filteredHPOTerms, visibleHPOCount])

  const hasMoreHPO = visibleHPOCount < filteredHPOTerms.length

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleHPOCount(HPO_INITIAL_COUNT)
  }, [hpoSearchQuery])

  // Load more HPO terms when scrolling
  const loadMoreHPO = useCallback(() => {
    if (hasMoreHPO) {
      setVisibleHPOCount(prev => prev + HPO_LOAD_MORE_COUNT)
    }
  }, [hasMoreHPO])

  // IntersectionObserver for lazy loading HPO terms
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreHPO) {
          loadMoreHPO()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMoreHPO, loadMoreHPO])

  // Check data availability
  const hasPredictions = variant && (
    variant.sift_pred || variant.sift_score !== null ||
    variant.alphamissense_pred || variant.alphamissense_score !== null ||
    variant.metasvm_pred || variant.metasvm_score !== null ||
    variant.dann_score !== null
  )

  const hasGnomAD = variant && (
    variant.global_af !== null || variant.global_ac !== null ||
    variant.global_an !== null || variant.global_hom !== null
  )

  const hasConservation = variant && (
    variant.phylop100way_vertebrate !== null || variant.gerp_rs !== null ||
    variant.pli !== null || variant.oe_lof_upper !== null ||
    variant.oe_lof !== null || variant.mis_z !== null ||
    variant.haploinsufficiency_score !== null || variant.triplosensitivity_score !== null
  )

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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

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
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium">Failed to load variant</p>
            <p className="text-md text-muted-foreground mt-2">{error?.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b space-y-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="text-base">Back to Analysis</span>
        </Button>

        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-2xl font-bold">
              {variant.gene_symbol || 'Unknown Gene'}
            </h2>
            <span className="text-base text-muted-foreground font-mono font-semibold">
              {variant.chromosome}:{variant.position.toLocaleString()} {variant.reference_allele} → {variant.alternate_allele}
            </span>
            {variant.priority_tier && (
              <Badge variant="outline" className="text-sm">
                Tier {variant.priority_tier}
              </Badge>
            )}
          </div>
          {variant.hgvs_protein && (
            <p className="text-sm text-muted-foreground font-mono mt-1">{variant.hgvs_protein}</p>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">

          {/* ACMG Classification */}
          <Card className={variant.acmg_class ? 'border-2' : ''}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                ACMG Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Classification</span>
                <Badge variant="outline" className={`text-md ${getACMGColor(variant.acmg_class)}`}>
                  {variant.acmg_class || 'Not Classified'}
                </Badge>
              </div>

              {variant.acmg_criteria && variant.acmg_criteria.length > 0 && (
                <div>
                  <p className="text-base text-muted-foreground mb-2">Evidence Codes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variant.acmg_criteria.split(',').filter(Boolean).map((c: string) => (
                      <Badge key={c} variant="outline" className="text-md font-mono">
                        {c.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-base text-muted-foreground">Confidence</p>
                  <p className="text-md font-bold">{variant.confidence_score?.toFixed(2) || '-'}</p>
                </div>
                <div>
                  <p className="text-base text-muted-foreground">Priority Score</p>
                  <p className="text-md font-bold">{variant.priority_score?.toFixed(1) || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ClinVar */}
            {(variant.clinical_significance || variant.clinvar_variation_id) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    ClinVar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Significance" value={variant.clinical_significance} />
                  {variant.review_status && (
                    <div className="py-1.5">
                      <p className="text-base text-muted-foreground mb-2">Review Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {formatReviewStatus(variant.review_status).map((status, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm font-normal">
                            {status}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {variant.review_stars && (
                    <div className="flex justify-between items-start py-1.5">
                      <span className="text-base text-muted-foreground">Review Stars</span>
                      <div className="flex gap-0.5">
                        {[...Array(variant.review_stars)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  )}
                  {variant.disease_name && (
                    <div className="py-1.5">
                      <p className="text-base text-muted-foreground mb-2">Disease</p>
                      <div className="flex flex-wrap gap-1.5">
                        {formatDiseaseName(variant.disease_name).map((disease, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm font-normal">
                            {disease}
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
            )}

            {/* Predictions */}
            {hasPredictions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {(variant.sift_pred || variant.sift_score !== null) && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-base text-muted-foreground">SIFT</span>
                          {variant.sift_pred && (
                            <Badge variant="outline" className={`text-sm ${getPredictionColor(variant.sift_pred)}`}>
                              {variant.sift_pred}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-md font-mono">{variant.sift_score?.toFixed(3) || '-'}</span>
                        </div>
                      </>
                    )}

                    {(variant.alphamissense_pred || variant.alphamissense_score !== null) && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-base text-muted-foreground">AlphaMissense</span>
                          {variant.alphamissense_pred && (
                            <Badge variant="outline" className={`text-sm ${getPredictionColor(variant.alphamissense_pred)}`}>
                              {variant.alphamissense_pred}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-md font-mono">{variant.alphamissense_score?.toFixed(3) || '-'}</span>
                        </div>
                      </>
                    )}

                    {(variant.metasvm_pred || variant.metasvm_score !== null) && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-base text-muted-foreground">MetaSVM</span>
                          {variant.metasvm_pred && (
                            <Badge variant="outline" className={`text-sm ${getPredictionColor(variant.metasvm_pred)}`}>
                              {variant.metasvm_pred}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-md font-mono">{variant.metasvm_score?.toFixed(3) || '-'}</span>
                        </div>
                      </>
                    )}

                    {variant.dann_score !== null && (
                      <>
                        <div className="text-base text-muted-foreground">DANN</div>
                        <div className="text-right">
                          <span className="text-md font-mono">{variant.dann_score.toFixed(3)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* gnomAD */}
            {hasGnomAD && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    gnomAD
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <InfoRow label="Global AF" value={variant.global_af?.toExponential(4)} mono />
                  <InfoRow label="Allele Count" value={variant.global_ac?.toLocaleString()} />
                  <InfoRow label="Allele Number" value={variant.global_an?.toLocaleString()} />
                  <InfoRow label="Homozygotes" value={variant.global_hom} />
                  <InfoRow label="PopMax" value={variant.popmax} />
                  <InfoRow label="PopMax AF" value={variant.af_grpmax?.toExponential(4)} mono />
                </CardContent>
              </Card>
            )}

            {/* Quality */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Quality
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-base text-muted-foreground">Genotype</p>
                    <p className="text-md font-mono font-medium">{variant.genotype || '-'}</p>
                  </div>
                  <div>
                    <p className="text-base text-muted-foreground">Quality</p>
                    <p className="text-md font-medium">{variant.quality?.toFixed(1) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-base text-muted-foreground">Depth</p>
                    <p className="text-md font-medium">{variant.depth || '-'}</p>
                  </div>
                  <div>
                    <p className="text-base text-muted-foreground">GQ</p>
                    <p className="text-md font-medium">{variant.genotype_quality || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Dna className="h-5 w-5" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="HGVS Genomic" value={variant.hgvs_genomic} mono />
                <InfoRow label="HGVS cDNA" value={variant.hgvs_cdna} mono />
                <InfoRow label="HGVS Protein" value={variant.hgvs_protein} mono />
                {variant.consequence && (
                  <div className="py-1.5">
                    <p className="text-base text-muted-foreground mb-2">Consequence</p>
                    <ConsequenceBadges consequence={variant.consequence} maxBadges={10} className="text-sm" />
                  </div>
                )}
                {variant.impact && (
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-base text-muted-foreground">Impact</span>
                    <Badge variant="outline" className={`text-sm ${getImpactColor(variant.impact)}`}>
                      {variant.impact}
                    </Badge>
                  </div>
                )}
                <InfoRow label="Transcript" value={variant.transcript_id} mono />
                <InfoRow label="Exon" value={variant.exon_number} />
                {variant.biotype && (
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-base text-muted-foreground">Biotype</span>
                    <Badge variant="secondary" className="text-sm font-normal">
                      {formatBiotype(variant.biotype)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conservation */}
            {hasConservation && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Conservation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(variant.phylop100way_vertebrate !== null || variant.gerp_rs !== null) && (
                      <div>
                        <p className="text-base text-muted-foreground mb-2">Scores</p>
                        <div className="grid grid-cols-2 gap-2">
                          <InfoRow label="PhyloP" value={variant.phylop100way_vertebrate?.toFixed(3)} mono />
                          <InfoRow label="GERP" value={variant.gerp_rs?.toFixed(2)} mono />
                        </div>
                      </div>
                    )}

                    {(variant.pli !== null || variant.oe_lof_upper !== null ||
                      variant.oe_lof !== null || variant.mis_z !== null) && (
                      <div>
                        <p className="text-base text-muted-foreground mb-2">Gene Constraints</p>
                        <div className="grid grid-cols-2 gap-2">
                          <InfoRow label="pLI" value={variant.pli?.toFixed(3)} mono />
                          <InfoRow label="LOEUF" value={variant.oe_lof_upper?.toFixed(3)} mono />
                          <InfoRow label="oe LoF" value={variant.oe_lof?.toFixed(3)} mono />
                          <InfoRow label="Missense Z" value={variant.mis_z?.toFixed(2)} mono />
                        </div>
                      </div>
                    )}

                    {(variant.haploinsufficiency_score !== null || variant.triplosensitivity_score !== null) && (
                      <div>
                        <p className="text-base text-muted-foreground mb-2">ClinGen Dosage</p>
                        <div className="grid grid-cols-2 gap-2">
                          <InfoRow label="HI Score" value={variant.haploinsufficiency_score} />
                          <InfoRow label="TS Score" value={variant.triplosensitivity_score} />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* HPO Phenotypes - Full width section with expandable cards */}
          {hpoTerms.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Phenotypes (HPO)</h3>
                </div>
                <span className="text-base text-muted-foreground">
                  Showing {displayedHPOTerms.length} of {filteredHPOTerms.length} phenotypes
                </span>
              </div>

              {hpoTerms.length > 10 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={hpoSearchQuery}
                    onChange={(e) => setHpoSearchQuery(e.target.value)}
                    placeholder="Search phenotypes..."
                    className="pl-9 pr-9 text-base"
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

              <div className="space-y-3">
                {displayedHPOTerms.map((term, idx) => (
                  <HPOPhenotypeCard
                    key={term.hpo_id}
                    hpoId={term.hpo_id}
                    name={term.name}
                    index={idx}
                  />
                ))}
              </div>

              {/* Lazy loading trigger */}
              {hasMoreHPO && (
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
