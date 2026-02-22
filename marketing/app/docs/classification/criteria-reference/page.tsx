import Link from 'next/link'

export const metadata = {
  title: 'Criteria Reference | Helix Insight Documentation',
  description: 'Complete reference for all 28 ACMG evidence criteria -- conditions, thresholds, databases, and limitations for each criterion.',
}

interface Criterion {
  code: string
  name: string
  strength: string
  status: 'automated' | 'manual' | 'disabled'
  conditions?: string[]
  exclusions?: string[]
  databases?: string
  limitations?: string[]
  note?: string
  reason?: string
}

const pathogenicCriteria: Criterion[] = [
  {
    code: 'PVS1', name: 'Null variant in gene where loss-of-function is a known disease mechanism', strength: 'Very Strong', status: 'automated',
    conditions: ['Impact = HIGH', 'Consequence: frameshift, stop_gained, splice_acceptor, or splice_donor', 'Gene constraint: pLI > 0.9 OR LOEUF < 0.35'],
    exclusions: ['NMD-rescued transcripts', 'Stop-retained and stop-lost variants', 'HLA gene family'],
    databases: 'VEP (consequence, impact), gnomAD Constraint (pLI, LOEUF)',
    limitations: ['Does not evaluate reading frame rescue or alternative transcript usage', 'Last-exon truncation logic not implemented', 'VCEP gene-specific PVS1 applicability gate available for ~50-60 genes'],
  },
  {
    code: 'PS1', name: 'Same amino acid change as an established pathogenic variant', strength: 'Strong', status: 'automated',
    conditions: ['ClinVar: Pathogenic or Likely Pathogenic', 'ClinVar review stars >= 2'],
    databases: 'ClinVar',
    limitations: ['Matches exact variant, not amino acid position (PM5 matching is disabled)'],
  },
  {
    code: 'PS2', name: 'De novo variant (confirmed paternity and maternity)', strength: 'Strong', status: 'manual',
    reason: 'Requires trio sequencing data and confirmed parental relationships.',
  },
  {
    code: 'PS3', name: 'Functional studies show a deleterious effect', strength: 'Strong', status: 'manual',
    reason: 'Requires curation of published functional assay data.',
  },
  {
    code: 'PS4', name: 'Prevalence significantly increased in affected individuals', strength: 'Strong', status: 'manual',
    reason: 'Requires case-control study data or odds ratios.',
  },
  {
    code: 'PM1', name: 'Located in a functional domain', strength: 'Moderate', status: 'automated',
    conditions: ['Variant overlaps a Pfam protein domain'],
    databases: 'VEP (domains)',
    limitations: ['All Pfam domains treated equally regardless of functional importance'],
  },
  {
    code: 'PM2', name: 'Absent from controls or at extremely low frequency', strength: 'Moderate', status: 'automated',
    conditions: ['gnomAD global AF < 0.0001 (0.01%)', 'Frequency data must be present (non-NULL)'],
    databases: 'gnomAD v4.1',
    limitations: ['ClinGen SVI PM2_Supporting downgrade not implemented', 'VCEP gene-specific PM2 thresholds available when enabled'],
  },
  {
    code: 'PM3', name: 'Detected in trans with a pathogenic variant for recessive disorders', strength: 'Moderate', status: 'automated',
    conditions: ['Compound heterozygote candidate flag = true'],
    limitations: ['Inferred from genotype data without formal phasing'],
  },
  {
    code: 'PM4', name: 'Protein length change in a non-repetitive region', strength: 'Moderate', status: 'automated',
    conditions: ['In-frame insertion or deletion', 'Located within a Pfam functional domain', 'Not in a repetitive or low-complexity region'],
    exclusions: ['HLA gene family'],
    databases: 'VEP (consequence, domains)',
  },
  {
    code: 'PM5', name: 'Novel missense at known pathogenic amino acid position', strength: 'Moderate', status: 'disabled',
    reason: 'Pending standardized protein-level coordinate matching in ClinVar preprocessing.',
  },
  {
    code: 'PM6', name: 'Assumed de novo without confirmation', strength: 'Moderate', status: 'manual',
    reason: 'Requires family structure information not available in single-sample analysis.',
  },
  {
    code: 'PP1', name: 'Cosegregation with disease in multiple affected family members', strength: 'Supporting', status: 'manual',
    reason: 'Requires multi-generational pedigree data.',
  },
  {
    code: 'PP2', name: 'Missense in a gene with low rate of benign missense variation', strength: 'Supporting', status: 'automated',
    conditions: ['Missense variant', 'Gene constraint: pLI > 0.5'],
    databases: 'VEP (consequence), gnomAD Constraint (pLI)',
  },
  {
    code: 'PP3', name: 'Computational evidence supports a deleterious effect', strength: 'Supporting / Moderate / Strong', status: 'automated',
    conditions: [
      'Path A (Missense): BayesDel_noAF with ClinGen SVI calibrated thresholds -- PP3_Strong (>= 0.518, +4 pts), PP3_Moderate (0.290-0.517, +2 pts), PP3_Supporting (0.130-0.289, +1 pt)',
      'PM1 + PP3 double-counting guard: when PM1 applies alongside PP3_Strong, PP3 is downgraded to PP3_Moderate (combined cap at Strong equivalent)',
      'Path B (Splice): SpliceAI max_score >= 0.2 AND PVS1 does not apply (ClinGen SVI double-counting guard). Always Supporting strength.',
    ],
    databases: 'dbNSFP 4.9c (BayesDel_noAF), SpliceAI (max_score)',
    limitations: ['BayesDel_noAF excludes allele frequency to avoid circular reasoning with PM2/BA1/BS1'],
  },
  {
    code: 'PP4', name: 'Patient phenotype matches gene disease association', strength: 'Supporting', status: 'automated',
    conditions: ['>= 3 patient HPO terms match the gene HPO profile', 'OR >= 2 matches with highly specific gene (<= 5 total HPO associations)'],
    databases: 'HPO (gene-phenotype associations)',
    note: 'Requires patient HPO terms to be provided.',
  },
  {
    code: 'PP5', name: 'Reputable source reports variant as pathogenic', strength: 'Supporting', status: 'automated',
    conditions: ['ClinVar: Pathogenic or Likely Pathogenic', 'Review stars >= 1 AND < 2 (lower confidence than PS1)'],
    databases: 'ClinVar',
    note: 'ClinGen SVI recommended retiring PP5; retained for maximum sensitivity.',
  },
]

