import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export function ProductSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Products</p>
          <div className="flex items-center gap-3">
            <Image
              src="/images/logos/logo_bulb.svg"
              alt=""
              width={32}
              height={40}
              className="h-10 w-auto"
            />
            <Image
              src="/images/logos/logo_helix.svg"
              alt="Helix Insight"
              width={200}
              height={56}
              className="h-12 w-auto"
            />
          </div>
        </div>
        <p className="text-base text-muted-foreground leading-relaxed">
          AI-powered variant interpretation for clinical genetics laboratories. Integrates population databases, clinical repositories, computational predictors, and biomedical literature into structured, ACMG-aligned evidence summaries.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Currently in clinical validation.
        </p>
        <a href="https://helixinsight.bio" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-base font-medium text-foreground hover:text-primary transition-colors">
          helixinsight.bio
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  )
}
