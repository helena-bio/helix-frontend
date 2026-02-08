import { Header, Footer } from '@/components'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'About | Helena Bioinformatics',
  description: 'About Helena Bioinformatics -- software company integrating AI into bioinformatics.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-16 px-6">
        <div className="max-w-3xl mx-auto space-y-16">

          <section className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">About</h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Helena Bioinformatics is a software company based in Sofia, Bulgaria, working at the intersection of artificial intelligence and bioinformatics. We build tools that help researchers and clinicians work with genomic data at a scale and speed that manual workflows cannot match.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Sequencing costs have dropped by orders of magnitude. The analytical infrastructure has not kept pace. We develop AI-native software that bridges this gap -- purpose-built for the complexity, precision, and regulatory requirements of genomic science.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Our approach is to augment domain expertise, not abstract it away. Every product we build preserves the decision authority of the specialist while automating the systematic work that consumes their time.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Infrastructure</h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              All products run on dedicated servers in Helsinki, Finland. EU data residency and GDPR-native architecture are foundations, not features.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-primary">Leadership</h2>
            <div className="space-y-5">
              <div className="flex items-center gap-5">
                <Image
                  src="/images/team/vladimir-mitev.png"
                  alt=""
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover object-top shrink-0"
                />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Vladimir Mitev</h3>
                  <p className="text-base text-primary font-medium">Founder &amp; CEO</p>
                </div>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Founded Helena Bioinformatics to build the analytical infrastructure that genomics needs but does not yet have. The goal is to make AI-powered bioinformatics tools accessible to laboratories and research institutions regardless of size or budget.
              </p>
            </div>
          </section>

          <section className="flex items-center justify-center gap-4 pt-4">
            <Link href="/contact" className="px-6 py-3 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors">
              Contact Us
            </Link>
            <Link href="/partners" className="px-6 py-3 bg-card border-2 border-border text-foreground rounded-md text-base font-medium hover:bg-muted transition-colors">
              Partners
            </Link>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
