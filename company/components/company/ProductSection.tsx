import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
export function ProductSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-3xl font-semibold text-primary text-center">Products</h2>
        <div className="flex gap-8 items-start">
          <a href="https://helixinsight.bio" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity">
            <Image
              src="/images/logos/logo_bulb.svg"
              alt=""
              width={64}
              height={80}
              className="h-20 w-auto"
            />
            <Image
              src="/images/logos/logo_helix.svg"
              alt="Helix Insight"
              width={300}
              height={80}
              className="h-20 w-auto"
            />
          </a>
          <div className="space-y-4">
            <p className="text-base text-muted-foreground leading-relaxed">
              AI-powered variant interpretation for clinical genetics laboratories. Integrates population databases, clinical repositories, computational predictors, and biomedical literature into structured, ACMG-aligned evidence summaries.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Currently in clinical validation.
            </p>
          </div>
        </div>
        <a href="https://helixinsight.bio" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-base font-medium text-foreground hover:text-primary transition-colors">
          helixinsight.bio
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  )
}
