import Link from 'next/link'

export const metadata = {
  title: 'DANN | Helix Insight Documentation',
  description: 'DANN predictor in Helix Insight -- deep neural network pathogenicity score for any single nucleotide variant. Displayed for clinical reference.',
}

export default function DannPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/predictors" className="hover:text-primary transition-colors">Computational Predictors</Link>
          {' / '}
          <span className="text-foreground">DANN</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">DANN</h1>
        <p className="text-md text-muted-foreground mt-2">Displayed for clinical reference. Does not contribute to ACMG classification.</p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What DANN Is</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          DANN (Deleterious Annotation of genetic variants using Neural Networks) is a deep neural network trained to distinguish pathogenic from benign variants using a large set of genomic annotations. It uses the same training features as the CADD scoring system but applies a deep learning architecture instead of a linear model, which allows it to capture more complex relationships between features.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Score Interpretation</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          DANN scores range from 0 to 1, with higher scores indicating a greater likelihood of pathogenicity.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Score Range</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">{'>= 0.95'}</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Predicted damaging with high confidence</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">0.5 -- 0.95</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Ambiguous range -- insufficient confidence for a clear prediction</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md font-medium text-foreground">{'< 0.5'}</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Predicted benign</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Strengths and Limitations</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          DANN's primary strength is breadth: it can score any single nucleotide variant in the genome, not just missense variants in coding regions. This makes it useful as a reference for intronic, synonymous, and UTR variants where protein-specific tools like SIFT or AlphaMissense are not applicable.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The main limitation is its wide ambiguous range (0.5 to 0.95), which means many variants receive scores that are neither clearly damaging nor clearly benign. The binary threshold approach may also miss nuanced pathogenicity signals.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Role in Helix Insight</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          DANN scores are displayed in the variant detail view as additional clinical context. They do not contribute to PP3 or BP4 ACMG criteria. The formal classification uses BayesDel_noAF with ClinGen SVI calibrated thresholds. See <Link href="/docs/predictors/consensus-calculation" className="text-primary hover:underline">Consensus Calculation</Link> for details.
        </p>
      </section>

      <p className="text-md text-muted-foreground">
        Reference: Quang D, Chen Y, Xie X. Bioinformatics. 2015;31(5):761-763. <a href="https://pubmed.ncbi.nlm.nih.gov/25338716/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 25338716</a>
      </p>
    </div>
  )
}