const benignCriteria: Criterion[] = [
  {
    code: 'BA1', name: 'Allele frequency above 5%', strength: 'Stand-alone', status: 'automated',
    conditions: ['gnomAD global AF > 0.05 (5%)'],
    databases: 'gnomAD v4.1',
    note: 'BA1 overrides ALL other evidence including ClinVar. VCEP gene-specific BA1 thresholds may be lower.',
  },
  {
    code: 'BS1', name: 'Allele frequency greater than expected for disorder', strength: 'Strong', status: 'automated',
    conditions: ['AD proxy (haploinsufficiency score = 3): AF >= 0.1%', 'AR proxy (default): AF >= 5%'],
    databases: 'gnomAD v4.1, ClinGen (haploinsufficiency_score)',
    limitations: ['VCEP gene-specific BS1 thresholds override generic logic when enabled'],
  },
  {
    code: 'BS2', name: 'Observed in healthy adults for fully penetrant early-onset disorder', strength: 'Strong', status: 'automated',
    conditions: ['gnomAD homozygote count > 15'],
    databases: 'gnomAD v4.1',
  },
  {
    code: 'BS3', name: 'Functional studies show no deleterious effect', strength: 'Strong', status: 'manual',
    reason: 'Requires curation of published functional assay data.',
  },
  {
    code: 'BS4', name: 'Lack of segregation in affected family members', strength: 'Strong', status: 'manual',
    reason: 'Requires family segregation data.',
  },
  {
    code: 'BP1', name: 'Missense in a gene where primarily truncating variants cause disease', strength: 'Supporting', status: 'automated',
    conditions: ['Missense variant', 'MODERATE impact', 'pLI < 0.1 (LoF-tolerant gene)'],
    databases: 'VEP, gnomAD Constraint (pLI)',
  },
  {
    code: 'BP2', name: 'Observed in trans with pathogenic for fully penetrant dominant', strength: 'Supporting', status: 'automated',
    conditions: ['Compound heterozygote candidate', 'ClinGen haploinsufficiency score = 30 (dosage sensitivity unlikely)'],
    databases: 'ClinGen',
  },
  {
    code: 'BP3', name: 'In-frame indel in repetitive region without known function', strength: 'Supporting', status: 'automated',
    conditions: ['In-frame indel', 'Repetitive/low-complexity region OR not in any Pfam domain'],
    databases: 'VEP (consequence, domains)',
  },
  {
    code: 'BP4', name: 'Computational evidence suggests no impact', strength: 'Supporting / Moderate', status: 'automated',
    conditions: [
      'BayesDel_noAF with ClinGen SVI calibrated thresholds -- BP4_Moderate (<= -0.361, -2 pts), BP4_Supporting (-0.360 to -0.181, -1 pt)',
      'SpliceAI max_score must be < 0.1 (no predicted splice impact)',
    ],
    databases: 'dbNSFP 4.9c (BayesDel_noAF), SpliceAI',
  },
  {
    code: 'BP5', name: 'Variant found in case with alternate molecular basis', strength: 'Supporting', status: 'manual',
    reason: 'Requires case-level information about alternative diagnoses.',
  },
  {
    code: 'BP6', name: 'Reputable source reports variant as benign', strength: 'Supporting', status: 'automated',
    conditions: ['ClinVar: Benign or Likely Benign', 'Review stars >= 1'],
    databases: 'ClinVar',
    note: 'ClinGen SVI recommended retiring BP6; retained for maximum sensitivity.',
  },
  {
    code: 'BP7', name: 'Synonymous variant with no predicted splice impact', strength: 'Supporting', status: 'automated',
    conditions: ['Synonymous variant', 'Not in splice region', 'SpliceAI max_score <= 0.1'],
    databases: 'VEP, SpliceAI',
    note: 'Conservation filter intentionally omitted per Walker et al. 2023 Table S13.',
  },
]

