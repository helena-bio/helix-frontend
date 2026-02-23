import Link from 'next/link'

export const metadata = {
  title: 'Conservation Scores | Helix Insight Documentation',
  description: 'PhyloP and GERP conservation metrics in Helix Insight -- evolutionary constraint scores displayed for clinical reference.',
}

export default function ConservationScoresPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/predictors" className="hover:text-primary transition-colors">Computational Predictors</Link>
          {' / '}
          <span className="text-foreground">Conservation Scores</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Conservation Scores</h1>
        <p className="text-md text-muted-foreground mt-2">Displayed for clinical reference. Do not contribute to ACMG classification.</p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Why Conservation Matters</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Genomic positions that remain unchanged across millions of years of evolution are under evolutionary constraint -- meaning changes at those positions are more likely to be functionally important. If a specific nucleotide is the same in humans, mice, chickens, and fish, it suggests that changes at that position are harmful enough to be removed by natural selection. Conservation scores quantify this constraint.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Two conservation metrics are displayed in Helix Insight: PhyloP (measuring conservation) and GERP (measuring constraint). They use different statistical approaches but address the same question: is this genomic position under evolutionary pressure to remain unchanged?
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">PhyloP (100-Way Vertebrate)</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          PhyloP measures evolutionary conservation across 100 vertebrate species using phylogenetic models. It compares the observed substitution rate at each position against the neutral expectation derived from the phylogenetic tree.
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
                <td className="px-4 py-2 text-md font-medium text-foreground">{'> 2.0'}</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Conserved. Fewer substitutions than expected -- position is under purifying selection.</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">0.0 -- 2.0</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Weakly conserved or neutral. Limited evolutionary signal.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md font-medium text-foreground">{'<= 0.0'}</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Fast-evolving. More substitutions than expected -- position may be under positive or relaxed selection.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">GERP++ (Genomic Evolutionary Rate Profiling)</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          GERP++ measures evolutionary constraint by comparing observed substitutions against the expected number at each position across a multi-species alignment. The difference between expected and observed substitutions is the "rejected substitution" score -- higher values indicate that more mutations have been eliminated by natural selection.
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
                <td className="px-4 py-2 text-md font-medium text-foreground">{'> 4.0'}</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Strongly constrained. The position has rejected a large number of substitutions across evolution.</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">2.0 -- 4.0</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Moderately constrained. Some evidence of purifying selection.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md font-medium text-foreground">{'<= 0.0'}</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Unconstrained. No evidence of evolutionary pressure to maintain this position.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Why Conservation Scores Are Context, Not Evidence</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Conservation tells you that a position is important, but it does not tell you whether a specific change at that position is damaging. A highly conserved position could tolerate certain amino acid substitutions (for example, leucine to isoleucine at a hydrophobic core position) while being completely intolerant of others (for example, leucine to proline, which would break the helix). This is why conservation scores are displayed as additional context rather than used as direct ACMG evidence.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Role in Helix Insight</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          PhyloP and GERP scores are displayed in the variant detail view as additional clinical context. They do not contribute to PP3 or BP4 ACMG criteria. The formal classification uses BayesDel_noAF (which itself incorporates conservation signals internally) with ClinGen SVI calibrated thresholds. See <Link href="/docs/predictors/consensus-calculation" className="text-primary hover:underline">Consensus Calculation</Link> for details.
        </p>
      </section>

      <div className="space-y-1">
        <p className="text-md text-muted-foreground">
          PhyloP reference: Pollard KS, et al. Genome Res. 2010;20(1):110-121. <a href="https://pubmed.ncbi.nlm.nih.gov/19858363/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 19858363</a>
        </p>
        <p className="text-md text-muted-foreground">
          GERP reference: Davydov EV, et al. PLoS Comput Biol. 2010;6(12):e1001025. <a href="https://pubmed.ncbi.nlm.nih.gov/21152010/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 21152010</a>
        </p>
      </div>
    </div>
  )
}
