import { Database, Users, BookOpen, Brain } from 'lucide-react'

const features = [
  {
    icon: Database,
    title: 'Analysis Service',
    description: 'Comprehensive variant annotation with VEP and automated ACMG classification following clinical guidelines.',
    highlights: ['VCF processing', 'Multi-source annotation', 'ACMG criteria'],
  },
  {
    icon: Users,
    title: 'Phenotype Matching',
    description: 'HPO-based phenotype analysis with semantic similarity scoring to prioritize clinically relevant variants.',
    highlights: ['HPO ontology', 'Semantic matching', 'Clinical relevance'],
  },
  {
    icon: BookOpen,
    title: 'Literature Analysis',
    description: 'Automated mining of biomedical literature from PubMed, ClinVar, and specialized databases.',
    highlights: ['Multi-source search', 'Evidence extraction', 'Citation tracking'],
  },
  {
    icon: Brain,
    title: 'AI Interpretation',
    description: 'Advanced AI models synthesize genomic data, phenotypes, and literature to generate clinical reports.',
    highlights: ['Evidence synthesis', 'Report generation', 'Clinical insights'],
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-semibold text-primary">
            AI-Powered Analysis Pipeline
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Four integrated modules that transform raw genomic data into actionable clinical insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-lg p-8 space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-base text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {feature.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="px-3 py-1 bg-primary/5 text-primary text-md rounded-full"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
