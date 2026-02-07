import { Header, Footer } from '@/components'
import { Microscope, GraduationCap, Server, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Partners | Helena Bioinformatics',
  description: 'Scientific advisors, clinical validation program, and infrastructure supporting Helix Insight.',
}

export default function PartnersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-16">

          <section className="text-center space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-primary">Partners</h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Helix Insight is built with and validated by clinical genetics professionals and academic institutions. Our partners ensure that the platform meets the rigorous standards of real-world clinical practice.
            </p>
          </section>

          {/* Clinical Validation Program */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 max-w-3xl mx-auto">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <Microscope className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-primary">Clinical Validation</h2>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 space-y-5 max-w-3xl mx-auto">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">Clinical Validation Program</h3>
                <p className="text-base text-primary font-medium">Active -- EU-based diagnostic laboratories</p>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Helix Insight is undergoing clinical validation with licensed genetics laboratories performing diagnostic whole-exome and whole-genome sequencing for patients with rare genetic diseases, neurological conditions, and hereditary cancer predisposition.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                The validation program includes real-world genomic datasets from 200+ cases, benchmarking platform outputs against established manual interpretation workflows. Clinical geneticists evaluate every stage of the analysis pipeline -- from VCF ingestion and variant annotation through ACMG classification and phenotype matching -- against cases with known clinical outcomes.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Laboratories interested in joining the validation program as early partners receive priority access and dedicated onboarding support.
              </p>
            </div>
          </section>

          {/* Scientific Advisory */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 max-w-3xl mx-auto">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-primary">Scientific Advisory</h2>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 space-y-5 max-w-3xl mx-auto">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">Acad. Prof. Draga Toncheva, MD, DSc</h3>
                <p className="text-base text-primary font-medium">Chief Scientific Advisor</p>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Corresponding Member of the Bulgarian Academy of Sciences. Over 40 years of experience in medical genetics and genomics. National Consultant in Medical Genetics at the Bulgarian Ministry of Health.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Prof. Toncheva provides scientific oversight for the Helix Insight platform, ensuring alignment with current clinical genetics standards, ACMG/AMP guidelines, and European best practices. Her role includes validation of classification algorithms, review of clinical reporting formats, and guidance on regulatory compliance for genetic testing.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                President of the Bulgarian Society of Human Genetics and Genomics. Member of the European Society of Human Genetics (ESHG) Scientific Program Committee. Author of 300+ scientific publications across medical genetics, cytogenetics, and genomic medicine.
              </p>
            </div>
          </section>

          {/* Infrastructure */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 max-w-3xl mx-auto">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <Server className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-primary">Infrastructure</h2>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 space-y-5 max-w-3xl mx-auto">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">Hetzner Online GmbH</h3>
                <p className="text-base text-primary font-medium">Infrastructure Provider -- Helsinki, Finland</p>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                All Helix Insight data processing runs on dedicated Hetzner servers in Helsinki, Finland, ensuring full EU data residency and GDPR compliance. Dedicated hardware (not multi-tenant cloud) provides complete isolation of genomic data processing.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Hetzner maintains ISO 27001 certification for information security management. The dedicated server architecture ensures that no other tenant shares physical or logical access to the infrastructure processing clinical genomic data.
              </p>
            </div>
          </section>

          {/* Partnership CTA */}
          <section className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-10 max-w-3xl mx-auto">
              <div className="text-center space-y-6">
                <h2 className="text-3xl font-bold text-primary">Become a Partner</h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
                  We are actively seeking clinical genetics laboratories for validation partnerships, academic institutions for research collaborations, and strategic investors who share our vision of accessible clinical genomics infrastructure.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg text-base font-medium hover:bg-primary/90 transition-colors shadow-md">
                    Contact Us
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a href="mailto:partnerships@helena.bio" className="px-8 py-3 bg-card border-2 border-border text-foreground rounded-lg text-base font-medium hover:bg-muted transition-colors">
                    partnerships@helena.bio
                  </a>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