const statusColors: Record<string, string> = {
  automated: 'bg-green-500/10 text-green-700',
  manual: 'bg-amber-500/10 text-amber-700',
  disabled: 'bg-red-500/10 text-red-700',
}

const strengthColors: Record<string, string> = {
  'Very Strong': 'bg-red-500/10 text-red-700',
  'Strong': 'bg-orange-500/10 text-orange-700',
  'Moderate': 'bg-yellow-500/10 text-yellow-700',
  'Supporting': 'bg-blue-500/10 text-blue-700',
  'Stand-alone': 'bg-green-500/10 text-green-700',
  'Supporting / Moderate / Strong': 'bg-purple-500/10 text-purple-700',
  'Supporting / Moderate': 'bg-purple-500/10 text-purple-700',
}

function CriterionCard({ c }: { c: Criterion }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-base font-semibold text-foreground">{c.code}</span>
          <span className={`px-2 py-0.5 text-tiny rounded ${strengthColors[c.strength] || 'bg-muted text-muted-foreground'}`}>{c.strength}</span>
          <span className={`px-2 py-0.5 text-tiny rounded capitalize ${statusColors[c.status]}`}>{c.status}</span>
        </div>
      </div>
      <p className="text-md text-muted-foreground">{c.name}</p>

      {c.conditions && (
        <div className="space-y-1">
          <p className="text-tiny font-medium text-foreground">Conditions</p>
          {c.conditions.map((cond, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-primary/60 rounded-full shrink-0 mt-1.5" />
              <p className="text-tiny text-muted-foreground">{cond}</p>
            </div>
          ))}
        </div>
      )}

      {c.exclusions && c.exclusions.length > 0 && (
        <div className="space-y-1">
          <p className="text-tiny font-medium text-foreground">Exclusions</p>
          {c.exclusions.map((exc, i) => (
            <p key={i} className="text-tiny text-muted-foreground">{exc}</p>
          ))}
        </div>
      )}

      {c.reason && (
        <p className="text-tiny text-muted-foreground italic">{c.reason}</p>
      )}

      {(c.databases || c.limitations || c.note) && (
        <div className="pt-2 border-t border-border space-y-1">
          {c.databases && <p className="text-tiny text-muted-foreground"><span className="font-medium text-foreground">Databases: </span>{c.databases}</p>}
          {c.limitations && c.limitations.map((lim, i) => <p key={i} className="text-tiny text-muted-foreground">{lim}</p>)}
          {c.note && <p className="text-tiny text-primary/80">{c.note}</p>}
        </div>
      )}
    </div>
  )
}

export default function CriteriaReferencePage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/classification" className="hover:text-primary transition-colors">Classification</Link>
          {' / '}
          <span className="text-foreground">Criteria Reference</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Criteria Reference</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          Complete reference for all 28 ACMG evidence criteria. 19 are evaluated automatically, 9 require manual curation, and 1 (PM5) is currently disabled.
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Pathogenic Evidence (16 criteria)</p>
        <div className="space-y-3">
          {pathogenicCriteria.map((c) => <CriterionCard key={c.code} c={c} />)}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Benign Evidence (12 criteria)</p>
        <div className="space-y-3">
          {benignCriteria.map((c) => <CriterionCard key={c.code} c={c} />)}
        </div>
      </section>
    </div>
  )
}
