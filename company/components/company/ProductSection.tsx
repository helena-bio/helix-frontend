import { ArrowRight } from 'lucide-react'

export function ProductSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Products</p>
          <h2 className="text-3xl font-bold text-primary">Helix Insight</h2>
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
