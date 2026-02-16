import { Header, Footer } from '@/components'
import Link from 'next/link'
import { RequestDemoButton } from '@/components/marketing/RequestDemoButton'
import {
  ShieldCheck, Layers, ClipboardCheck, Activity,
  BookOpen, Target, Brain, Search, RefreshCw,
  UserCheck, ChevronRight, ArrowRight
} from 'lucide-react'

export const metadata = {
  title: 'How It Works | Helix Insight',
  description: 'Transparent, auditable variant analysis pipeline. Learn how Helix Insight processes genomic data from VCF upload to clinical report.',
}

const pipelineOverview = [
  'Quality Control',
  'Annotation',
  'Classification',
  'Phenotype',
  'Literature',
  'Screening',
  'Interpretation',
]

const pipelineSteps = [
  {
    number: 1,
    icon: ShieldCheck,
    title: 'VCF Processing & Quality Control',
    paragraphs: [
      'Standard VCF parsing accepts files from any sequencing platform -- whole genome, whole exome, or targeted panels. Quality metrics are assessed per variant, applying configurable filters for read depth, genotype quality, and allelic balance.',
      'Variants with documented clinical significance in ClinVar are preserved regardless of quality score. This maximum sensitivity approach ensures that no clinically relevant variant is discarded due to quality metrics alone -- a deliberate design decision for clinical safety.',
    ],
    tags: ['VCF standard format', 'Quality filtering', 'ClinVar protection', 'Maximum sensitivity'],
    output: 'Quality-filtered variant set with clinically significant variants preserved',
  },
  {
    number: 2,
    icon: Layers,
    title: 'Variant Annotation',
    paragraphs: [
      'Each variant is annotated through Ensembl VEP (Variant Effect Predictor) for consequence prediction, protein impact, and functional domain mapping. Parallel processing enables efficient annotation of millions of variants per genome.',
      'Multi-source database enrichment adds population frequencies from gnomAD (global and population-specific allele frequencies), clinical significance from ClinVar, functional impact predictions from 12+ computational tools including SIFT, PolyPhen-2, CADD, REVEL, AlphaMissense, DANN, MetaSVM, GERP++, PhyloP, and PhastCons, gene constraint metrics (pLI, LOEUF, o/e loss-of-function), and gene-disease associations from ClinGen.',
    ],
    tags: ['Ensembl VEP', 'gnomAD', 'ClinVar', 'dbNSFP', 'ClinGen', '12+ predictors', '60+ annotations per variant'],
    output: 'Fully annotated variants with population, functional, conservation, and clinical data',
  },
  {
    number: 3,
    icon: ClipboardCheck,
    title: 'ACMG/AMP Classification',
    paragraphs: [
      'Variant classification follows the 2015 ACMG/AMP guidelines (Richards et al., Genetics in Medicine) -- the international standard for clinical variant interpretation. All 28 evidence criteria are systematically evaluated: PVS1, PS1\u20134, PM1\u20136, PP1\u20135, BA1, BS1\u20134, and BP1\u20137.',
      'Classification is strictly rule-based. No AI model determines variant pathogenicity. Each variant receives one of five standard classifications -- Pathogenic, Likely Pathogenic, Variant of Uncertain Significance (VUS), Likely Benign, or Benign -- with an explicit listing of every criterion applied.',
    ],
    tags: ['ACMG/AMP 2015 guidelines', 'Rule-based', '28 evidence criteria', '5-tier classification', 'Explicit criteria listing'],
    output: 'Classified variants with complete ACMG criteria audit trail',
  },
  {
    number: 4,
    icon: Activity,
    title: 'Phenotype-Genotype Correlation',
    paragraphs: [
      'Patient phenotype, described using Human Phenotype Ontology (HPO) terms, is systematically compared against the known phenotypic profiles of genes carrying candidate variants. The HPO ontology hierarchy enables semantic similarity analysis that accounts for term specificity and information content, not just exact matches.',
      'Each gene receives a normalized relevance score (0\u2013100) with tiered clinical classification. A Pathogenic BRCA1 variant is not flagged as clinically relevant when the patient was referred for epilepsy. Phenotype matching connects technical classification to clinical relevance for the specific patient.',
    ],
    tags: ['HPO ontology', 'Semantic similarity', 'Information content', 'Normalized scoring', 'Tiered relevance'],
    output: 'Ranked gene list prioritized by phenotype match strength for this patient',
  },
  {
    number: 5,
    icon: BookOpen,
    title: 'Literature Evidence',
    paragraphs: [
      'A locally maintained, genetics-filtered database of biomedical literature provides sub-second clinical queries across millions of PubMed publications. Publications are pre-processed with extracted gene mentions, variant mentions, and phenotype associations -- enabling instant, targeted evidence retrieval for any variant or gene in the analysis.',
      'Multi-component relevance scoring ranks publications by clinical utility for the specific case. Every literature citation includes its PubMed identifier (PMID), DOI, and extracted evidence context -- fully traceable back to the original publication.',
    ],
    tags: ['Local PubMed database', 'Pre-extracted entities', 'Relevance scoring', 'PMID/DOI tracking', 'Sub-second queries'],
    output: 'Ranked literature evidence with traceable citations per gene and variant',
  },
  {
    number: 6,
    icon: Target,
    title: 'Clinical Screening & Prioritization',
    paragraphs: [
      'After classification, annotation, phenotype matching, and literature review, a multi-dimensional prioritization algorithm ranks variants by overall clinical relevance. Scoring adapts to the clinical context -- patient age, sex, family history, and indication for genetic testing.',
      'The system supports multiple screening strategies including neonatal intensive care, pediatric genetics, adult diagnostic workup, proactive screening, and carrier testing. The output is a tiered shortlist: Tier 1 (actionable findings requiring immediate clinical attention), Tier 2 (potentially actionable, warranting further review), with incidental findings identified and flagged separately.',
    ],
    tags: ['Context-aware scoring', 'Age/sex adaptation', 'Neonatal', 'Pediatric', 'Adult diagnostic', 'Carrier screening', 'Tiered output'],
    output: 'Focused shortlist of clinically actionable variants from hundreds of candidates',
  },
  {
    number: 7,
    icon: Brain,
    title: 'AI-Powered Clinical Interpretation',
    paragraphs: [
      'An AI model synthesizes all upstream evidence -- ACMG classifications, phenotype correlations, literature findings, and screening results -- into a structured clinical narrative. The AI does not classify variants. Classification is rule-based in Step 3. The AI integrates, summarizes, and presents evidence in a format ready for clinical review.',
      'Interpretation depth adapts dynamically based on available data: from basic variant summary (classification only) to comprehensive diagnostic synthesis (classification, phenotype, literature, and screening combined). Reports are generated in PDF and DOCX formats with structured sections and complete evidence attribution. All AI inference runs on dedicated EU infrastructure -- no data is sent to external AI services.',
    ],
    tags: ['Evidence synthesis', 'Adaptive depth', 'PDF/DOCX reports', 'On-premise AI', 'EU data residency'],
    output: 'Downloadable clinical interpretation report with structured evidence and recommendations',
  },
]

