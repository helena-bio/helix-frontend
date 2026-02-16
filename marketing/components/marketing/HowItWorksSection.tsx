import Link from 'next/link'
import { Upload, Sparkles, FileText, ArrowRight } from 'lucide-react'

const steps = [
  {
    number: '1',
    icon: Upload,
    title: 'Upload VCF File',
    description: 'Upload your genomic data file securely. Supports standard VCF format from any sequencing platform.',
  },
  {
    number: '2',
    icon: Sparkles,
    title: 'AI Analysis',
    description: 'Automated processing pipeline analyzes variants, phenotypes, and literature in 30-60 minutes.',
  },
  {
    number: '3',
    icon: FileText,
    title: 'Clinical Report',
    description: 'Download comprehensive interpretation with ACMG classification, evidence, and recommendations.',
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold text-primary">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From upload to clinical report in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start relative">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <>
                <div key={step.number} className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                      <Icon className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-card border-2 border-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{step.number}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute items-center justify-center" style={{
                    left: `${(index + 1) * 33.333 - 16.666}%`,
                    top: '40px',
                    width: '0',
                  }}>
                    <ArrowRight className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
              </>
            )
          })}
        </div>

        {/* Link to detailed pipeline page */}
        <div className="text-center mt-12">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-base text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Learn more about our analysis pipeline
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
