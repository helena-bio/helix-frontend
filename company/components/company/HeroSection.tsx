import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="flex items-center justify-center px-6 pt-24 pb-16">
      <div className="flex flex-col items-center justify-center space-y-10 max-w-4xl">
        <div className="text-center space-y-5">
          <h1 className="text-5xl font-bold text-primary">Helena Bioinformatics</h1>
          <p className="text-xl text-foreground font-medium">AI Infrastructure for Clinical Genomics</p>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Clinical genetics laboratories spend 5-10 days interpreting each patient case. Our platform reduces that to under an hour -- without compromising the clinical accuracy that patient care demands.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 max-w-xl w-full">
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-primary">95%</p>
            <p className="text-sm text-muted-foreground">Time Reduction</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-primary">6</p>
            <p className="text-sm text-muted-foreground">Clinical Databases</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-primary">EU</p>
            <p className="text-sm text-muted-foreground">Data Residency</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a href="https://helixinsight.bio" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors shadow-md">
            Explore Helix Insight
            <ArrowRight className="w-5 h-5" />
          </a>
          <Link href="/contact" className="px-8 py-3 bg-card border-2 border-border text-foreground rounded-lg text-lg font-medium hover:bg-muted transition-colors">
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  )
}