const principles = [
  {
    icon: ClipboardCheck,
    title: 'Rule-Based Classification',
    description: 'Variant pathogenicity is determined by ACMG/AMP criteria applied through systematic rules -- not by AI prediction. The AI assists with evidence gathering and presentation, never with classification decisions.',
  },
  {
    icon: Search,
    title: 'Complete Evidence Trail',
    description: 'Every classification links to the specific ACMG criteria applied, every literature reference to its PMID, every phenotype score to its HPO terms. Nothing is a black box.',
  },
  {
    icon: RefreshCw,
    title: 'Reproducible Results',
    description: 'The same VCF input with the same clinical profile produces the same classification output. Rule-based processing ensures deterministic, auditable results across runs.',
  },
  {
    icon: UserCheck,
    title: 'Geneticist Authority',
    description: 'Helix Insight is a clinical decision support tool. It gathers evidence, applies guidelines, and presents findings. The geneticist reviews, validates, and makes the clinical decision.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="pt-28 pb-16 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              How Helix Insight Works
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Helix Insight follows a simple principle: variant classification must be rule-based and auditable. AI assists in evidence synthesis but never makes classification decisions. Every result is traceable to its source data, published criteria, and referenced literature.
            </p>

            {/* Pipeline overview pills */}
            <div className="flex flex-wrap justify-center gap-x-1 gap-y-3 pt-4">
              {pipelineOverview.map((label, i) => (
                <div key={label} className="flex items-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary-foreground">{i + 1}</span>
                    </div>
                    <span className="text-base text-foreground font-medium">{label}</span>
                  </div>
                  {i < pipelineOverview.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 mx-0.5 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>

            {/* Processing stats */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <div className="bg-card border border-border rounded-lg px-6 py-4 text-center">
                <p className="text-lg font-semibold text-foreground">Under 15 minutes</p>
                <p className="text-md text-muted-foreground">Full genome processing</p>
              </div>
              <div className="bg-card border border-border rounded-lg px-6 py-4 text-center">
                <p className="text-lg font-semibold text-foreground">30 -- 60 minutes</p>
                <p className="text-md text-muted-foreground">Complete case interpretation</p>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Pipeline Steps */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-bold text-primary">
                The Analysis Pipeline
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Seven stages transform a raw VCF file into a clinician-ready interpretation report. Each stage produces traceable, auditable output.
              </p>
            </div>

            <div className="space-y-6">
              {pipelineSteps.map((step) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.number}
                    className="bg-card border border-border rounded-lg p-8"
                  >
                    <div className="flex items-start gap-6">
                      {/* Icon with step number */}
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-7 h-7 text-primary" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">{step.number}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          {step.title}
                        </h3>

                        {step.paragraphs.map((paragraph, i) => (
                          <p key={i} className="text-base text-muted-foreground leading-relaxed">
                            {paragraph}
                          </p>
                        ))}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {step.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-primary/5 text-primary text-md rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Output */}
                        <div className="pt-3 border-t border-border">
                          <p className="text-md text-muted-foreground">
                            <span className="font-medium text-foreground">Output: </span>
                            {step.output}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Key Principles */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-bold text-primary">
                Built for Clinical Trust
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Every design decision in Helix Insight prioritizes transparency, auditability, and geneticist authority over black-box convenience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {principles.map((principle) => {
                const Icon = principle.icon
                return (
                  <div
                    key={principle.title}
                    className="bg-card border border-border rounded-lg p-8 space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {principle.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {principle.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-primary">
              See the Pipeline in Action
            </h2>
            <p className="text-base text-muted-foreground">
              Request a demo to see how Helix Insight processes a real genome -- from VCF upload to clinical report.
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

      </main>
      <Footer />
    </div>
  )
}
