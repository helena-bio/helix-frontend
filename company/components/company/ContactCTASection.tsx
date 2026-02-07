import Link from 'next/link'
import { Mail, Building2 } from 'lucide-react'

export function ContactCTASection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-primary">
              Work With Us
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you are a clinical genetics laboratory, a research institution, or an investor exploring the genomics space -- we would like to hear from you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors shadow-md w-full sm:w-auto">
              Contact Us
            </Link>
            <a href="mailto:contact@helena.bio" className="px-8 py-3 bg-card border-2 border-border text-foreground rounded-lg text-lg font-medium hover:bg-muted transition-colors w-full sm:w-auto">
              contact@helena.bio
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-md text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>Sofia, Bulgaria</span>
            </div>
            <div className="flex items-center gap-2 text-md text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>contact@helena.bio</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
