import Link from 'next/link'

export function ContactCTASection() {
  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-3xl font-semibold text-primary">Looking for Partners</h2>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          We are actively seeking clinical genetics laboratories and research institutions for validation partnerships and early collaboration.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/contact" className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-base font-medium hover:bg-primary/90 transition-colors shadow-md">
            Get in Touch
          </Link>
          <a href="mailto:contact@helena.bio" className="text-base text-muted-foreground hover:text-foreground transition-colors">
            contact@helena.bio
          </a>
        </div>
      </div>
    </section>
  )
}
