import { Header, Footer } from '@/components'
import { ContactForm } from './ContactForm'

export const metadata = {
  title: 'Contact | Helena Bioinformatics',
  description: 'Get in touch with Helena Bioinformatics -- partnerships, collaborations, and inquiries.',
}

export default function ContactPage() {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto pt-8 pb-12 px-6">
        <div className="max-w-2xl mx-auto space-y-12">

          <section className="space-y-4">
            <h1 className="text-3xl font-semibold text-primary">Contact</h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Whether you represent a clinical genetics laboratory, a research institution, or an organization interested in collaboration -- we would like to hear from you.
            </p>
            <p className="text-base text-muted-foreground">
              <a href="mailto:contact@helena.bio" className="text-foreground hover:text-primary transition-colors">contact@helena.bio</a>
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Send a Message</h2>
            <ContactForm />
          </section>

          <section>
            <p className="text-sm text-muted-foreground">
              Your data will be processed in accordance with our{' '}
              <a href="https://helixinsight.bio/privacy" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">Privacy Policy</a>.
            </p>
          </section>

        </div>
      <Footer />
      </main>
    </div>
  )
}
