import { Header, Footer } from '@/components'
import Link from 'next/link'

export const metadata = {
  title: 'Join Us | Helena Bioinformatics',
  description: 'Future opportunities at Helena Bioinformatics -- connect with us as we grow.',
}

export default function JoinUsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-16 px-6">
        <div className="max-w-3xl mx-auto space-y-16">

          <section className="space-y-6">
            <h1 className="text-3xl font-semibold text-primary">Join Us</h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Helix Insight is built by a focused team. We are not actively hiring at this time, but we are always interested in connecting with people who want to work at the intersection of artificial intelligence and clinical genomics.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              If any of the areas below match your background, we would like to hear from you.
            </p>
          </section>

          <section className="space-y-10">
            <h2 className="text-lg font-semibold text-foreground">Future Opportunities</h2>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">Bioinformatics Engineer</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Experience with variant annotation pipelines, VCF processing, and clinical genomics databases such as ClinVar, gnomAD, and dbNSFP. Familiarity with ACMG/AMP classification frameworks.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">ML/NLP Engineer</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Experience with biomedical natural language processing, literature mining, and transformer-based models such as BioBERT or PubMedBERT. Interest in applied machine learning for clinical decision support.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">Clinical Genomics Specialist</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Background in genetic counseling, laboratory genetics, or clinical variant interpretation. Understanding of diagnostic workflows and reporting standards in accredited laboratories.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">Frontend Engineer</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Experience building data-intensive interfaces for scientific or clinical applications. Proficiency with React and TypeScript. Ability to translate complex genomic data into clear, actionable views.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">How to Reach Us</h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Send a brief introduction and your area of interest to{' '}
              <a href="mailto:contact@helena.bio" className="text-foreground hover:text-primary transition-colors">contact@helena.bio</a>.
              There is no formal application process -- we are simply building a network of people who share our focus.
            </p>
          </section>

          <section className="flex items-center justify-center gap-4 pt-4">
            <Link href="/about" className="px-6 py-3 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="px-6 py-3 bg-card border-2 border-border text-foreground rounded-md text-base font-medium hover:bg-muted transition-colors">
              Contact
            </Link>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
