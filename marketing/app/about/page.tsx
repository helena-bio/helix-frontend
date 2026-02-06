import { Header, Footer } from '@/components'
import { Linkedin } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'About | Helix Insight',
  description: 'Meet the team behind Helix Insight -- AI-powered genetic variant analysis.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-16">

          {/* Mission */}
          <section className="text-center space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-primary">About Helix Insight</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Clinical genetics laboratories spend days manually interpreting genetic variants -- cross-referencing databases, reviewing literature, and applying classification guidelines. We are building the infrastructure to reduce that to minutes, without compromising clinical accuracy.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Helix Insight brings enterprise-grade engineering to clinical genomics. Built on dedicated EU infrastructure, following ACMG/AMP standards, and designed from the ground up for the rigorous demands of clinical genetics workflows.
            </p>
          </section>

          {/* Team */}
          <section className="space-y-10">
            <h2 className="text-3xl font-bold text-primary text-center">Leadership</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Vladimir Mitev */}
              <div className="bg-card border border-border rounded-lg p-8 space-y-5">
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-muted-foreground">VM</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Vladimir Mitev</h3>
                    <p className="text-base text-primary font-medium">Founder &amp; CEO</p>
                    
                      <a href="https://www.linkedin.com/in/vmitev/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  </div>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed">
                  18 years in the technology industry, from C++ game engine development to leading regional support operations at Nokia across EMEA and North America. Background in building and managing enterprise-grade systems that process millions of transactions with zero tolerance for failure.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Founded Helena Bioinformatics to bring the same engineering discipline to clinical genomics -- where laboratories still rely on manual workflows and fragmented tools. Responsible for platform architecture, infrastructure, and product strategy.
                </p>
                <p className="text-sm text-muted-foreground">
                  B.Sc. Computer Systems and Technologies, Technical University of Sofia
                </p>
              </div>

              {/* Acad. Draga Toncheva */}
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
                  Academician of the Bulgarian Academy of Sciences and one of the foremost authorities in medical genetics in Southeast Europe. Over 40 years of scientific and clinical experience in human genetics and genomics.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Head of the Department of Medical Genetics at the Medical University of Sofia (2000-present) and Director of the National Genomic Center for Socially Significant Diseases. Author of 170+ peer-reviewed publications, 14 monographs, and supervisor of 40 doctoral candidates. National Consultant in Medical Genetics at the Bulgarian Ministry of Health.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  President of the Bulgarian Society of Human Genetics and Genomics. Member of the European Society of Human Genetics (ESHG) Scientific Program Committee and the European Cytogeneticists Association (ECA) European Council. Specialized at institutions including Oxford, London, Naples, and the Tokyo Human Genome Center.
                </p>
                <p className="text-sm text-muted-foreground">
                  Recipient of the Order of Saints Cyril and Methodius -- the highest state distinction for contributions to science and education in Bulgaria (2025).
                </p>
              </div>

            </div>
          </section>

          {/* Company */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-primary text-center">Helena Bioinformatics</h2>
            <div className="bg-card border border-border rounded-lg p-8 space-y-4 max-w-3xl mx-auto">
              <p className="text-base text-muted-foreground leading-relaxed">
                Helena Bioinformatics is a bioinformatics company based in Sofia, Bulgaria, focused on developing AI-powered tools for clinical genetics. The company was founded to address a critical bottleneck in genomic medicine: the manual, time-consuming process of variant interpretation that limits the capacity of genetics laboratories worldwide.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Our infrastructure is hosted on dedicated servers in Helsinki, Finland, ensuring full GDPR compliance and EU data residency. We follow Clean Architecture principles with comprehensive audit trails, encryption at rest and in transit, and role-based access control -- the same standards expected in enterprise telecommunications and financial systems.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Helix Insight integrates with established clinical databases including ClinVar, gnomAD, PubMed, HPO, OMIM, and dbNSFP, and follows ACMG/AMP classification guidelines. Every analysis produces a complete evidence trail that geneticists can review, validate, and use in clinical reports.
              </p>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">
              Interested in learning more or exploring a partnership?
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
