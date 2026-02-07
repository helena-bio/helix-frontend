import { Header, Footer } from '@/components'
import { Server, Shield, Lock, FileText } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'About | Helena Bioinformatics',
  description: 'About Helena Bioinformatics -- our mission, team, and approach to clinical genomics.',
}

const infraFeatures = [
  {
    icon: Server,
    title: 'Dedicated EU Servers',
    description: 'Hetzner AX162R in Helsinki, Finland. 48 cores, 504 GB RAM. Not multi-tenant cloud -- fully isolated infrastructure for genomic data processing.',
  },
  {
    icon: Lock,
    title: 'Encryption',
    description: 'AES-256 at rest, TLS 1.3 in transit. End-to-end encryption from VCF upload through analysis to report generation.',
  },
  {
    icon: Shield,
    title: 'GDPR Article 9',
    description: 'Genetic data classified as special category. Full compliance with DPA, DPIA, Records of Processing Activities, and breach notification procedures.',
  },
  {
    icon: FileText,
    title: 'Audit Trails',
    description: 'Every data access, processing operation, and classification decision is logged, timestamped, and auditable for regulatory compliance.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-16">

          <section className="text-center space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-primary">About Helena Bioinformatics</h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              A bioinformatics company based in Sofia, Bulgaria, building AI-powered infrastructure for clinical genetics laboratories.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-primary text-center">The Problem We Solve</h2>
            <div className="bg-card border border-border rounded-lg p-8 space-y-4 max-w-3xl mx-auto">
              <p className="text-base text-muted-foreground leading-relaxed">
                A single whole-exome sequencing case generates 20,000-30,000 variants. After quality filtering and frequency analysis, 20-50 Variants of Unknown Significance (VUS) remain -- each requiring manual review by a geneticist across ClinVar, gnomAD, PubMed, OMIM, HPO, and ACMG/AMP classification guidelines.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                This process takes 5-10 working days per case. A laboratory processing 10 cases per week dedicates hundreds of hours monthly to manual interpretation. Meanwhile, patients wait for diagnoses that depend on this analysis.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                The bottleneck is not expertise -- it is infrastructure. The systematic work of cross-referencing databases, extracting evidence from literature, and assembling classification criteria is precisely what technology should handle. The clinical judgment that follows is where human expertise is irreplaceable.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-primary text-center">Our Approach</h2>
            <div className="bg-card border border-border rounded-lg p-8 space-y-4 max-w-3xl mx-auto">
              <p className="text-base text-muted-foreground leading-relaxed">
                Helix Insight automates the systematic parts of variant interpretation: multi-source annotation (ClinVar, gnomAD, dbNSFP), ACMG/AMP criteria application, HPO-based phenotype-genotype correlation, and biomedical literature mining from PubMed and Europe PMC.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                The platform operates as a post-processing layer -- complementing existing sequencing pipelines and tools like Franklin by QIAGEN, not replacing them. Every analysis produces a complete evidence trail: database hits, classification rationale, literature citations, and phenotype match scores. The geneticist reviews, validates, and signs off.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                We target the 85% of laboratories not served by expensive enterprise solutions. Freemium pricing, pay-per-analysis scaling, and no vendor lock-in. Clinical-grade interpretation infrastructure should not be a privilege of the largest institutions.
              </p>
            </div>
          </section>

          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-primary">Infrastructure</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Genomic data demands infrastructure built to clinical-grade security standards. No compromises.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {infraFeatures.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="bg-card border border-border rounded-lg p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="space-y-10">
            <h2 className="text-3xl font-bold text-primary text-center">Leadership</h2>
            <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
              <div className="bg-card border border-border rounded-lg p-8 space-y-5">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-muted-foreground">VM</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Vladimir Mitev</h3>
                    <p className="text-base text-primary font-medium">Founder &amp; CEO</p>
                  </div>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Founded Helena Bioinformatics to address a bottleneck that costs lives through delay. Clinical genetics laboratories spend days on variant interpretation that technology should handle in minutes -- every hour of manual classification is an hour a patient waits for answers.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Helix Insight is built on that urgency. The mission: give every genetics laboratory, regardless of size, access to the interpretation infrastructure that was previously available only to the largest institutions.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-8 space-y-5">
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-muted-foreground">DT</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Acad. Prof. Draga Toncheva, MD, DSc</h3>
                    <p className="text-base text-primary font-medium">Chief Scientific Advisor</p>
                  </div>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Corresponding Member of the Bulgarian Academy of Sciences. Over 40 years of scientific and clinical experience in human genetics and genomics. Former Head of the Department of Medical Genetics at the Medical University of Sofia and Director of the National Genomic Center for Socially Significant Diseases.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Author of 300+ scientific publications and 14 monographs. National Consultant in Medical Genetics at the Bulgarian Ministry of Health. President of the Bulgarian Society of Human Genetics and Genomics. Member of the ESHG Scientific Program Committee and the ECA European Council.
                </p>
              </div>
            </div>
          </section>

          <section className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">
              Interested in learning more or exploring a partnership?
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/contact" className="px-6 py-3 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors">
                Contact Us
              </Link>
              <Link href="/partners" className="px-6 py-3 bg-card border-2 border-border text-foreground rounded-md text-base font-medium hover:bg-muted transition-colors">
                Our Partners
              </Link>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
