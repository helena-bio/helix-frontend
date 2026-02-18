import { Header, Footer } from '@/components'

import Link from 'next/link'
import Image from 'next/image'
import { ProtectedImage } from '@/components/ProtectedImage'

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
            <h1 className="text-3xl font-semibold text-primary">About Helix Insight</h1>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              Clinical genetics laboratories spend days manually interpreting genetic variants -- cross-referencing databases, reviewing literature, and applying classification guidelines. We are building the infrastructure to reduce that to minutes, without compromising clinical accuracy.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              Helix Insight brings enterprise-grade engineering to clinical genomics. Built on dedicated EU infrastructure, following ACMG/AMP standards, and designed from the ground up for the rigorous demands of clinical genetics workflows.
            </p>
          </section>

          {/* Team */}
          <section className="space-y-10">
            <h2 className="text-3xl font-semibold text-primary text-center">Leadership</h2>

            <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">

              {/* Vladimir Mitev */}
              <div className="bg-card border border-border rounded-lg p-8">
                <div className="flex gap-8 items-start">
                  <ProtectedImage
                    src="/images/team/vladimir-mitev.png"
                    width={200}
                    height={300}
                    className="w-44 shrink-0"
                  />
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Vladimir Mitev</h3>
                      <p className="text-base text-primary font-medium">Founder &amp; CEO</p>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Founded Helena Bioinformatics to solve a problem that costs lives through delay: geneticists spending days on variant interpretation that technology should handle in minutes. Every hour a laboratory spends on manual classification is an hour a patient waits for answers.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Helix Insight is built on that urgency -- engineering infrastructure where clinical accuracy and speed are not trade-offs, but requirements. The mission is straightforward: give every genetics laboratory, regardless of size, access to interpretation tools that were previously only available to the largest institutions.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Company */}
          <section className="space-y-6">
            <h2 className="text-3xl font-semibold text-primary text-center">Helena Bioinformatics</h2>
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
