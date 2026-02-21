import { Header, Footer } from '@/components'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Partners | Helena Bioinformatics',
  description: 'Clinical validation and partnership opportunities with Helena Bioinformatics.',
}

export default function PartnersPage() {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto pt-8 pb-12 px-6">
        <div className="max-w-3xl mx-auto space-y-16">

          <section className="space-y-4">
            <h1 className="text-3xl font-semibold text-primary">Partners</h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Our products are built alongside the professionals who use them. We partner with clinical laboratories and research institutions to ensure that what we ship meets the standards of real-world practice.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Clinical Validation Program</h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Helix Insight is currently in clinical validation with EU-based diagnostic laboratories performing whole-exome and whole-genome sequencing. The program benchmarks platform outputs against established manual interpretation workflows across cases with known clinical outcomes.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              We are actively expanding this program and seeking additional laboratory partners.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Scientific Advisory</h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Helena Bioinformatics works with scientific advisors in medical genetics and genomics who provide oversight on clinical standards, classification guideline alignment, and regulatory compliance.
            </p>
          </section>

          <section className="border-t border-border pt-12 space-y-6">
            <h2 className="text-3xl font-semibold text-primary">Work With Us</h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              We are looking for clinical genetics laboratories for validation partnerships, research institutions for collaboration, and strategic partners who share our approach to AI-powered bioinformatics.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-base font-medium hover:bg-primary/90 transition-colors">
                Get in Touch
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="mailto:contact@helena.bio" className="text-base text-muted-foreground hover:text-foreground transition-colors py-3">
                contact@helena.bio
              </a>
            </div>
          </section>

        </div>
      <Footer />
      </main>
    </div>
  )
}
