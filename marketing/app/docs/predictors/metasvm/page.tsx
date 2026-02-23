import Link from 'next/link'

export const metadata = {
  title: 'MetaSVM | Helix Insight Documentation',
  description: 'MetaSVM predictor in Helix Insight -- ensemble meta-predictor combining multiple pathogenicity tools. Displayed for clinical reference.',
}

export default function MetaSVMPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/predictors" className="hover:text-primary transition-colors">Computational Predictors</Link>
          {' / '}
          <span className="text-foreground">MetaSVM</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">MetaSVM</h1>
        <p className="text-md text-muted-foreground mt-2">Displayed for clinical reference. Does not contribute to ACMG classification.</p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What MetaSVM Is</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          MetaSVM is a meta-predictor that combines scores from 10 individual pathogenicity prediction tools using a Support Vector Machine (SVM) classifier. Rather than relying on any single tool's assessment, it aggregates signals from multiple methods -- each capturing different aspects of variant impact -- into a single consensus score. This ensemble approach generally produces more reliable predictions than any individual component tool.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Score Interpretation</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          MetaSVM produces a continuous score. Positive values indicate a predicted damaging effect, negative values indicate a predicted tolerated effect. The further from zero, the higher the confidence.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Score</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Prediction</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Label in Results</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">Positive</td>
                <td className="px-4 py-2 text-md text-muted-foreground">The variant is predicted to be damaging</td>
                <td className="px-4 py-2 text-md text-muted-foreground">D (Deleterious)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md font-medium text-foreground">Negative</td>
                <td className="px-4 py-2 text-md text-muted-foreground">The variant is predicted to be tolerated</td>
                <td className="px-4 py-2 text-md text-muted-foreground">T (Tolerated)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Strengths and Limitations</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          As an ensemble method, MetaSVM reduces the bias of individual predictors and generally achieves higher accuracy than any single component tool. It captures multiple dimensions of variant impact simultaneously -- conservation, protein structure, physicochemical properties, and more.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The main limitation is that because MetaSVM combines the same underlying tools used by other predictors, its errors are correlated with them. It is also limited to missense variants and cannot assess splice, nonsense, or non-coding variants.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Role in Helix Insight</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          MetaSVM predictions are displayed in the variant detail view as additional clinical context. They do not contribute to PP3 or BP4 ACMG criteria. The formal classification uses BayesDel_noAF with ClinGen SVI calibrated thresholds. See <Link href="/docs/predictors/consensus-calculation" className="text-primary hover:underline">Consensus Calculation</Link> for details.
        </p>
      </section>

      <p className="text-md text-muted-foreground">
        Reference: Dong C, et al. Hum Mol Genet. 2015;24(8):2125-2137. <a href="https://pubmed.ncbi.nlm.nih.gov/25552646/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 25552646</a>
      </p>
    </div>
  )
}
