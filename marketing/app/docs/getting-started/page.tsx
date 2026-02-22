import Link from 'next/link'

export const metadata = {
  title: 'Getting Started | Helix Insight Documentation',
  description: 'Get started with Helix Insight -- upload a VCF file, set patient phenotype, and understand your variant analysis results.',
}

const pipelineSteps = [
  { stage: 1, name: 'VCF Parsing', description: 'Your file is read and loaded into the analysis engine.' },
  { stage: 2, name: 'Quality Filtering', description: 'Low-quality variants are flagged. ClinVar pathogenic variants are never discarded.' },
  { stage: 3, name: 'Annotation', description: 'Variant consequences predicted by Ensembl VEP (coding impact, protein effect, splice region).' },
  { stage: 4, name: 'Reference Database Enrichment', description: 'Population frequencies, clinical significance, functional predictions, gene constraint, phenotype associations, and dosage sensitivity loaded from 7 databases.' },
  { stage: 5, name: 'ACMG Classification', description: '19 automated criteria evaluated, Bayesian point-based classification applied, confidence scores assigned.' },
  { stage: 6, name: 'Export', description: 'Results ready for clinical review. Gene-level summaries available immediately.' },
]

const subpages = [
  { href: '/docs/getting-started/uploading-vcf', title: 'Uploading a VCF File', description: 'Supported formats, genome build requirements, and what happens after upload.' },
  { href: '/docs/getting-started/setting-hpo-terms', title: 'Setting HPO Terms', description: 'How to provide patient phenotype information and why it matters for prioritization.' },
  { href: '/docs/getting-started/understanding-results', title: 'Understanding Results', description: 'How to read the results interface -- classifications, scores, and annotations explained.' },
  { href: '/docs/getting-started/quality-presets', title: 'Quality Presets', description: 'Three quality filtering levels and the ClinVar rescue mechanism.' },
]

export default function GettingStartedPage() {
  return (
    <div className="py-10 space-y-8">
      {/* Header */}
      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <span className="text-foreground">Getting Started</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary">Getting Started</h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          Helix Insight receives a VCF file, processes it through a six-stage pipeline, and produces fully classified variants with ACMG evidence, phenotype correlation, literature evidence, and a prioritized shortlist for clinical review.
        </p>
      </section>

      {/* Pipeline */}
      <section className="space-y-4">
        <p className="text-lg font-semibold text-foreground">The Six-Stage Pipeline</p>
        <div className="space-y-3">
          {pipelineSteps.map((step) => (
            <div key={step.stage} className="bg-card border border-border rounded-lg p-5 flex items-start gap-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary-foreground">{step.stage}</span>
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-foreground">{step.name}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Processing times */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-3">
        <p className="text-lg font-semibold text-foreground">Processing Time</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Gene panels complete in under 2 minutes, whole exome sequencing (WES) in 5-10 minutes, and whole genome sequencing (WGS) in 7-15 minutes on dedicated hardware.
        </p>
      </section>

      {/* What it does NOT do */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-3">
        <p className="text-lg font-semibold text-foreground">What the Platform Does Not Do</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix Insight does not diagnose. It does not replace the geneticist. It automates the evidence-gathering step of variant interpretation. The geneticist reviews the evidence, applies clinical judgment, considers family history and clinical context, and makes the final clinical decision.
        </p>
      </section>

      {/* Maximum sensitivity */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-3">
        <p className="text-lg font-semibold text-foreground">Maximum Sensitivity Approach</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          No frequency-based or impact-based pre-filtering is applied at any stage. A common variant with a gnomAD allele frequency of 40% still receives a classification -- it will be classified as Benign via BA1, but it is not silently discarded before classification. Nothing is hidden from the reviewing geneticist. The clinician decides clinical relevance based on the complete classification and annotation data.
        </p>
      </section>

      {/* Subpages */}
      <section className="space-y-4">
        <p className="text-lg font-semibold text-foreground">In This Section</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subpages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="bg-card border border-border rounded-lg p-4 space-y-1 hover:border-primary/30 transition-colors group"
            >
              <p className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                {page.title}
              </p>
              <p className="text-sm text-muted-foreground">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
