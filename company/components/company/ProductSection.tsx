import { Database, Users, BookOpen, Brain, ArrowRight } from 'lucide-react'

const capabilities = [
  {
    icon: Database,
    title: 'Variant Analysis',
    description: 'VCF processing with multi-source annotation and automated ACMG classification.',
  },
  {
    icon: Users,
    title: 'Phenotype Matching',
    description: 'HPO-based semantic similarity scoring for clinical variant prioritization.',
  },
  {
    icon: BookOpen,
    title: 'Literature Intelligence',
    description: 'Automated mining of PubMed, ClinVar, and specialized biomedical databases.',
  },
  {
    icon: Brain,
    title: 'AI Interpretation',
    description: 'Evidence synthesis across genomic data, phenotypes, and literature into clinical reports.',
  },
]

export function ProductSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold text-primary">
            Helix Insight
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our flagship platform for AI-powered genetic variant analysis. From raw VCF to clinical report in 30-60 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {capabilities.map((cap) => {
            const Icon = cap.icon
            return (
              <div key={cap.title} className="bg-card border border-border rounded-lg p-6 space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{cap.title}</h3>
                <p className="text-base text-muted-foreground">{cap.description}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          
            href="https://helixinsight.bio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors shadow-md"
          >
            Visit Helix Insight
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  )
}
