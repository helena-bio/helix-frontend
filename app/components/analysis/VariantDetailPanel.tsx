"use client"

/**
 * VariantDetailPanel - Comprehensive variant information view
 * Replaces chat panel when user clicks on a specific variant
 */

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { useVariant } from '@/hooks/queries'

interface VariantDetailPanelProps {
  sessionId: string
  variantIdx: number
  onBack: () => void
}

const InfoRow = ({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) => {
  if (value === null || value === undefined || value === '') return null
  
  return (
    <div className="flex justify-between items-start py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-right ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="text-base font-semibold">{title}</h3>
    <div className="space-y-1">{children}</div>
  </div>
)

const getPredictionBadge = (pred: string | null, score: number | null) => {
  if (!pred && !score) return null
  
  const colors: Record<string, string> = {
    'D': 'bg-red-100 text-red-900 border-red-300',
    'T': 'bg-orange-100 text-orange-900 border-orange-300',
    'N': 'bg-green-100 text-green-900 border-green-300',
    'P': 'bg-yellow-100 text-yellow-900 border-yellow-300',
  }
  
  const color = pred ? colors[pred[0]] || 'bg-gray-100' : 'bg-gray-100'
  const label = pred || (score !== null ? score.toFixed(3) : '-')
  
  return (
    <Badge variant="outline" className={`text-sm ${color}`}>
      {label}
    </Badge>
  )
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
          <h2 className="text-lg font-semibold">
            {variant.gene_symbol || 'Unknown Gene'}
          </h2>
          <p className="text-sm text-muted-foreground font-mono">
            {variant.chromosome}:{variant.position.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            {variant.reference_allele} → {variant.alternate_allele}
          </p>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          
          {/* Core Information */}
          <Section title="Core Information">
            <InfoRow label="HGVS Genomic" value={variant.hgvs_genomic} mono />
            <InfoRow label="HGVS cDNA" value={variant.hgvs_cdna} mono />
            <InfoRow label="HGVS Protein" value={variant.hgvs_protein} mono />
            <InfoRow label="Consequence" value={variant.consequence} />
            <InfoRow label="Impact" value={variant.impact} />
            <InfoRow label="Transcript" value={variant.transcript_id} mono />
            <InfoRow label="Exon" value={variant.exon_number} />
            <InfoRow label="Biotype" value={variant.biotype} />
          </Section>

          <Separator />

          {/* Quality Metrics */}
          <Section title="Quality Metrics">
            <InfoRow label="Genotype" value={variant.genotype} mono />
            <InfoRow label="Quality Score" value={variant.quality?.toFixed(1)} />
            <InfoRow label="Depth" value={variant.depth} />
            <InfoRow label="Allelic Depth" value={variant.allelic_depth} />
            <InfoRow label="GQ" value={variant.genotype_quality} />
            <InfoRow label="Filter" value={variant.filter_status} />
          </Section>

          <Separator />

          {/* ACMG Classification */}
          <Section title="ACMG Classification">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Classification</span>
              <Badge variant="outline" className="text-sm">
                {variant.acmg_class || 'Not Classified'}
              </Badge>
            </div>
            {variant.acmg_criteria && (
              <div className="py-2">
                <span className="text-sm text-muted-foreground block mb-2">Criteria</span>
                <div className="flex flex-wrap gap-1">
                  {variant.acmg_criteria.split(',').filter(Boolean).map((c: string) => (
                    <Badge key={c} variant="outline" className="text-xs">
                      {c.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <InfoRow label="Confidence" value={variant.confidence_score?.toFixed(2)} />
            <InfoRow label="Priority Tier" value={variant.priority_tier ? `T${variant.priority_tier}` : null} />
            <InfoRow label="Priority Score" value={variant.priority_score?.toFixed(2)} />
          </Section>

          <Separator />

          {/* Pathogenicity Predictions */}
          <Section title="Pathogenicity Predictions">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">SIFT</span>
                {getPredictionBadge(variant.sift_pred, variant.sift_score)}
              </div>
              <InfoRow label="Score" value={variant.sift_score?.toFixed(3)} mono />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">AlphaMissense</span>
                {getPredictionBadge(variant.alphamissense_pred, variant.alphamissense_score)}
              </div>
              <InfoRow label="Score" value={variant.alphamissense_score?.toFixed(3)} mono />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">MetaSVM</span>
                {getPredictionBadge(variant.metasvm_pred, variant.metasvm_score)}
              </div>
              <InfoRow label="Score" value={variant.metasvm_score?.toFixed(3)} mono />
              
              <InfoRow label="DANN" value={variant.dann_score?.toFixed(3)} mono />
            </div>
          </Section>

          <Separator />

          {/* Population Frequencies */}
          <Section title="Population Frequencies (gnomAD)">
            <InfoRow label="Global AF" value={variant.global_af?.toExponential(4)} mono />
            <InfoRow label="Allele Count" value={variant.global_ac?.toLocaleString()} />
            <InfoRow label="Allele Number" value={variant.global_an?.toLocaleString()} />
            <InfoRow label="Homozygotes" value={variant.global_hom} />
            <InfoRow label="PopMax" value={variant.popmax} />
            <InfoRow label="PopMax AF" value={variant.af_grpmax?.toExponential(4)} mono />
          </Section>

          <Separator />

          {/* Clinical Significance */}
          {(variant.clinical_significance || variant.clinvar_variation_id) && (
            <>
              <Section title="Clinical Significance (ClinVar)">
                <InfoRow label="Significance" value={variant.clinical_significance} />
                <InfoRow label="Review Status" value={variant.review_status} />
                <InfoRow label="Stars" value={variant.review_stars ? '⭐'.repeat(variant.review_stars) : null} />
                <InfoRow label="Variation ID" value={variant.clinvar_variation_id} mono />
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
              </Section>
              <Separator />
            </>
          )}

          {/* Conservation Scores */}
          <Section title="Conservation Scores">
            <InfoRow label="PhyloP (100-way)" value={variant.phylop100way_vertebrate?.toFixed(3)} mono />
            <InfoRow label="GERP RS" value={variant.gerp_rs?.toFixed(2)} mono />
          </Section>

          <Separator />

          {/* Gene Constraints */}
          <Section title="Gene Constraint Metrics">
            <InfoRow label="pLI" value={variant.pli?.toFixed(3)} mono />
            <InfoRow label="LOEUF" value={variant.oe_lof_upper?.toFixed(3)} mono />
            <InfoRow label="oe LoF" value={variant.oe_lof?.toFixed(3)} mono />
            <InfoRow label="Missense Z" value={variant.mis_z?.toFixed(2)} mono />
          </Section>

          <Separator />

          {/* ClinGen Dosage Sensitivity */}
          <Section title="ClinGen Dosage Sensitivity">
            <InfoRow 
              label="Haploinsufficiency" 
              value={variant.haploinsufficiency_score !== null ? `Score ${variant.haploinsufficiency_score}` : null} 
            />
            <InfoRow 
              label="Triplosensitivity" 
              value={variant.triplosensitivity_score !== null ? `Score ${variant.triplosensitivity_score}` : null} 
            />
          </Section>

          {/* HPO Phenotypes */}
          {variant.hpo_phenotypes && (
            <>
              <Separator />
              <Section title="Associated Phenotypes (HPO)">
                <InfoRow label="Count" value={variant.hpo_count} />
                <div className="py-2">
                  <span className="text-sm text-muted-foreground block mb-2">Phenotypes</span>
                  <p className="text-sm">{variant.hpo_phenotypes}</p>
                </div>
                {variant.hpo_terms && (
                  <div className="py-2">
                    <span className="text-sm text-muted-foreground block mb-2">HPO Terms</span>
                    <div className="flex flex-wrap gap-1">
                      {variant.hpo_terms.split(',').filter(Boolean).map((term: string) => (
                        <Badge key={term} variant="secondary" className="text-xs">
                          {term.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            </>
          )}

        </div>
      </ScrollArea>
    </div>
  )
}
