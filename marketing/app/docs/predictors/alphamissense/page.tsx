import Link from 'next/link'

export const metadata = {
  title: 'AlphaMissense | Helix Insight Documentation',
  description: 'AlphaMissense predictor in Helix Insight -- DeepMind protein structure-based pathogenicity prediction. Displayed for clinical reference.',
}

export default function AlphaMissensePage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/predictors" className="hover:text-primary transition-colors">Computational Predictors</Link>
          {' / '}
          <span className="text-foreground">AlphaMissense</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">AlphaMissense</h1>
        <p className="text-md text-muted-foreground mt-2">Displayed for clinical reference. Does not contribute to ACMG classification.</p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What AlphaMissense Is</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          AlphaMissense is a pathogenicity predictor developed by Google DeepMind, built on the AlphaFold protein structure prediction framework. It leverages deep knowledge of protein three-dimensional structure to predict whether a missense variant is likely to cause disease. By understanding how proteins fold and where specific amino acids sit within that fold, AlphaMissense can assess whether a substitution would disrupt the protein's structure or function.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The model was published in Science (Cheng et al., 2023) and has been shown to outperform most other missense predictors in independent benchmarks against ClinVar validation datasets.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Score Interpretation</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          AlphaMissense scores range from 0 to 1, with higher scores indicating a greater likelihood of pathogenicity. Variants are classified into three categories:
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Category</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Label in Results</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">Pathogenic</td>
                <td className="px-4 py-2 text-md text-muted-foreground">P</td>
                <td className="px-4 py-2 text-md text-muted-foreground">The variant is predicted to be disease-causing based on protein structural analysis</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">Ambiguous</td>
                <td className="px-4 py-2 text-md text-muted-foreground">A</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Insufficient confidence for a clear prediction in either direction</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md font-medium text-foreground">Benign</td>
                <td className="px-4 py-2 text-md text-muted-foreground">B</td>
                <td className="px-4 py-2 text-md text-muted-foreground">The variant is predicted to be tolerated by the protein structure</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Strengths and Limitations</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          AlphaMissense's primary strength is that it incorporates protein three-dimensional structural information. While sequence-based tools like SIFT can only assess conservation at a position, AlphaMissense understands whether the amino acid sits in the protein core, on the surface, at an interaction interface, or near a catalytic site. It was trained on human population data and primate conservation data, giving it a human-specific perspective on pathogenicity.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The main limitation is scope: AlphaMissense only predicts impact for missense variants. It does not assess in-frame indels, splice variants, nonsense variants, or any non-coding variants. Its "Ambiguous" category covers a meaningful fraction of all possible missense variants where the model lacks confidence.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Role in Helix Insight</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          AlphaMissense predictions are displayed in the variant detail view as additional clinical context. They do not contribute to PP3 or BP4 ACMG criteria. The formal classification uses BayesDel_noAF with ClinGen SVI calibrated thresholds. See <Link href="/docs/predictors/consensus-calculation" className="text-primary hover:underline">Consensus Calculation</Link> for details.
        </p>
      </section>

      <p className="text-md text-muted-foreground">
        Reference: Cheng J, et al. Science. 2023;381(6664):eadg7492. <a href="https://pubmed.ncbi.nlm.nih.gov/37733863/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 37733863</a>
      </p>
    </div>
  )
}
