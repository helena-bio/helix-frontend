import Link from 'next/link'

export const metadata = {
  title: 'SIFT | Helix Insight Documentation',
  description: 'SIFT predictor in Helix Insight -- amino acid substitution tolerance prediction based on sequence homology. Displayed for clinical reference.',
}

export default function SiftPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/predictors" className="hover:text-primary transition-colors">Computational Predictors</Link>
          {' / '}
          <span className="text-foreground">SIFT</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">SIFT</h1>
        <p className="text-md text-muted-foreground mt-2">Displayed for clinical reference. Does not contribute to ACMG classification.</p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What SIFT Is</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          SIFT (Sorting Intolerant From Tolerant) predicts whether an amino acid substitution affects protein function based on sequence homology. It aligns the protein sequence against related sequences from other species and evaluates whether the substitution occurs at a position that is conserved or variable across evolution. If the position is highly conserved and the substitution introduces an amino acid with different properties, SIFT predicts a deleterious effect.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Score Interpretation</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          SIFT scores range from 0 to 1. Unlike most pathogenicity predictors, lower scores indicate greater predicted damage.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Score Range</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Prediction</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Label in Results</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">{'< 0.05'}</td>
                <td className="px-4 py-2 text-md text-muted-foreground">The amino acid change is predicted to affect protein function</td>
                <td className="px-4 py-2 text-md text-muted-foreground">D (Deleterious)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md font-medium text-foreground">{'>= 0.05'}</td>
                <td className="px-4 py-2 text-md text-muted-foreground">The amino acid change is predicted to be tolerated</td>
                <td className="px-4 py-2 text-md text-muted-foreground">T (Tolerated)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Strengths and Limitations</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          SIFT is one of the oldest and most widely cited computational predictors in genetics, with a straightforward biological rationale: positions conserved across evolution are likely functionally important. It is applicable to any missense variant in any protein with sufficient homologous sequences.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          However, SIFT is based on sequence conservation alone and does not consider protein three-dimensional structure, post-translational modifications, or protein-protein interactions. It may miss gain-of-function variants (where the new amino acid has an active harmful effect rather than a loss of the original function) and is less effective for positions with low sequence conservation across species.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Role in Helix Insight</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          SIFT predictions are displayed in the variant detail view as additional clinical context. They do not contribute to PP3 or BP4 ACMG criteria. The formal classification uses BayesDel_noAF with ClinGen SVI calibrated thresholds. See <Link href="/docs/predictors/consensus-calculation" className="text-primary hover:underline">Consensus Calculation</Link> for details.
        </p>
      </section>

      <p className="text-md text-muted-foreground">
        Reference: Ng PC, Henikoff S. Nucleic Acids Res. 2003;31(13):3812-3814. <a href="https://pubmed.ncbi.nlm.nih.gov/12824425/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 12824425</a>
      </p>
    </div>
  )
}
