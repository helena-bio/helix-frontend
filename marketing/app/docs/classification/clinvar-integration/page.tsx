import Link from 'next/link'

export const metadata = {
  title: 'ClinVar Integration | Helix Insight Documentation',
  description: 'How ClinVar clinical significance assertions are used in Helix Insight variant classification.',
}

export default function ClinvarIntegrationPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/classification" className="hover:text-primary transition-colors">Classification</Link>
          {' / '}
          <span className="text-foreground">ClinVar Integration</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">ClinVar Integration</h1>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Three Uses of ClinVar Data</p>
        <div className="space-y-2">
          {[
            { use: 'As evidence criteria', desc: 'PS1 (strong, 2+ stars), PP5 (supporting, 1 star), BP6 (supporting, 1+ star). ClinVar assertions contribute to the Bayesian point total alongside all other criteria.' },
            { use: 'As classification override', desc: 'When no conflicting computational evidence exists, ClinVar assertions with sufficient review stars can determine the final classification directly.' },
            { use: 'As quality filter rescue', desc: 'ClinVar Pathogenic/Likely Pathogenic variants are never discarded by quality filtering, regardless of sequencing quality metrics.' },
          ].map((item) => (
            <div key={item.use} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.use}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">ClinVar Override Conditions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Override IS applied when:</p>
            <p className="text-xs text-muted-foreground">ClinVar asserts P/LP/B/LB with at least 1 review star</p>
            <p className="text-xs text-muted-foreground">No conflicting computational evidence exists</p>
            <p className="text-xs text-muted-foreground">BA1 does not apply</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Override is NOT applied when:</p>
            <p className="text-xs text-muted-foreground">BA1 applies (frequency &gt; 5% always overrides ClinVar)</p>
            <p className="text-xs text-muted-foreground">Conflicting pathogenic + benign evidence exists</p>
            <p className="text-xs text-muted-foreground">ClinVar asserts VUS</p>
            <p className="text-xs text-muted-foreground">Review stars below minimum threshold</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Review Stars Explained</p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-sm font-semibold text-foreground">Stars</th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-foreground">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {[
                { stars: '0', meaning: 'Single submitter, no assertion criteria provided' },
                { stars: '1', meaning: 'Single submitter with assertion criteria, or multiple submitters with conflicting interpretations' },
                { stars: '2', meaning: 'Multiple submitters, no conflict, assertion criteria provided' },
                { stars: '3', meaning: 'Reviewed by expert panel' },
                { stars: '4', meaning: 'Practice guideline' },
              ].map((row, i) => (
                <tr key={row.stars} className={i < 4 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-sm font-mono text-foreground">{row.stars}</td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Evidence Transparency</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          When ClinVar classification is used, the criteria string includes "ClinVar" as the first element (e.g., "ClinVar,PM2,PP3") to make the evidence source explicit. The review star level is displayed alongside every variant for the reviewing geneticist to assess assertion quality independently.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Important Caveat</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ClinVar assertions vary in quality and may lag behind current evidence. Review star levels indicate the level of review, not the correctness of the assertion. The geneticist should assess ClinVar assertion quality independently, particularly for 0-star and 1-star submissions. The current ClinVar version in production is 2025-01.
        </p>
      </section>
    </div>
  )
}
