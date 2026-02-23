import { Header, Footer } from '@/components'
import Link from 'next/link'
import { RequestDemoButton } from '@/components/marketing/RequestDemoButton'
import {
  Users, ShieldCheck, Database, Globe,
  ClipboardCheck, FileText, ArrowRight,
  Activity, Layers, Scale
} from 'lucide-react'

export const metadata = {
  title: 'Carrier Screening Variant Interpretation | Helix Insight',
  description: 'Automated ACMG classification for carrier screening panels. Population-specific frequency analysis, structured clinical reports, and transparent evidence chains for reproductive genetics.',
  keywords: [
    'carrier screening variant interpretation',
    'carrier screening classification tool',
    'carrier screening genomics',
    'reproductive genetics variant analysis',
    'population frequency carrier screening',
    'carrier screening ACMG classification',
  ],
  alternates: { canonical: 'https://helixinsight.bio/use-cases/carrier-screening' },
}

const carrierChallenges = [
  {
    icon: Database,
    title: 'Variant Volume at Scale',
    description: 'Expanded carrier screening panels test for hundreds of conditions simultaneously, producing dozens to hundreds of candidate variants per individual. Each requires systematic evidence evaluation against population databases, clinical repositories, and functional predictions.',
  },
  {
    icon: Globe,
    title: 'Population-Specific Frequencies',
    description: 'Carrier frequencies vary dramatically across populations. A variant common in Ashkenazi Jewish populations may be absent in East Asian populations. Interpretation must account for ancestry-specific allele frequencies, not just global averages.',
  },
  {
    icon: Scale,
    title: 'Classification Nuance',
    description: 'Carrier screening operates in a different clinical context than diagnostic testing. Variants classified as VUS in a diagnostic setting may still be reportable in a carrier context depending on the condition, population, and clinical guidelines adopted by the laboratory.',
  },
  {
    icon: Users,
    title: 'Reporting Complexity',
    description: 'Carrier screening results have reproductive implications that extend beyond the individual tested. Reports must be clear, structured, and appropriate for genetic counseling conversations -- not raw variant lists requiring specialist interpretation.',
  },
]

const platformCapabilities = [
  {
    title: 'Full ACMG Classification for Every Variant',
    description: 'Carrier screening variants receive the same comprehensive ACMG/AMP classification as diagnostic variants -- 19 automated criteria with Bayesian point framework, BayesDel ClinGen SVI-calibrated thresholds, and VCEP gene-specific specifications where available. No simplified or abbreviated classification.',
  },
  {
    title: 'Population-Aware Frequency Analysis',
    description: 'gnomAD v4.1 provides global and population-specific allele frequencies across multiple ancestry groups. Helix Insight displays both global frequency and population-maximum frequency (popmax) for every variant, enabling the geneticist to assess carrier frequency in the context of the patient\'s reported ancestry.',
  },
  {
    title: 'Founder Variant Recognition',
    description: 'Established founder variants -- including Ashkenazi Jewish founder mutations in HEXA (Tay-Sachs), BRCA1/2, CFTR, and others -- are annotated through ClinVar integration with clinical significance assertions and review star quality levels. Disease associations from OMIM and ClinGen provide additional clinical context.',
  },
  {
    title: 'Gene-Specific VCEP Thresholds',
    description: 'For approximately 50-60 genes with published ClinGen VCEP specifications, gene-specific frequency thresholds and criterion modifications are applied automatically. This includes clinically important carrier screening genes such as CFTR, PAH, and BRCA1/BRCA2 (ENIGMA specifications).',
  },
  {
    title: 'Structured Reporting',
    description: 'Clinical reports present findings in structured sections with ACMG classification, evidence summary, population frequency data, and literature references. Reports are generated in PDF and DOCX formats suitable for inclusion in patient records and genetic counseling documentation.',
  },
  {
    title: 'Transparent Evidence Chains',
    description: 'Every classification decision is traceable to specific ACMG criteria, database versions, and computational thresholds. The geneticist can verify exactly why a variant was classified and communicate the evidence basis to patients and referring providers.',
  },
]

const workflow = [
  { step: 1, title: 'Upload carrier screening VCF', description: 'Standard VCF from any sequencing platform -- targeted panel, exome, or genome.' },
  { step: 2, title: 'Automated annotation and classification', description: 'Population frequencies, clinical significance, functional predictions, and ACMG criteria applied to every variant.' },
  { step: 3, title: 'Clinical review of classified variants', description: 'Geneticist reviews Pathogenic and Likely Pathogenic findings with complete evidence.' },
  { step: 4, title: 'Generate carrier screening report', description: 'Structured report with classification, population data, and evidence attribution.' },
  { step: 5, title: 'Genetic counseling', description: 'Report supports informed reproductive counseling with transparent, traceable findings.' },
]

export default function CarrierScreeningPage() {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">

        {/* Hero */}
        <section className="pt-12 pb-8 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight text-primary">
              Carrier Screening Variant Interpretation
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Expanded carrier screening panels are growing in scope -- from dozens of conditions to hundreds. As panel sizes increase, so does the volume of variants requiring systematic evidence evaluation. Helix Insight provides full ACMG classification with population-aware frequency analysis for every variant, at any panel scale.
            </p>
          </div>
        </section>

        {/* Challenges */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">
                Carrier Screening at Scale
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                The move from single-condition carrier testing to expanded panels introduces interpretation challenges that manual workflows were not designed to handle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {carrierChallenges.map((item) => {
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

        {/* Workflow */}
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">
                Carrier Screening Workflow
              </h2>
            </div>

            <div className="space-y-3">
              {workflow.map((item) => (
                <div key={item.step} className="bg-card border border-border rounded-lg p-6 flex items-start gap-5">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary-foreground">{item.step}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-lg font-semibold text-foreground">{item.title}</p>
                    <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Capabilities */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">
                Platform Capabilities for Carrier Screening
              </h2>
            </div>

            <div className="space-y-4">
              {platformCapabilities.map((item) => (
                <div key={item.title} className="bg-card border border-border rounded-lg p-8 space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-semibold text-primary">
              See Carrier Screening Classification
            </h2>
            <p className="text-base text-muted-foreground">
              Request a demo to see how Helix Insight classifies carrier screening variants with full ACMG evidence and population-specific frequency data.
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
