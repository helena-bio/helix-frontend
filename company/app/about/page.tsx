import { Header, Footer } from '@/components'
import Link from 'next/link'

export const metadata = {
  title: 'About | Helena Bioinformatics',
  description: 'About Helena Bioinformatics -- our mission, team, and approach to clinical genomics.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-16">

          <section className="text-center space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-primary">About Helena Bioinformatics</h1>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              Helena Bioinformatics is a bioinformatics company based in Sofia, Bulgaria, focused on developing AI-powered tools for clinical genetics. The company was founded to address a critical bottleneck in genomic medicine: the manual, time-consuming process of variant interpretation that limits the capacity of genetics laboratories worldwide.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-primary text-center">Our Approach</h2>
            <div className="bg-card border border-border rounded-lg p-8 space-y-4 max-w-3xl mx-auto">
              <p className="text-base text-muted-foreground leading-relaxed">
                Clinical genetics laboratories generate 20-50+ Variants of Unknown Significance (VUS) per patient case. Each variant requires manual review across multiple databases, literature searches, phenotype correlation, and guideline application -- a process that takes 5-10 days per case and hundreds of hours per laboratory per month.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Helena Bioinformatics automates the systematic parts of this workflow. Our platform, Helix Insight, integrates with established clinical databases (ClinVar, gnomAD, PubMed, HPO, OMIM, dbNSFP), follows ACMG/AMP classification guidelines, and produces complete evidence trails that geneticists can review, validate, and use in clinical reports.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                We do not replace clinical judgment. We give geneticists the infrastructure to apply their expertise faster, more consistently, and at scale. Every analysis output is advisory -- the final interpretation remains with the qualified professional.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-primary text-center">Infrastructure</h2>
            <div className="bg-card border border-border rounded-lg p-8 space-y-4 max-w-3xl mx-auto">
              <p className="text-base text-muted-foreground leading-relaxed">
                All data is processed and stored on dedicated servers in Helsinki, Finland, ensuring full GDPR compliance and EU data residency. We follow Clean Architecture principles with comprehensive audit trails, encryption at rest and in transit, and role-based access control.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                No multi-tenant cloud. No data leaving the EU. No compromises on the security standards that genomic data demands. The same infrastructure principles expected in enterprise telecommunications and financial systems, applied to clinical genomics.
              </p>
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
                  Founded Helena Bioinformatics to solve a problem that costs lives through delay: geneticists spending days on variant interpretation that technology should handle in minutes. Every hour a laboratory spends on manual classification is an hour a patient waits for answers.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Helix Insight is built on that urgency -- engineering infrastructure where clinical accuracy and speed are not trade-offs, but requirements. The mission is straightforward: give every genetics laboratory, regardless of size, access to interpretation tools that were previously only available to the largest institutions.
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
                  Academician of the Bulgarian Academy of Sciences and one of the foremost authorities in medical genetics in Southeast Europe. Over 40 years of scientific and clinical experience in human genetics and genomics.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Former Head of the Department of Medical Genetics at the Medical University of Sofia and Director of the National Genomic Center for Socially Significant Diseases. Author of 300+ scientific publications, 14 monographs, and supervisor of 40 doctoral candidates. National Consultant in Medical Genetics at the Bulgarian Ministry of Health.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  President of the Bulgarian Society of Human Genetics and Genomics. Member of the European Society of Human Genetics (ESHG) Scientific Program Committee and the European Cytogeneticists Association (ECA) European Council. Specialized at institutions including Oxford, London, Naples, and the Tokyo Human Genome Center.
                </p>
                <p className="text-sm text-muted-foreground">
                  Nominated for the Order of Saints Cyril and Methodius -- the highest state distinction for contributions to science and education in Bulgaria (2026).
                </p>
              </div>
            </div>
          </section>

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
