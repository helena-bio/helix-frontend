import Link from 'next/link'

export const metadata = {
  title: 'Computational Predictors | Helix Insight Documentation',
  description: 'How Helix Insight uses computational predictors for variant classification -- BayesDel for ACMG PP3/BP4, SpliceAI for splice impact, and displayed reference predictors.',
}

export default function PredictorsOverviewPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <span className="text-foreground">Computational Predictors</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Computational Predictors</h1>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Role in Classification</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          In ACMG variant classification, two criteria depend on computational predictions: PP3 (computational evidence supports a deleterious effect) and BP4 (computational evidence suggests no impact). These are evidence criteria -- they contribute to the overall classification but do not determine it on their own.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix Insight uses two computational tools that directly influence ACMG classification: BayesDel_noAF for missense variant pathogenicity assessment, and SpliceAI for splice impact prediction. Both were selected based on ClinGen Sequence Variant Interpretation (SVI) Working Group recommendations and are calibrated against clinical truth sets.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Classification Tools vs. Displayed Predictors</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Not all computational predictions shown in the results interface contribute to ACMG classification. The platform distinguishes between tools that drive classification decisions and predictors displayed for clinical reference.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Tool</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Role</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">ACMG Criteria</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">What It Measures</th>
              </tr>
            </thead>
            <tbody>
              {[
                { tool: 'BayesDel_noAF', role: 'Classification', criteria: 'PP3, BP4', measures: 'Missense pathogenicity (calibrated meta-predictor)' },
                { tool: 'SpliceAI', role: 'Classification', criteria: 'PP3_splice, BP4/BP7 guard', measures: 'Splice site creation or disruption' },
                { tool: 'SIFT', role: 'Displayed', criteria: '--', measures: 'Amino acid substitution tolerance' },
                { tool: 'AlphaMissense', role: 'Displayed', criteria: '--', measures: 'Protein structure-based pathogenicity' },
                { tool: 'MetaSVM', role: 'Displayed', criteria: '--', measures: 'Ensemble of multiple prediction methods' },
                { tool: 'DANN', role: 'Displayed', criteria: '--', measures: 'Deep neural network pathogenicity' },
                { tool: 'PhyloP', role: 'Displayed', criteria: '--', measures: 'Evolutionary conservation (100 vertebrates)' },
                { tool: 'GERP', role: 'Displayed', criteria: '--', measures: 'Evolutionary constraint at genomic position' },
              ].map((row, i) => (
                <tr key={row.tool} className={i < 7 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.tool}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${row.role === 'Classification' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {row.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.criteria}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.measures}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Why BayesDel_noAF</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The ClinGen SVI Working Group evaluated multiple computational tools against clinical truth sets and published calibrated evidence strength thresholds for BayesDel_noAF (Pejaver et al. 2022). This tool was selected for three reasons: it has ClinGen-calibrated thresholds that map directly to ACMG evidence strength levels (Supporting, Moderate, Strong); it explicitly excludes allele frequency from its model, avoiding circular reasoning with the frequency-based criteria PM2, BA1, and BS1; and it is precomputed in the dbNSFP database, requiring no external API calls during processing.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Unlike approaches that rely on a single damaging/benign threshold, BayesDel_noAF with ClinGen SVI calibration provides evidence strength modulation -- the same tool can contribute Supporting, Moderate, or Strong evidence depending on the score magnitude. This reflects the clinical reality that a variant with a very high pathogenicity score provides stronger evidence than one just above the threshold.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Why Displayed Predictors Are Shown</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          SIFT, AlphaMissense, MetaSVM, DANN, PhyloP, and GERP do not contribute to ACMG criteria, but they are shown in the results interface because experienced geneticists use them as additional clinical context. A geneticist reviewing a VUS may find it informative that AlphaMissense predicts the variant as pathogenic based on protein structure, even though this does not change the formal ACMG classification. These predictions help clinicians form their independent assessment alongside the automated classification.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Important</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Computational predictions are supporting evidence. They contribute PP3 or BP4 criteria to the ACMG framework, but they do not determine classification on their own. A variant is never classified as Pathogenic based solely on computational evidence, and a variant is never classified as Benign based solely on the absence of computational predictions.
        </p>
      </section>

      <p className="text-md text-muted-foreground">
        Reference: Pejaver V, et al. Am J Hum Genet. 2022;109(12):2163-2177. <a href="https://pubmed.ncbi.nlm.nih.gov/36413997/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 36413997</a>
      </p>
    </div>
  )
}
