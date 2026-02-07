import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="flex items-center justify-center px-6 pt-20 pb-12">
      <div className="flex flex-col items-center justify-center space-y-8 max-w-4xl">
        <div className="text-center space-y-5">
          <h1 className="text-5xl font-bold text-primary">
            Helena Bioinformatics
          </h1>
          <p className="text-xl text-muted-foreground">
            Advancing Clinical Genomics Through AI
          </p>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We build AI-powered infrastructure for clinical genetics laboratories, reducing variant interpretation from days to minutes while maintaining the clinical accuracy that patient care demands.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          
            href="https://helixinsight.bio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors shadow-md"
          >
            Explore Helix Insight
            <ArrowRight className="w-5 h-5" />
          </a>
          <Link
            href="/contact"
            className="px-8 py-3 bg-card border-2 border-border text-foreground rounded-lg text-lg font-medium hover:bg-muted transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  )
}
