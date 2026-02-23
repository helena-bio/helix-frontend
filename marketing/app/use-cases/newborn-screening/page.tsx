import { Header, Footer } from '@/components'
import Link from 'next/link'
import { RequestDemoButton } from '@/components/marketing/RequestDemoButton'
import {
  Baby, Clock, Dna, ShieldCheck,
  Layers, Activity, Target, AlertTriangle,
  ArrowRight, Zap, Database, FileText
} from 'lucide-react'

export const metadata = {
  title: 'Neonatal Genomic Screening Software | Helix Insight',
  description: 'Age-aware variant prioritization for neonatal and pediatric genomic screening. Curated neonatal gene lists, time-critical interpretation, and phenotype-agnostic whole-genome analysis.',
  keywords: [
    'neonatal screening variant tool',
    'newborn genomic screening software',
    'pediatric variant screening',
    'neonatal genomic interpretation',
    'NICU genomic analysis',
    'age-aware variant prioritization',
    'neonatal gene panel',
  ],
  alternates: { canonical: 'https://helixinsight.bio/use-cases/newborn-screening' },
}

const nicuChallenges = [
  {
    icon: Clock,
    title: 'Time-Critical Decisions',
    description: 'In neonatal intensive care, treatment decisions cannot wait for weeks of manual variant interpretation. A newborn with unexplained seizures or metabolic crisis needs actionable genomic information within hours, not days.',
  },
  {
    icon: AlertTriangle,
    title: 'Non-Specific Presentations',
    description: 'Newborns present with non-specific symptoms -- respiratory distress, hypotonia, seizures, metabolic acidosis. These presentations overlap across hundreds of genetic conditions, making phenotype-guided gene panel selection unreliable.',
  },
  {
    icon: Dna,
    title: 'Evolving Clinical Picture',
    description: 'A newborn\'s phenotype changes rapidly in the first days and weeks of life. Features that could narrow the differential diagnosis may not yet be apparent. Interpretation must work with incomplete and evolving clinical information.',
  },
  {
    icon: Layers,
    title: 'Genome-Wide Scope',
    description: 'Targeted gene panels risk missing diagnoses outside their scope. For critically ill neonates, whole genome or exome analysis is increasingly the first-line approach -- but it produces millions of variants that need systematic evaluation.',
  },
]

const screeningModes = [
  {
    mode: 'Neonatal',
    ageRange: '0 -- 28 days',
    description: 'Highest priority for conditions with neonatal onset and available treatment. Gene weighting emphasizes disorders where early intervention changes outcomes -- metabolic conditions (PKU, galactosemia, MCAD deficiency), cystic fibrosis, spinal muscular atrophy, congenital adrenal hyperplasia, and early-onset epilepsies.',
    genes: 'CFTR, SMN1, GAA, GBA, HEXA, PAH, GALT, ACADM, CYP21A2, and curated neonatal-onset gene lists',
  },
  {
    mode: 'Pediatric',
    ageRange: '29 days -- 18 years',
    description: 'Broader scope including childhood-onset conditions. Weight profiles shift toward developmental disorders, childhood-onset metabolic conditions, immunodeficiencies, and genetic epilepsies. Lower urgency than neonatal but still requires efficient evidence gathering for timely clinical decisions.',
    genes: 'Expanded panels including developmental delay, intellectual disability, epilepsy, and immunodeficiency gene lists',
  },
  {
    mode: 'Proactive',
    ageRange: 'Any age',
    description: 'Population-scale screening for actionable genetic conditions regardless of current clinical presentation. Focuses on conditions where early knowledge enables preventive action -- hereditary cancer syndromes, cardiac conditions (LQTS, HCM), pharmacogenomic variants, and carrier status.',
    genes: 'ACMG SF v3.2 secondary findings list, pharmacogenomic panels, carrier screening panels',
  },
]

const phenotypeAgnosticAdvantages = [
  {
    title: 'No Phenotype Required to Start',
    description: 'Helix Insight performs genome-wide pathogenicity-first prioritization. Every variant is classified and scored based on population frequency, functional predictions, gene constraint, and clinical databases -- independent of phenotypic input. When HPO terms are available, phenotype matching adds a correlation layer. When they are not yet available (common in NICU), the system still produces a clinically useful prioritized variant list.',
  },
  {
    title: 'Phenotype Matching as Evolving Layer',
    description: 'As the newborn\'s clinical picture develops, HPO terms can be updated and the case reprocessed. New phenotype information immediately re-ranks variants based on genotype-phenotype correlation, surfacing candidates that were classified but not initially prioritized. The underlying classification does not change -- only the clinical prioritization adapts.',
  },
  {
    title: 'Unexpected Diagnoses Surface',
    description: 'Phenotype-constrained analysis can only find what it looks for. Phenotype-agnostic interpretation identifies all pathogenic and likely pathogenic variants across the genome, including findings in genes not initially suspected. This is particularly important in neonates where the differential diagnosis is broad and multi-system involvement is common.',
  },
]

