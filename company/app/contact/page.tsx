import { Header, Footer } from '@/components'
import { Mail, Building2, Shield } from 'lucide-react'
import { ContactForm } from './ContactForm'

export const metadata = {
  title: 'Contact | Helena Bioinformatics',
  description: 'Get in touch with Helena Bioinformatics -- partnerships, inquiries, and collaboration.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-16">

          <section className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-primary text-center">Contact Us</h1>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              Whether you are a clinical genetics laboratory exploring automation, a research institution interested in collaboration, or an investor in the genomics space -- we would like to hear from you.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6 space-y-3 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">General Inquiries</h3>
              <p className="text-base text-muted-foreground">Questions about Helena Bioinformatics or partnerships.</p>
              <a href="mailto:contact@helena.bio" className="text-base text-primary hover:underline block">contact@helena.bio</a>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-3 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Company</h3>
              <p className="text-base text-muted-foreground">Helena Bioinformatics EOOD</p>
              <p className="text-base text-muted-foreground">Sofia, Bulgaria</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-3 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Data Protection</h3>
              <p className="text-base text-muted-foreground">GDPR and privacy-related inquiries.</p>
              <a href="mailto:privacy@helena.bio" className="text-base text-primary hover:underline block">privacy@helena.bio</a>
            </div>
          </section>

          <section className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-primary text-center">Send a Message</h2>
            <ContactForm />
          </section>

          <section className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              By contacting us, your data will be processed in accordance with our{' '}
              <a href="https://helixinsight.bio/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
