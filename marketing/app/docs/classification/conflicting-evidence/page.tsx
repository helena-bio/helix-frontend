import Link from 'next/link'

export const metadata = {
  title: 'Conflicting Evidence | Helix Insight Documentation',
  description: 'How Helix Insight handles variants with both pathogenic and benign evidence in ACMG classification.',
}

export default function ConflictingEvidencePage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/classification" className="hover:text-primary transition-colors">Classification</Link>
          {' / '}
          <span className="text-foreground">Conflicting Evidence</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Conflicting Evidence</h1>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">The Problem</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          A variant may trigger both pathogenic criteria (e.g., PM2 + PP3) and benign criteria (e.g., BS1). What classification should it receive? This is one of the most clinically important edge cases in variant interpretation.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Two-Level Approach</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix Insight handles conflicting evidence at two levels, prioritizing clinical safety.
        </p>
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Level 1: High-Confidence Conflict Safety Check</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When pathogenic evidence at Strong or Very Strong level (PVS or PS criteria triggered) directly conflicts with Strong benign evidence (BS criteria triggered), the variant is flagged for manual review regardless of the point total. This prevents automated resolution of genuinely conflicting high-quality evidence.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Level 2: Bayesian Point Summation</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For all other conflicts, the Bayesian point system handles them naturally through summation. For example, PM2 (+2) and BS1 (-4) yield a net of -2 = Likely Benign. This is more nuanced than the previous approach (v3.3) which defaulted all conflicts to VUS.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Example</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          A variant with PM2 (+2) + PP3_Supporting (+1) + PP2 (+1) but also BS1 (-4). Net total: +2 +1 +1 -4 = 0 points = VUS. The point system produces a VUS classification because the strong benign evidence (elevated frequency) substantially counteracts the moderate pathogenic evidence. Under the original ACMG rules, this combination had no defined classification.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">BA1 Exception</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          BA1 is excluded from conflict checks because it operates at a higher priority level. An allele frequency above 5% results in Benign classification regardless of any other evidence, including ClinVar assertions and pathogenic criteria.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Clinical Safety Rationale</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          In clinical genetics, false positives (reporting a benign variant as pathogenic) can lead to unnecessary invasive procedures, patient anxiety, and cascade testing of family members. When high-quality evidence genuinely conflicts, flagging for manual review is the safest outcome -- it prompts the geneticist to gather additional evidence rather than acting on incomplete information.
        </p>
      </section>
    </div>
  )
}
