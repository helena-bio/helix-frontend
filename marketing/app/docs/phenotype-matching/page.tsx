import Link from 'next/link'

export const metadata = {
  title: 'Phenotype Matching | Helix Insight Documentation',
  description: 'How Helix Insight correlates patient clinical features with variant gene phenotypes using semantic similarity.',
}

const subpages = [
  { href: '/docs/phenotype-matching/hpo-overview', title: 'HPO Overview', description: 'The Human Phenotype Ontology -- standardized vocabulary for clinical features.' },
  { href: '/docs/phenotype-matching/semantic-similarity', title: 'Semantic Similarity', description: 'Lin similarity algorithm for comparing clinical phenotypes across the ontology graph.' },
  { href: '/docs/phenotype-matching/clinical-tiers', title: 'Clinical Tiers', description: 'Five-tier system combining phenotype relevance with variant pathogenicity.' },
  { href: '/docs/phenotype-matching/interpreting-scores', title: 'Interpreting Scores', description: 'How to read phenotype match scores and what affects their accuracy.' },
  { href: '/docs/phenotype-matching/hpo-term-selection-guide', title: 'HPO Term Selection Guide', description: 'Practical guidance for selecting terms that maximize matching accuracy.' },
]

export default function PhenotypeMatchingPage() {
  return (
    <div className="py-10 space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">Phenotype Matching</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          After variant classification, the geneticist faces a key question: which of these variants are relevant to this patient&apos;s clinical presentation? A Pathogenic BRCA1 variant is clinically irrelevant if the patient was referred for epilepsy. Phenotype matching automates this correlation.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The patient&apos;s HPO terms are compared against the known phenotypic associations of every gene carrying a candidate variant. Each gene receives a phenotype match score (0-100) and is assigned to a clinical tier. This transforms the subjective question &quot;does my patient&apos;s phenotype match disease Y?&quot; into a reproducible numerical score.
        </p>
      </section>

      <section className="space-y-4">
        <p className="text-lg font-semibold text-foreground">How It Works</p>
        <div className="space-y-3">
          {[
            { step: 1, label: 'Select HPO Terms', desc: 'The geneticist describes the patient\u2019s clinical presentation using HPO terms -- a standardized vocabulary of phenotypic abnormalities. 5-15 terms is optimal for most cases.' },
            { step: 2, label: 'Compute Similarity', desc: 'For each gene carrying a candidate variant, the algorithm compares the patient\u2019s HPO terms against the gene\u2019s known phenotype associations using semantic similarity. Related concepts are recognized even without exact matches.' },
            { step: 3, label: 'Score and Rank', desc: 'Each gene receives a phenotype match score (0-100) based on the average best-match similarity across all patient HPO terms.' },
            { step: 4, label: 'Assign Clinical Tiers', desc: 'Variants are classified into five clinical tiers combining phenotype match strength, ACMG pathogenicity, variant impact, and population frequency.' },
            { step: 5, label: 'Review Results', desc: 'Tier 1 (Actionable) and Tier 2 (Potentially Actionable) variants are presented first. Incidental findings are flagged separately.' },
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

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Semantic, Not Exact Matching</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Phenotype matching uses semantic similarity, not exact string matching. A patient with &quot;Infantile spasms&quot; will match genes associated with &quot;Epileptic encephalopathy&quot; even if the exact term is absent from the gene&apos;s HPO profile. The ontological relationship between these terms is captured through their common ancestors in the HPO hierarchy.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Performance</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">Gene Panels</span>
            <span className="text-md text-muted-foreground">Seconds</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">WES</span>
            <span className="text-md text-muted-foreground">5-15 seconds (~4,600 unique gene HPO sets)</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">WGS</span>
            <span className="text-md text-muted-foreground">15-30 seconds</span>
          </div>
        </div>
        <p className="text-md text-muted-foreground leading-relaxed">
          All variants from the same gene share identical HPO annotations. The system deduplicates at the gene level before computing similarity, reducing the number of calculations by approximately 130x for a typical WGS case.
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
