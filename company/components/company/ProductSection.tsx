import { Database, Users, BookOpen, Brain, ArrowRight, Clock, Shield, Layers } from 'lucide-react'

const capabilities = [
  {
    icon: Database,
    title: 'Variant Analysis',
    description: 'VCF ingestion, VEP annotation, multi-source enrichment (ClinVar, gnomAD, dbNSFP), and automated ACMG/AMP classification.',
  },
  {
    icon: Users,
    title: 'Phenotype Matching',
    description: 'HPO ontology-based semantic similarity scoring with gene-disease-phenotype correlation for clinical prioritization.',
  },
  {
    icon: BookOpen,
    title: 'Literature Intelligence',
    description: 'NLP-driven mining of PubMed, Europe PMC, and preprint servers with automatic evidence extraction and citation tracking.',
  },
  {
    icon: Brain,
    title: 'AI Interpretation',
    description: 'Evidence synthesis across genomic data, phenotypes, and literature into structured clinical reports with full audit trails.',
  },
]

const metrics = [
  { icon: Clock, value: '30-60 min', label: 'WES analysis time' },
  { icon: Layers, value: '6', label: 'Integrated databases' },
  { icon: Shield, value: '100%', label: 'EU data residency' },
]

export function ProductSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold text-primary">Helix Insight</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our flagship platform for automated genetic variant interpretation. Six integrated microservices that transform raw VCF data into clinical-grade analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              {metrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <div key={metric.label} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-lg font-bold text-foreground">{metric.value}</p>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <a href="https://helixinsight.bio" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-base font-medium hover:bg-primary/90 transition-colors shadow-md shrink-0">
              Visit Helix Insight
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