const pipelineFeatures = [
  {
    icon: Zap,
    title: 'Processing Speed',
    description: 'Gene panel VCF: 1-2 minutes. Whole exome: 5-10 minutes. Whole genome: under 60 minutes. Classification, annotation, and phenotype matching run in parallel across the full variant set.',
  },
  {
    icon: Database,
    title: 'Neonatal Gene Curation',
    description: 'Age-aware scoring profiles weight neonatal-onset conditions with available treatment higher than adult-onset conditions. Gene lists are curated from OMIM, GeneReviews, and newborn screening program publications.',
  },
  {
    icon: ShieldCheck,
    title: 'ACMG Classification',
    description: 'Every variant receives full ACMG/AMP classification with Bayesian point framework, not just a pass/fail screen. The geneticist sees the complete evidence basis for each finding, enabling informed clinical decisions under time pressure.',
  },
  {
    icon: FileText,
    title: 'Tiered Clinical Output',
    description: 'Results are presented in clinical tiers: Tier 1 (actionable findings requiring immediate attention), Tier 2 (potentially actionable, warranting further evaluation), and incidental findings flagged separately. The NICU team sees what matters first.',
  },
  {
    icon: Activity,
    title: 'Reprocessing Without Re-Upload',
    description: 'As clinical information evolves, cases can be reprocessed with updated HPO terms or different screening profiles without re-uploading the VCF. Updated reference databases are applied automatically, and previous results are preserved for comparison.',
  },
  {
    icon: Target,
    title: 'GDPR-Native EU Infrastructure',
    description: 'Neonatal genomic data is among the most sensitive categories of personal data. All processing occurs on dedicated infrastructure in Helsinki, Finland. No variant data leaves the EU. No external API calls are made during analysis.',
  },
]

export default function NewbornScreeningPage() {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">

        {/* Hero */}
        <section className="pt-12 pb-8 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight text-primary">
              Neonatal Genomic Screening
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Genomic newborn screening is moving from targeted biochemical assays to whole genome analysis. This shift demands interpretation tools that can process millions of variants under time pressure, with incomplete phenotype information, and deliver clinically actionable results to neonatal teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <div className="bg-card border border-border rounded-lg px-6 py-4 text-center">
                <p className="text-lg font-semibold text-foreground">Under 60 minutes</p>
                <p className="text-md text-muted-foreground">Full genome interpretation</p>
              </div>
              <div className="bg-card border border-border rounded-lg px-6 py-4 text-center">
                <p className="text-lg font-semibold text-foreground">No phenotype required</p>
                <p className="text-md text-muted-foreground">Pathogenicity-first analysis</p>
              </div>
            </div>
          </div>
        </section>

        {/* NICU Challenges */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">
                The Neonatal Interpretation Challenge
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Neonatal intensive care represents the most demanding clinical context for genomic interpretation -- where time, phenotype specificity, and diagnostic scope all work against traditional approaches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nicuChallenges.map((item) => {
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

        {/* Phenotype-Agnostic Approach */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">
                Phenotype-Agnostic Analysis
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Traditional variant interpretation starts with phenotype and works backward to genes. In neonatal care, where phenotype is incomplete and evolving, Helix Insight starts with pathogenicity and works forward to clinical relevance.
              </p>
            </div>

            <div className="space-y-4">
              {phenotypeAgnosticAdvantages.map((item) => (
                <div key={item.title} className="bg-card border border-border rounded-lg p-8 space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Screening Modes */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">
                Age-Aware Screening Profiles
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Variant prioritization adapts to the clinical context. A newborn in the NICU and a child in a developmental genetics clinic have different urgent gene lists and different clinical priorities.
              </p>
            </div>

            <div className="space-y-4">
              {screeningModes.map((item) => (
                <div key={item.mode} className="bg-card border border-border rounded-lg p-8 space-y-4">
                  <div className="flex items-baseline gap-4">
                    <h3 className="text-lg font-semibold text-foreground">{item.mode}</h3>
                    <span className="px-3 py-1 bg-primary/5 text-primary text-md rounded-full">{item.ageRange}</span>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
                  <div className="pt-3 border-t border-border">
                    <p className="text-md text-muted-foreground">
                      <span className="font-medium text-foreground">Key genes: </span>
                      {item.genes}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/docs/screening/age-aware-prioritization"
                className="inline-flex items-center gap-1 text-md text-primary hover:underline"
              >
                Full documentation on age-aware prioritization
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Platform Features for NBS */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">
                Platform Capabilities
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pipelineFeatures.map((item) => {
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

        {/* CTA */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-semibold text-primary">
              See Neonatal Screening in Action
            </h2>
            <p className="text-base text-muted-foreground">
              Request a demo to see how Helix Insight processes a neonatal case -- from whole genome VCF to age-aware clinical prioritization.
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
