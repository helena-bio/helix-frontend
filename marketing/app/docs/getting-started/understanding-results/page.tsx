import Link from 'next/link'

export const metadata = {
  title: 'Understanding Results | Helix Insight Documentation',
  description: 'How to read and interpret Helix Insight variant analysis results -- ACMG classifications, annotations, scores, and clinical tiers.',
}

const variantFields = [
  { field: 'ACMG Classification', description: 'Pathogenic, Likely Pathogenic, VUS, Likely Benign, or Benign. Determined by the Bayesian point system.' },
  { field: 'ACMG Criteria', description: 'Which specific criteria were triggered (e.g., PVS1, PM2, PP3_Strong) and their evidence strength levels.' },
  { field: 'Confidence Score', description: 'A continuous score reflecting the strength of classification evidence. Higher values indicate greater confidence in the classification.' },
  { field: 'Consequence', description: 'The predicted effect on the transcript: frameshift, missense, synonymous, splice donor, stop gained, and others.' },
  { field: 'Impact', description: 'Severity classification from Ensembl VEP: HIGH, MODERATE, LOW, or MODIFIER.' },
  { field: 'HGVS Notation', description: 'Standardized variant description at genomic (g.), coding (c.), and protein (p.) levels.' },
  { field: 'Genotype', description: 'Heterozygous (0/1), homozygous alternate (1/1), or hemizygous. Indicates the number of copies of the variant allele.' },
  { field: 'Population Frequency', description: 'gnomAD global allele frequency and population-specific maximum frequency. Lower frequency generally indicates higher clinical relevance.' },
  { field: 'ClinVar Significance', description: 'What ClinVar reports for this variant, with the review star level indicating assertion quality.' },
  { field: 'Computational Predictors', description: 'BayesDel score (used in classification) plus display predictors: SIFT, AlphaMissense, MetaSVM, DANN, PhyloP, GERP.' },
  { field: 'SpliceAI Scores', description: 'Four delta scores predicting splice impact: acceptor gain, acceptor loss, donor gain, donor loss.' },
  { field: 'Gene Constraint', description: 'pLI, LOEUF, and observed/expected loss-of-function ratio. Indicates how tolerant the gene is to damaging variation.' },
  { field: 'HPO Associations', description: 'Which clinical phenotypes are associated with this gene in the HPO database.' },
  { field: 'Phenotype Match Score', description: 'How well this gene matches the patient presentation (0-100), if HPO terms were provided.' },
  { field: 'Screening Tier', description: 'Tier 1 through 4 priority classification based on multi-dimensional scoring.' },
  { field: 'Literature Evidence', description: 'Relevant publications from the local PubMed database, ranked by clinical relevance.' },
]

export default function UnderstandingResultsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      {/* Breadcrumb */}
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/getting-started" className="hover:text-primary transition-colors">Getting Started</Link>
          {' / '}
          <span className="text-foreground">Understanding Results</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Understanding Results</h1>
      </div>

      {/* Organization */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Results Organization</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Results are organized by gene, not by individual variant. Each gene card shows a summary of the most clinically relevant variant in that gene. Expanding the card reveals all individual variants with their complete annotation data. This gene-centric view helps the geneticist focus on the biological context rather than individual base changes.
        </p>
      </section>

      {/* Variant fields */}
      <section className="space-y-4">
        <p className="text-lg font-semibold text-foreground">Variant Annotations</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Each variant displays the following fields. Together, these provide the evidence a geneticist needs to assess clinical relevance.
        </p>
        <div className="space-y-3">
          {variantFields.map((item) => (
            <div key={item.field} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.field}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ACMG classifications */}
      <section className="space-y-4">
        <p className="text-lg font-semibold text-foreground">What Each ACMG Classification Means</p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-sm font-semibold text-foreground">Classification</th>
                  <th className="text-left px-5 py-3 text-sm font-semibold text-foreground">Clinical Meaning</th>
                  <th className="text-left px-5 py-3 text-sm font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cls: 'Pathogenic', meaning: 'Variant causes disease.', action: 'Report to clinician.' },
                  { cls: 'Likely Pathogenic', meaning: 'Strong evidence variant causes disease (>90% certainty per ACMG).', action: 'Report to clinician.' },
                  { cls: 'VUS', meaning: 'Insufficient evidence to classify.', action: 'May require additional evidence gathering.' },
                  { cls: 'Likely Benign', meaning: 'Strong evidence variant does not cause disease.', action: 'Generally not reported.' },
                  { cls: 'Benign', meaning: 'Variant does not cause disease.', action: 'Not reported.' },
                ].map((row, i) => (
                  <tr key={row.cls} className={i < 4 ? 'border-b border-border' : ''}>
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{row.cls}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{row.meaning}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Where to start */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-3">
        <p className="text-lg font-semibold text-foreground">Where to Start</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The Screening Tier 1 list provides the highest-priority variants based on classification strength, phenotype correlation, population rarity, and gene constraint. Start there. If Tier 1 does not explain the clinical presentation, proceed to Tier 2 and consider additional evidence gathering for VUS candidates with strong phenotype matches.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        For details on how screening tiers are assigned, see <Link href="/docs/screening/tier-system" className="text-primary hover:underline">Screening Tier System</Link>. For classification methodology, see the full <Link href="/methodology" className="text-primary hover:underline">Methodology</Link> page.
      </p>
    </div>
  )
}
