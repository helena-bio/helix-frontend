import Link from 'next/link'

export const metadata = {
  title: 'Classification | Helix Insight Documentation',
  description: 'ACMG/AMP variant classification methodology in Helix Insight -- framework, criteria, combining rules, ClinVar integration, and confidence scoring.',
}

const subpages = [
  { href: '/docs/classification/acmg-framework', title: 'ACMG Framework', description: 'The ACMG/AMP 2015 variant classification standard and how Helix Insight implements it.' },
  { href: '/docs/classification/criteria-reference', title: 'Criteria Reference', description: 'Complete reference for all 28 ACMG criteria -- 19 automated, 9 manual.' },
  { href: '/docs/classification/combining-rules', title: 'Combining Rules', description: 'How individual criteria are combined using the Bayesian point system to reach a classification.' },
  { href: '/docs/classification/clinvar-integration', title: 'ClinVar Integration', description: 'How ClinVar assertions are used as evidence and when they override computational classification.' },
  { href: '/docs/classification/conflicting-evidence', title: 'Conflicting Evidence', description: 'How the platform handles variants with both pathogenic and benign evidence.' },
  { href: '/docs/classification/confidence-scores', title: 'Confidence Scores', description: 'Continuous confidence scoring based on Bayesian point distance to classification boundaries.' },
]

export default function ClassificationPage() {
  return (
    <div className="py-10 space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">Classification</h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          Variant classification follows the ACMG/AMP 2015 guidelines implemented through the Bayesian point-based framework (Tavtigian et al. 2018, 2020) with ClinGen SVI calibrated computational predictor thresholds (Pejaver et al. 2022) and SpliceAI integration aligned to ClinGen SVI 2023 recommendations (Walker et al. 2023).
        </p>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          Classification is strictly evidence-based. No machine learning model determines variant pathogenicity. The framework evaluates 28 evidence criteria -- 19 automated, 9 requiring manual curation -- and combines them using calibrated point values to produce one of five standard classifications: Pathogenic, Likely Pathogenic, VUS, Likely Benign, or Benign.
        </p>
      </section>

      {/* Classification priority */}
      <section className="space-y-4">
        <p className="text-lg font-semibold text-foreground">Classification Priority Order</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Classification logic is applied in strict priority order. Higher-priority rules are evaluated first, and the first matching rule determines the final classification:
        </p>
        <div className="space-y-3">
          {[
            { priority: 1, label: 'BA1 Stand-alone', desc: 'Allele frequency > 5% is always classified Benign. BA1 cannot be overridden by any other evidence, including ClinVar assertions.' },
            { priority: 2, label: 'High-Confidence Conflict Check', desc: 'When pathogenic evidence at Strong or Very Strong level conflicts with Strong benign evidence, the variant is flagged for manual review regardless of point total.' },
            { priority: 3, label: 'ClinVar Override', desc: 'ClinVar classification applied only when no conflicting computational evidence exists. Requires minimum 1 review star. ClinVar VUS does not override computational classification.' },
            { priority: 4, label: 'Bayesian Point System', desc: 'Each criterion contributes calibrated points. Total determines classification: >= 10 Pathogenic, 6-9 Likely Pathogenic, 0-5 VUS, -1 to -5 Likely Benign, <= -6 Benign.' },
            { priority: 5, label: 'Default', desc: 'Variants not meeting any rule are classified as Variant of Uncertain Significance (VUS).' },
          ].map((item) => (
            <div key={item.priority} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-semibold text-primary">{item.priority}</span>
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Five-class output */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Classification Output</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Each variant receives one of five ACMG classifications, a list of triggered criteria with evidence strength levels, a Bayesian point total, and a continuous confidence score.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Pathogenic', points: '>= 10 pts' },
            { label: 'Likely Pathogenic', points: '6-9 pts' },
            { label: 'VUS', points: '0-5 pts' },
            { label: 'Likely Benign', points: '-1 to -5 pts' },
            { label: 'Benign', points: '<= -6 pts' },
          ].map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-lg p-3 text-center space-y-1">
              <p className="text-sm font-medium text-foreground">{c.label}</p>
              <p className="text-xs font-mono text-muted-foreground">{c.points}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Subpages */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">In This Section</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subpages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="bg-card border border-border rounded-lg p-4 space-y-1 hover:border-primary/30 transition-colors group"
            >
              <p className="text-base font-medium text-foreground group-hover:text-primary transition-colors">{page.title}</p>
              <p className="text-sm text-muted-foreground">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        For the full methodology with all thresholds and implementation details, see the dedicated <Link href="/methodology" className="text-primary hover:underline font-medium">Methodology</Link> page.
      </p>
    </div>
  )
}
