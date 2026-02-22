import Link from 'next/link'

export const metadata = {
  title: 'Confidence Scores | Helix Insight Documentation',
  description: 'How Helix Insight calculates continuous confidence scores for variant classifications based on Bayesian point distance.',
}

export default function ConfidenceScoresPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/classification" className="hover:text-primary transition-colors">Classification</Link>
          {' / '}
          <span className="text-foreground">Confidence Scores</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Confidence Scores</h1>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What the Confidence Score Means</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Each variant receives a continuous confidence score alongside its ACMG classification. The score reflects how far the variant's Bayesian point total is from the nearest classification boundary -- higher values indicate that the classification is well-supported by the available evidence.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Score Ranges</p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Classification</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Point Range</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Confidence</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cls: 'Pathogenic', points: '>= 10', conf: '0.80-0.99', interp: 'Higher points = higher confidence' },
                { cls: 'Likely Pathogenic', points: '6-9', conf: '0.70-0.90', interp: 'Closer to 10 = higher confidence' },
                { cls: 'VUS', points: '0-5', conf: '0.30-0.60', interp: 'Near boundaries = may reclassify with additional evidence' },
                { cls: 'Likely Benign', points: '-1 to -5', conf: '0.70-0.90', interp: 'Closer to -6 = higher confidence' },
                { cls: 'Benign', points: '<= -6', conf: '0.80-0.99', interp: 'Lower points = higher confidence' },
              ].map((row, i) => (
                <tr key={row.cls} className={i < 4 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.cls}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.points}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.conf}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.interp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">How to Interpret</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The confidence score is derived from the distance between the variant's point total and the nearest classification boundary. A Pathogenic variant with 15 points has higher confidence than one with exactly 10 points, because the 15-point variant would need more contradictory evidence to be reclassified.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          VUS variants near the Likely Pathogenic boundary (5 points) are particularly important to note -- a single additional Supporting pathogenic criterion would reclassify them. These are high-priority candidates for additional evidence gathering (functional studies, family segregation, updated ClinVar review).
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Important Note</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          The confidence score reflects classification evidence strength, not the probability of disease causation. A high-confidence Pathogenic classification means the evidence strongly supports pathogenicity under the ACMG framework, but clinical significance still depends on the patient's phenotype, inheritance pattern, and clinical context.
        </p>
      </section>
    </div>
  )
}
