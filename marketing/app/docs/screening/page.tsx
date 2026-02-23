import Link from 'next/link'

export const metadata = {
  title: 'Screening | Helix Insight Documentation',
  description: 'How Helix Insight prioritizes variants after ACMG classification using multi-dimensional scoring, clinical context, and tiered ranking.',
}

const subpages = [
  { href: '/docs/screening/scoring-components', title: 'Scoring Components', description: 'Seven dimensions of variant scoring: constraint, deleteriousness, phenotype, dosage, consequence, compound het, and age relevance.' },
  { href: '/docs/screening/tier-system', title: 'Tier System', description: 'Four-tier priority ranking with clinical actionability labels and boost mechanisms.' },
  { href: '/docs/screening/screening-modes', title: 'Screening Modes', description: 'Diagnostic, neonatal, pediatric, proactive adult, carrier, and pharmacogenomics modes.' },
  { href: '/docs/screening/age-aware-prioritization', title: 'Age-Aware Prioritization', description: 'How patient age influences scoring weights and gene relevance from neonatal through elderly.' },
]

export default function ScreeningOverviewPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <span className="text-foreground">Screening</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Screening</h1>
      </div>

      <section className="space-y-3">
        <p className="text-base text-muted-foreground leading-relaxed">
          After ACMG classification assigns each variant a category (Pathogenic, Likely Pathogenic, VUS, Likely Benign, Benign), a clinician still faces dozens to hundreds of results per case. The Screening Service solves this by applying a multi-dimensional scoring algorithm that ranks variants by clinical relevance, producing a tiered shortlist for review.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Screening reduces the review set from 50-200+ variants to 3-20 high-priority candidates (Tier 1). It adapts to patient demographics (age, sex, ethnicity, family history), supports multiple screening strategies, and provides transparent score breakdowns so clinicians understand why each variant was prioritized.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">How Screening Works</p>
        <div className="space-y-3">
          {[
            { step: 1, label: 'Load Classified Variants', desc: 'All quality-passing variants with their ACMG classifications, annotations, and optional phenotype matching results are loaded for scoring.' },
            { step: 2, label: 'Calculate Component Scores', desc: 'Each variant is evaluated across seven dimensions: gene constraint, computational deleteriousness, phenotype relevance, dosage sensitivity, consequence severity, compound heterozygote potential, and age-appropriate gene prioritization.' },
            { step: 3, label: 'Apply Clinical Boosts', desc: 'Patient-specific context (ACMG class, phenotype match tier, ethnicity, family history, sex-linked inheritance, consanguinity, pregnancy status) adds additional priority boosts.' },
            { step: 4, label: 'Assign Tiers', desc: 'Variants are ranked by their total score and assigned to one of four priority tiers. Tier 1 variants require immediate review.' },
          ].map((item) => (
            <div key={item.step} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-md font-semibold text-primary">{item.step}</span>
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-foreground">{item.label}</p>
                <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Key Design Principles</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'Every score is transparent. Each of the seven component scores and all clinical boosts are visible in the results, so clinicians can see exactly why a variant was prioritized.',
            'Pathogenic and Likely Pathogenic variants always appear in Tier 1, regardless of their base component scores. ACMG classification takes priority.',
            'Scoring adapts to clinical context. A neonatal screening case uses different weights than an adult proactive screening case. Diagnostic mode with HPO terms emphasizes phenotype matching.',
            'All scores are normalized to 0.0-1.0. No raw scores or arbitrary scales -- every component is directly comparable.',
            'Processing completes in under one second for typical cases (100-500 variants). Results are available immediately after classification.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
              <p className="text-md text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Screening vs. Classification</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Classification determines what a variant IS (Pathogenic, VUS, Benign) based on ACMG evidence criteria. Screening determines which variants to REVIEW FIRST based on clinical relevance to this specific patient. A VUS in a highly constrained gene with strong phenotype match and family history may rank higher in screening than a Pathogenic variant in an unrelated gene.
        </p>
      </section>

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
              <p className="text-md text-muted-foreground">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
