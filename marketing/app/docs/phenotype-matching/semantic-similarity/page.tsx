import Link from 'next/link'

export const metadata = {
  title: 'Semantic Similarity | Helix Insight Documentation',
  description: 'Lin similarity algorithm for comparing patient HPO terms against gene phenotype profiles.',
}

export default function SemanticSimilarityPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/phenotype-matching" className="hover:text-primary transition-colors">Phenotype Matching</Link>
          {' / '}
          <span className="text-foreground">Semantic Similarity</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Semantic Similarity</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          The matching algorithm uses semantic similarity, not exact string matching. "Seizure" and "Epilepsy" are recognized as related concepts because they share common ancestors in the HPO ontology graph. The algorithm quantifies how closely related any two clinical terms are.
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Lin Similarity</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix Insight uses Lin similarity, a well-established measure from information theory that produces scores on a 0 to 1 scale:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <p className="text-base text-foreground text-center leading-relaxed">
            Lin(term1, term2) = 2 x IC(MICA) / (IC(term1) + IC(term2))
          </p>
          <div className="border-t border-border/50" />
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-foreground w-16 shrink-0">IC</span>
              <p className="text-md text-muted-foreground">Information Content -- how specific or rare a term is. "Focal clonic seizure" has higher IC than "Abnormality of the nervous system" because it is more specific.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-foreground w-16 shrink-0">MICA</span>
              <p className="text-md text-muted-foreground">Most Informative Common Ancestor -- the most specific term that is an ancestor of both terms in the ontology graph.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-foreground w-16 shrink-0">Range</span>
              <p className="text-md text-muted-foreground">0.0 (completely unrelated) to 1.0 (identical terms).</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Information Content</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Information Content (IC) measures how specific a term is based on its frequency in disease annotations. A term associated with many diseases (like "Abnormality of the nervous system") has low IC because it carries little diagnostic information. A term associated with few diseases (like "Agenesis of the corpus callosum") has high IC because observing it significantly narrows the differential diagnosis.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix Insight derives IC values from OMIM disease annotations, ensuring that information content reflects clinical significance rather than annotation frequency in other databases.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Set Similarity: Best-Match Average</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          A patient has multiple HPO terms and a gene may be associated with dozens of HPO terms. The algorithm compares these two sets using a best-match average approach:
        </p>
        <div className="space-y-3">
          {[
            { step: 1, desc: 'For each patient HPO term, compute Lin similarity against every gene HPO term.' },
            { step: 2, desc: 'Select the highest similarity score for each patient term (the best match in the gene\'s profile).' },
            { step: 3, desc: 'Average all best-match scores across the patient\'s HPO terms.' },
            { step: 4, desc: 'Normalize to a 0-100 scale for the final phenotype match score.' },
          ].map((item) => (
            <div key={item.step} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-md font-semibold text-primary">{item.step}</span>
              </div>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-md text-muted-foreground leading-relaxed">
          A match is considered significant when the similarity score for an individual term pair exceeds 0.5. The total number of significant matches is reported alongside the overall score.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Worked Example</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Patient HPO terms: Seizure (HP:0001250), Intellectual disability (HP:0001249), Microcephaly (HP:0000252). Gene SCN1A HPO profile includes: Febrile seizure (HP:0002373), Epileptic encephalopathy (HP:0200134), Global developmental delay (HP:0001263), and 12 other terms.
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-medium text-foreground">Patient Term</th>
                  <th className="text-left py-2 pr-3 font-medium text-foreground">Best Gene Match</th>
                  <th className="text-left py-2 font-medium text-foreground">Lin Score</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 text-md text-foreground">Seizure</td>
                  <td className="py-2 pr-3 text-md text-muted-foreground">Febrile seizure</td>
                  <td className="py-2 text-md text-muted-foreground">0.82</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 text-md text-foreground">Intellectual disability</td>
                  <td className="py-2 pr-3 text-md text-muted-foreground">Global developmental delay</td>
                  <td className="py-2 text-md text-muted-foreground">0.71</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 text-md text-foreground">Microcephaly</td>
                  <td className="py-2 pr-3 text-md text-muted-foreground">(no close match)</td>
                  <td className="py-2 text-md text-muted-foreground">0.15</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-md text-muted-foreground">Average: (0.82 + 0.71 + 0.15) / 3 = 0.56. Normalized score: 56/100. Significant matches: 2 of 3.</p>
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Why Lin Similarity?</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Lin similarity normalizes the Resnik score to a 0-1 range, making it directly comparable across term pairs regardless of their position in the ontology hierarchy. Alternative measures like Resnik similarity produce unbounded scores that are difficult to interpret clinically. The OMIM-based information content ensures that IC values reflect clinical significance rather than database annotation practices.
        </p>
      </section>

      <section className="space-y-2">
        <p className="text-lg font-semibold text-foreground">Reference</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Lin D. &quot;An information-theoretic definition of similarity.&quot; <span className="italic">Proceedings of the 15th International Conference on Machine Learning (ICML)</span>. 1998;296-304.
        </p>
      </section>
    </div>
  )
}
