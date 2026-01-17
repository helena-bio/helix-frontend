"use client"

/**
 * VariantDetailPanel - Comprehensive variant information view
 * Organized in cards by clinical priority for geneticists
 */

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  X
} from 'lucide-react'
import { useVariant } from '@/hooks/queries'
import { HPOTermCard } from './HPOTermCard'

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

interface HPOTermData {
  hpo_id: string
  name: string
}

export function VariantDetailPanel({ sessionId, variantIdx, onBack }: VariantDetailPanelProps) {
  const { data, isLoading, error } = useVariant(sessionId, variantIdx)
  const [hpoSearchQuery, setHpoSearchQuery] = useState('')
  const [showAllHPO, setShowAllHPO] = useState(false)

  const variant = data?.variant

  // Parse HPO data from variant - FIXED: hpo_terms and hpo_phenotypes are swapped in DuckDB
  const hpoTerms = useMemo<HPOTermData[]>(() => {
    if (!variant?.hpo_terms || !variant?.hpo_phenotypes) {
      return []
    }

    // IMPORTANT: DuckDB columns are swapped!
    // hpo_phenotypes contains HPO IDs (HP:XXXXXXX)
    // hpo_terms contains phenotype names (text descriptions)
    const idsList = variant.hpo_phenotypes
      .split(';')
      .map(t => t.trim())
      .filter(Boolean)
    
    const namesList = variant.hpo_terms
      .split(';')
      .map(p => p.trim())
      .filter(Boolean)

    // Map IDs to names
    return idsList.map((hpo_id, idx) => ({
      hpo_id,
      name: namesList[idx] || 'Unknown phenotype',
    }))
  }, [variant?.hpo_terms, variant?.hpo_phenotypes])

  // Filter HPO terms by search query
  const filteredHPOTerms = useMemo(() => {
    if (!hpoSearchQuery) return hpoTerms

    const query = hpoSearchQuery.toLowerCase()
    return hpoTerms.filter(term =>
      term.name.toLowerCase().includes(query) ||
      term.hpo_id.toLowerCase().includes(query)
    )
  }, [hpoTerms, hpoSearchQuery])

  // Pagination for HPO terms
  const HPO_PAGE_SIZE = 10
  const displayedHPOTerms = showAllHPO ? filteredHPOTerms : filteredHPOTerms.slice(0, HPO_PAGE_SIZE)
  const hasMoreHPO = filteredHPOTerms.length > HPO_PAGE_SIZE

  // Check if we have prediction data
  const hasPredictions = variant && (
    variant.sift_pred || variant.sift_score !== null ||
    variant.alphamissense_pred || variant.alphamissense_score !== null ||
    variant.metasvm_pred || variant.metasvm_score !== null ||
    variant.dann_score !== null
  )

  // Check if we have gnomAD data
  const hasGnomAD = variant && (
    variant.global_af !== null || variant.global_ac !== null ||
    variant.global_an !== null || variant.global_hom !== null
  )

  // Check if we have conservation data
  const hasConservation = variant && (
    variant.phylop100way_vertebrate !== null || variant.gerp_rs !== null ||
    variant.pli !== null || variant.oe_lof_upper !== null ||
    variant.oe_lof !== null || variant.mis_z !== null ||
    variant.haploinsufficiency_score !== null || variant.triplosensitivity_score !== null
  )

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
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
      <div className="flex flex-col h-full">
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="text-base">Back to Analysis</span>
        </Button>

        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
              {variant.gene_symbol || 'Unknown Gene'}
            </h2>
            {variant.priority_tier && (
              <Badge variant="outline" className="text-sm">
                Tier {variant.priority_tier}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {variant.chromosome}:{variant.position.toLocaleString()} {variant.reference_allele} → {variant.alternate_allele}
          </p>
          {variant.hgvs_protein && (
            <p className="text-sm text-muted-foreground font-mono">{variant.hgvs_protein}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

          {/* ACMG Classification - Always show, full width */}
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
                <Badge variant="outline" className={`text-base ${getACMGColor(variant.acmg_class)}`}>
                  {variant.acmg_class || 'Not Classified'}
                </Badge>
              </div>

              {variant.acmg_criteria && variant.acmg_criteria.length > 0 && (
                <div>
                  <p className="text-base text-muted-foreground mb-2">Evidence Codes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variant.acmg_criteria.split(',').filter(Boolean).map((c: string) => (
                      <Badge key={c} variant="outline" className="text-xs font-mono">
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

          {/* 2-column grid for remaining cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Clinical Significance (ClinVar) */}
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
                  <InfoRow label="Review Status" value={variant.review_status} />
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
                  <InfoRow label="Disease" value={variant.disease_name} />
                  {variant.clinvar_variation_id && (
                    <div className="pt-2">
                      <a href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.clinvar_variation_id}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View in ClinVar
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pathogenicity Predictions */}
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

            {/* Population Frequencies */}
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

            {/* Quality Metrics */}
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

            {/* Variant Details */}
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
                <InfoRow label="Consequence" value={variant.consequence} />
                <InfoRow label="Impact" value={variant.impact} />
                <InfoRow label="Transcript" value={variant.transcript_id} mono />
                <InfoRow label="Exon" value={variant.exon_number} />
                <InfoRow label="Biotype" value={variant.biotype} />
              </CardContent>
            </Card>

            {/* Conservation & Constraint */}
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

            {/* HPO Phenotypes - Using HPOTermCard component */}
            {hpoTerms.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Phenotypes (HPO)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <span className="text-base text-muted-foreground">Total HPO Terms</span>
                    <Badge variant="outline" className="text-md font-bold">
                      {hpoTerms.length}
                    </Badge>
                  </div>

                  {/* Search bar if more than 10 terms */}
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

                  {/* Filtered count */}
                  {hpoSearchQuery && (
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredHPOTerms.length} of {hpoTerms.length} phenotypes
                    </p>
                  )}

                  {/* HPO Terms using HPOTermCard */}
                  <div className="space-y-2">
                    {displayedHPOTerms.map((term) => (
                      <HPOTermCard
                        key={term.hpo_id}
                        hpoId={term.hpo_id}
                        name={term.name}
                        readOnly
                      />
                    ))}
                  </div>

                  {/* Show More/Less button */}
                  {hasMoreHPO && !hpoSearchQuery && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllHPO(!showAllHPO)}
                      >
                        {showAllHPO ? (
                          <>Show Less</>
                        ) : (
                          <>Show All ({filteredHPOTerms.length - HPO_PAGE_SIZE} more)</>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* No results message */}
                  {hpoSearchQuery && filteredHPOTerms.length === 0 && (
                    <p className="text-center text-md text-muted-foreground py-4">
                      No matching phenotypes found
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
