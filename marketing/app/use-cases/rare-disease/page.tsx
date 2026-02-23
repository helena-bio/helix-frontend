import { Header, Footer } from '@/components'
import Link from 'next/link'
import { RequestDemoButton } from '@/components/marketing/RequestDemoButton'
import {
  Dna, Clock, Search, Layers, Brain,
  AlertTriangle, Target, BookOpen, Activity,
  ShieldCheck, FileText, GitBranch, ArrowRight
} from 'lucide-react'

export const metadata = {
  title: 'Rare Disease Variant Interpretation | Helix Insight',
  description: 'Phenotype-driven variant prioritization for rare disease diagnostics. HPO semantic similarity matching, automated VUS evidence gathering, and genotype-phenotype correlation in one platform.',
  keywords: [
    'rare disease variant interpretation',
    'VUS rare disease',
    'phenotype driven variant prioritization',
    'genotype phenotype correlation tool',
    'rare disease diagnostic odyssey',
    'HPO term variant matching',
    'rare disease genomics software',
  ],
  alternates: { canonical: 'https://helixinsight.bio/use-cases/rare-disease' },
}

const odysseyStats = [
  { value: '5-7 years', label: 'Average time to rare disease diagnosis' },
  { value: '3-5', label: 'Specialists consulted before diagnosis' },
  { value: '41%', label: 'Patients receiving at least one VUS' },
  { value: '7.3%', label: 'VUS that are ever reclassified' },
]

const challenges = [
  {
    icon: AlertTriangle,
    title: 'Variant Volume',
    description: 'Whole exome sequencing produces 20,000-30,000 variants per patient. Whole genome sequencing produces 4-5 million. Each pathogenic candidate requires cross-referencing multiple databases, literature sources, and phenotype associations.',
  },
  {
    icon: Clock,
    title: 'Manual Evidence Gathering',
    description: 'For each candidate variant, a geneticist must search ClinVar, gnomAD, PubMed, OMIM, and functional prediction tools individually. A single rare disease case with dozens of candidate variants can consume 5-10 days of expert time.',
  },
  {
    icon: Search,
    title: 'VUS Accumulation',
    description: 'Rare disease patients accumulate Variants of Uncertain Significance that cannot be resolved without systematic evidence aggregation. Each VUS represents a potential diagnosis that remains unconfirmed -- extending the diagnostic odyssey.',
  },
  {
    icon: GitBranch,
    title: 'Phenotype Complexity',
    description: 'Rare diseases often present with overlapping phenotypes, incomplete penetrance, and variable expressivity. Connecting a patient\'s specific clinical presentation to the correct gene-disease association requires structured phenotype matching, not keyword searches.',
  },
]

const helixApproach = [
  {
    step: 1,
    icon: Layers,
    title: 'Complete Variant Annotation',
    description: 'Every variant in the VCF is annotated against 8 reference databases simultaneously -- gnomAD population frequencies, ClinVar clinical significance, dbNSFP functional predictions, SpliceAI splice impact, gnomAD gene constraint, HPO phenotype associations, ClinGen dosage sensitivity, and Ensembl VEP consequence prediction. No manual database lookups required.',
  },
  {
    step: 2,
    icon: Target,
    title: 'Phenotype-First Prioritization',
    description: 'Patient HPO terms are matched against gene-disease phenotype profiles using semantic similarity analysis that accounts for ontology hierarchy and information content. A variant in a gene associated with the patient\'s specific phenotype is prioritized over an equally classified variant in an unrelated gene. This is not keyword matching -- it is structured ontological reasoning.',
  },
  {
    step: 3,
    icon: ShieldCheck,
    title: 'Bayesian ACMG Classification',
    description: 'All 19 automatable ACMG criteria are evaluated using the Tavtigian Bayesian point framework with BayesDel ClinGen SVI-calibrated thresholds. VCEP gene-specific specifications are applied for approximately 50-60 genes. The result is a calibrated classification with continuous confidence scores -- not binary rule-counting.',
  },
  {
    step: 4,
    icon: BookOpen,
    title: 'Automated Literature Evidence',
    description: 'For every candidate gene and variant, Helix Insight searches a local database of millions of genetics-relevant PubMed publications with pre-extracted gene mentions, variant mentions, and phenotype associations. Evidence is ranked by clinical relevance and returned with full PMID attribution.',
  },
  {
    step: 5,
    icon: Brain,
    title: 'Clinical Evidence Synthesis',
    description: 'An on-premise AI clinical assistant integrates classification results, phenotype correlations, and literature evidence into a structured clinical narrative. The geneticist receives a focused summary of actionable findings rather than raw data across dozens of browser tabs.',
  },
  {
    step: 6,
    icon: FileText,
    title: 'Structured Clinical Report',
    description: 'A tiered report presents Tier 1 (actionable) and Tier 2 (potentially actionable) variants with complete evidence chains. Each finding includes ACMG classification, phenotype match score, supporting literature, population frequency, and computational predictions -- ready for clinical review and sign-off.',
  },
]

