import Link from 'next/link'

export const metadata = {
  title: 'Scoring Components | Helix Insight Documentation',
  description: 'Seven dimensions of variant scoring in Helix Insight screening: constraint, deleteriousness, phenotype, dosage, consequence, compound het, and age relevance.',
}

export default function ScoringComponentsPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/screening" className="hover:text-primary transition-colors">Screening</Link>
          {' / '}
          <span className="text-foreground">Scoring Components</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Scoring Components</h1>
      </div>

      <section className="space-y-3">
        <p className="text-base text-muted-foreground leading-relaxed">
          Each variant is evaluated across seven independent dimensions. Every component produces a score between 0.0 (no signal) and 1.0 (strongest possible signal). The components are then combined using a weighted sum, where the weights depend on the screening mode and patient age group. See <Link href="/docs/screening/screening-modes" className="text-primary hover:underline">Screening Modes</Link> for weight profiles.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Component Overview</p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Component</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">What It Measures</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Key Data Sources</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Constraint', measures: 'Gene intolerance to variation', sources: 'pLI, LOEUF, missense Z-score' },
                { name: 'Deleteriousness', measures: 'In-silico pathogenicity prediction', sources: 'DANN, SIFT, AlphaMissense, MetaSVM, PhyloP, GERP' },
                { name: 'Phenotype', measures: 'Phenotype match or gene-disease burden', sources: 'HPO overlap (diagnostic) or HPO count (screening)' },
                { name: 'Dosage', measures: 'Gene dosage sensitivity', sources: 'ClinGen haploinsufficiency score' },
                { name: 'Consequence', measures: 'Variant consequence severity', sources: 'VEP consequence terms' },
                { name: 'Compound Het', measures: 'Compound heterozygote potential', sources: 'Same-gene heterozygous variant pairs' },
                { name: 'Age Relevance', measures: 'Age-appropriate gene prioritization', sources: 'Curated gene lists per age group' },
              ].map((row, i) => (
                <tr key={row.name} className={i < 6 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.name}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.measures}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.sources}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Constraint */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">1. Constraint Score</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Measures how tolerant a gene is to variation using gnomAD constraint metrics. The scoring strategy adapts to the variant's consequence type, because the biological significance of constraint differs between loss-of-function and missense variants.
        </p>
        <p className="text-md font-medium text-foreground mt-2">Loss-of-Function Variants</p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Condition</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Score</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cond: 'pLI > 0.9 AND LOEUF < 0.35', score: '1.0' },
                { cond: 'pLI > 0.7 AND LOEUF < 0.5', score: '0.8' },
                { cond: 'pLI > 0.5', score: '0.6' },
                { cond: 'Otherwise', score: 'pLI value directly' },
              ].map((row, i) => (
                <tr key={i} className={i < 3 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.cond}</td>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-md font-medium text-foreground mt-2">Missense Variants</p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Condition</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Score</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cond: 'mis_z > 3.0 AND pLI > 0.9', score: '0.9' },
                { cond: 'mis_z > 2.0', score: '0.7' },
                { cond: 'pLI > 0.7', score: '0.6' },
                { cond: 'Otherwise', score: 'max(pLI, mis_z / 5.0)' },
              ].map((row, i) => (
                <tr key={i} className={i < 3 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.cond}</td>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deleteriousness */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">2. Deleteriousness Score</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Weighted aggregate of six in-silico pathogenicity predictors. Unlike ACMG classification which uses BayesDel as the single calibrated tool, the screening deleteriousness score combines multiple predictors for a broader assessment of variant impact. This is a ranking signal, not an ACMG evidence criterion.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Predictor</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Weight</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Scoring</th>
              </tr>
            </thead>
            <tbody>
              {[
                { pred: 'DANN', weight: '40%', scoring: 'Raw score (0.0-1.0)' },
                { pred: 'SIFT', weight: '15%', scoring: '1.0 if Deleterious, 0.0 if Tolerated' },
                { pred: 'AlphaMissense', weight: '15%', scoring: '1.0 if Pathogenic, 0.5 if Ambiguous, 0.0 if Benign' },
                { pred: 'MetaSVM', weight: '15%', scoring: '1.0 if Damaging, 0.0 if Tolerated' },
                { pred: 'PhyloP', weight: '7.5%', scoring: 'Normalized: score / 10.0, capped at 1.0' },
                { pred: 'GERP', weight: '7.5%', scoring: 'Normalized: score / 6.0, capped at 1.0' },
              ].map((row, i) => (
                <tr key={row.pred} className={i < 5 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.pred}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.weight}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.scoring}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Phenotype */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">3. Phenotype Score</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          How the phenotype score is calculated depends on whether the patient has HPO terms.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Mode</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Calculation</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">Diagnostic (has HPO terms)</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Overlap between patient HPO terms and gene HPO associations, divided by total patient terms.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md font-medium text-foreground">Screening (no HPO terms)</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Gene-disease burden: HPO count / 10, capped at 1.0. Genes associated with more phenotypes rank higher.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Dosage */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">4. Dosage Score</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Based on ClinGen haploinsufficiency curation, applied only to loss-of-function variants. A gene with sufficient evidence for haploinsufficiency means that losing one copy causes disease.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">HI Score</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Evidence Level</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Dosage Score</th>
              </tr>
            </thead>
            <tbody>
              {[
                { hi: '3', level: 'Sufficient evidence', score: '1.0' },
                { hi: '2', level: 'Emerging evidence', score: '0.7' },
                { hi: '1', level: 'Little evidence', score: '0.4' },
                { hi: 'Missing or non-LoF', level: 'Not applicable', score: '0.0' },
              ].map((row, i) => (
                <tr key={i} className={i < 3 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.hi}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.level}</td>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Consequence */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">5. Consequence Score</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Severity hierarchy based on the variant's predicted effect on the protein. More disruptive consequences receive higher scores.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Consequence</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Score</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cons: 'stop_gained, frameshift, splice_donor, splice_acceptor', score: '1.0' },
                { cons: 'start_lost, stop_lost', score: '0.9' },
                { cons: 'inframe insertion/deletion', score: '0.8' },
                { cons: 'missense', score: '0.7' },
                { cons: 'splice_region', score: '0.6' },
                { cons: 'UTR (5\' or 3\')', score: '0.4' },
                { cons: 'synonymous', score: '0.2' },
                { cons: 'intronic', score: '0.1' },
              ].map((row, i) => (
                <tr key={i} className={i < 7 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.cons}</td>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Compound Het */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">6. Compound Heterozygote Score</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Detects potential compound heterozygotes for autosomal recessive conditions. When two different heterozygous variants occur in the same gene, the patient may have both copies of the gene affected -- one variant on each chromosome.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Condition</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Score</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cond: 'Flagged as compound het candidate by classification', score: '1.0' },
                { cond: 'Heterozygous with another het variant in same gene', score: '0.8' },
                { cond: 'Not heterozygous or no partner variant', score: '0.0' },
              ].map((row, i) => (
                <tr key={i} className={i < 2 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.cond}</td>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Age Relevance */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">7. Age Relevance Score</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Uses curated gene lists to prioritize age-appropriate disease genes. A BRCA1 variant scores high for an adult but low for a neonate. A CFTR variant scores high for a neonate but moderate for an adult. See <Link href="/docs/screening/age-aware-prioritization" className="text-primary hover:underline">Age-Aware Prioritization</Link> for the complete gene lists and scoring tables per age group.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Missing Data Handling</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          All component calculations handle missing data gracefully. When a predictor score is unavailable (NULL), that predictor is excluded from the weighted calculation rather than treated as zero. When gene constraint data is missing, the constraint score defaults to the gene's pLI value or 0.0. This ensures that variants with incomplete annotation are not unfairly penalized or promoted.
        </p>
      </section>
    </div>
  )
}
