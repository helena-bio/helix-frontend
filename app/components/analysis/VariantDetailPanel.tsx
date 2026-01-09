"use client"

/**
 * VariantDetailPanel - Comprehensive variant information view
 * Organized in cards by clinical priority for geneticists
 */

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  ExternalLink, 
  AlertCircle, 
  Loader2,
  Dna,
  Shield,
  BarChart3,
  Activity,
  Users,
  FileText,
  Gauge,
  Target,
  TrendingUp
} from 'lucide-react'
import { useVariant } from '@/hooks/queries'

interface VariantDetailPanelProps {
  sessionId: string
  variantIdx: number
  onBack: () => void
}

const InfoRow = ({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) => {
  if (value === null || value === undefined || value === '') return null
  
  return (
    <div className="flex justify-between items-start py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-right ${mono ? 'font-mono' : ''}`}>
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

export function VariantDetailPanel({ sessionId, variantIdx, onBack }: VariantDetailPanelProps) {
  const { data, isLoading, error } = useVariant(sessionId, variantIdx)
  
  const variant = data?.variant

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
            {variant.chromosome}:{variant.position.toLocaleString()} • {variant.reference_allele} → {variant.alternate_allele}
          </p>
          {variant.hgvs_protein && (
            <p className="text-sm text-muted-foreground font-mono">{variant.hgvs_protein}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          
          {/* TOP PRIORITY: ACMG Classification */}
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
                  <p className="text-sm text-muted-foreground mb-2">Evidence Codes</p>
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
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="text-lg font-bold">{variant.confidence_score?.toFixed(2) || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority Score</p>
                  <p className="text-lg font-bold">{variant.priority_score?.toFixed(1) || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Significance (ClinVar) */}
          {(variant.clinical_significance || variant.clinvar_variation_id) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Clinical Significance (ClinVar)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Significance" value={variant.clinical_significance} />
                <InfoRow label="Review Status" value={variant.review_status} />
                <InfoRow label="Stars" value={variant.review_stars ? '⭐'.repeat(variant.review_stars) : null} />
                <InfoRow label="Disease" value={variant.disease_name} />
                {variant.clinvar_variation_id && (
                  <div className="pt-2">
                    
                      href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.clinvar_variation_id}/`}
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Pathogenicity Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {/* SIFT */}
                {(variant.sift_pred || variant.sift_score !== null) && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-20">SIFT</span>
                      {variant.sift_pred && (
                        <Badge variant="outline" className={`text-sm ${getPredictionColor(variant.sift_pred)}`}>
                          {variant.sift_pred}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono">{variant.sift_score?.toFixed(3) || '-'}</span>
                    </div>
                  </>
                )}
                
                {/* AlphaMissense */}
                {(variant.alphamissense_pred || variant.alphamissense_score !== null) && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-20">AlphaMissense</span>
                      {variant.alphamissense_pred && (
                        <Badge variant="outline" className={`text-sm ${getPredictionColor(variant.alphamissense_pred)}`}>
                          {variant.alphamissense_pred}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono">{variant.alphamissense_score?.toFixed(3) || '-'}</span>
                    </div>
                  </>
                )}
                
                {/* MetaSVM */}
                {(variant.metasvm_pred || variant.metasvm_score !== null) && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-20">MetaSVM</span>
                      {variant.metasvm_pred && (
                        <Badge variant="outline" className={`text-sm ${getPredictionColor(variant.metasvm_pred)}`}>
                          {variant.metasvm_pred}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono">{variant.metasvm_score?.toFixed(3) || '-'}</span>
                    </div>
                  </>
                )}
                
                {/* DANN */}
                {variant.dann_score !== null && (
                  <>
                    <div className="text-sm text-muted-foreground">DANN</div>
                    <div className="text-right">
                      <span className="text-sm font-mono">{variant.dann_score.toFixed(3)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Population Frequencies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Population Frequencies (gnomAD)
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

          {/* Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Quality Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Genotype</p>
                  <p className="text-base font-mono font-medium">{variant.genotype || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quality Score</p>
                  <p className="text-base font-medium">{variant.quality?.toFixed(1) || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Depth</p>
                  <p className="text-base font-medium">{variant.depth || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GQ</p>
                  <p className="text-base font-medium">{variant.genotype_quality || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variant Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Dna className="h-5 w-5" />
                Variant Details
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Conservation & Constraint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Conservation Scores</p>
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRow label="PhyloP" value={variant.phylop100way_vertebrate?.toFixed(3)} mono />
                    <InfoRow label="GERP" value={variant.gerp_rs?.toFixed(2)} mono />
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Gene Constraint Metrics</p>
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRow label="pLI" value={variant.pli?.toFixed(3)} mono />
                    <InfoRow label="LOEUF" value={variant.oe_lof_upper?.toFixed(3)} mono />
                    <InfoRow label="oe LoF" value={variant.oe_lof?.toFixed(3)} mono />
                    <InfoRow label="Missense Z" value={variant.mis_z?.toFixed(2)} mono />
                  </div>
                </div>

                {(variant.haploinsufficiency_score !== null || variant.triplosensitivity_score !== null) && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">ClinGen Dosage Sensitivity</p>
                    <div className="grid grid-cols-2 gap-2">
                      <InfoRow label="HI Score" value={variant.haploinsufficiency_score} />
                      <InfoRow label="TS Score" value={variant.triplosensitivity_score} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* HPO Phenotypes */}
          {variant.hpo_phenotypes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Associated Phenotypes (HPO)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Phenotype Count</span>
                  <span className="text-base font-medium">{variant.hpo_count}</span>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Phenotypes</p>
                  <p className="text-sm">{variant.hpo_phenotypes}</p>
                </div>
                
                {variant.hpo_terms && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">HPO Terms</p>
                    <div className="flex flex-wrap gap-1">
                      {variant.hpo_terms.split(',').filter(Boolean).map((term: string) => (
                        <Badge key={term} variant="secondary" className="text-xs">
                          {term.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </ScrollArea>
    </div>
  )
}