const differentiators = [
  {
    title: 'Phenotype Matching That Understands Ontology',
    description: 'HPO semantic similarity uses information content and ontological hierarchy to identify gene-phenotype relationships that exact keyword matching would miss. "Seizures" and "Epilepsy" are recognized as related, not treated as different terms.',
    link: '/docs/phenotype-matching/semantic-similarity',
    linkText: 'How semantic similarity works',
  },
  {
    title: 'VUS Evidence Aggregation',
    description: 'Each VUS receives the same comprehensive evidence package as classified variants -- population frequencies, functional predictions, literature citations, and phenotype correlations. The evidence needed for reclassification is gathered automatically, not left for "when time permits."',
    link: '/docs/classification/confidence-scores',
    linkText: 'Understanding confidence scores',
  },
  {
    title: 'Whole Genome Processing',
    description: 'Gene panels and whole exome sequencing miss variants outside their target regions. Helix Insight processes full whole genome VCF files -- 4-5 million variants classified, annotated, and phenotype-matched in under an hour. No pre-filtering means no missed diagnoses.',
    link: '/how-it-works',
    linkText: 'See the full pipeline',
  },
  {
    title: 'Transparent Evidence Chains',
    description: 'Every classification decision is traceable to specific ACMG criteria, database versions, and computational thresholds. When a variant is classified as Likely Pathogenic, the report shows exactly which criteria contributed and with what evidence strength. No black boxes.',
    link: '/docs/classification/acmg-framework',
    linkText: 'ACMG classification methodology',
  },
]

export default function RareDiseasePage() {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">

        {/* Hero */}
        <section className="pt-12 pb-8 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight text-primary">
              Rare Disease Variant Interpretation
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Rare disease patients wait years for a diagnosis. A significant part of that wait is not clinical uncertainty -- it is the time required to systematically evaluate candidate variants against databases, literature, and phenotype associations. Helix Insight compresses that evidence-gathering from days to minutes.
            </p>
          </div>
        </section>

        {/* Diagnostic Odyssey Stats */}
        <section className="pb-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {odysseyStats.map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-lg p-6 text-center space-y-2">
                  <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                  <p className="text-md text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Challenge */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">
                The Interpretation Bottleneck
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Sequencing technology has outpaced interpretation capacity. The bottleneck in rare disease diagnostics is no longer generating genomic data -- it is making clinical sense of it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {challenges.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="bg-card border border-border rounded-lg p-8 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                        <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Helix Insight Approach */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">
                From VCF to Clinical Insight
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Helix Insight processes rare disease cases through a six-stage pipeline that mirrors the geneticist's workflow -- but executes it systematically across every variant in minutes.
              </p>
            </div>

            <div className="space-y-4">
              {helixApproach.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.step} className="bg-card border border-border rounded-lg p-8">
                    <div className="flex items-start gap-6">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-7 h-7 text-primary" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary-foreground">{item.step}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                        <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Why It Matters for Rare Disease */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">
                Built for Rare Disease Complexity
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Rare disease interpretation demands capabilities beyond standard variant classification. These are not add-on features -- they are core to how Helix Insight processes every case.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {differentiators.map((item) => (
                <div key={item.title} className="bg-card border border-border rounded-lg p-8 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
                  <Link
                    href={item.link}
                    className="inline-flex items-center gap-1 text-md text-primary hover:underline"
                  >
                    {item.linkText}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Clinical Context */}
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-8 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">
                The Geneticist Remains Central
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Rare disease diagnostics requires clinical judgment that cannot be automated -- interpreting incomplete phenotypes, recognizing atypical presentations, integrating family history, and communicating uncertain findings to patients. Helix Insight does not attempt to replicate this expertise.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                What it does is ensure that when the geneticist sits down to interpret a rare disease case, the evidence is already gathered, structured, and prioritized. The databases have been queried, the literature has been searched, the phenotype has been matched, and the ACMG criteria have been applied. The geneticist's time is spent on clinical reasoning, not data retrieval.
              </p>
              <div className="pt-4 border-t border-border">
                <p className="text-base text-foreground font-medium text-center">
                  The geneticist decides. Helix Insight does the research.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-semibold text-primary">
              See How It Handles Rare Disease Cases
            </h2>
            <p className="text-base text-muted-foreground">
              Request a demo to see Helix Insight process a rare disease genome -- from VCF upload through phenotype matching to clinical report.
            </p>
            <div className="flex items-center justify-center gap-4">
              <RequestDemoButton />
              <Link
                href="/contact"
                className="px-6 py-3 border border-border text-foreground rounded-md text-base font-medium hover:bg-muted transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>

      <Footer />
      </main>
    </div>
  )
}
