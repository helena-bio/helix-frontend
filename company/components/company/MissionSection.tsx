import { Target, Microscope, Globe } from 'lucide-react'

const pillars = [
  {
    icon: Target,
    title: 'The Problem',
    description: 'Clinical genetics laboratories spend 5-10 days manually interpreting each patient case -- cross-referencing databases, reviewing literature, and applying classification guidelines across dozens of variants. This bottleneck limits laboratory capacity and delays patient diagnoses.',
  },
  {
    icon: Microscope,
    title: 'Our Approach',
    description: 'We combine AI with established clinical standards (ACMG/AMP guidelines, ClinVar, gnomAD) to automate the systematic work while preserving full clinical control. Every result includes a complete evidence trail for geneticist review.',
  },
  {
    icon: Globe,
    title: 'Our Infrastructure',
    description: 'Built on dedicated EU servers in Helsinki, Finland. GDPR-native architecture with encryption at rest and in transit, complete audit trails, and role-based access control. No multi-tenant cloud -- your data stays isolated.',
  },
]

export function MissionSection() {
  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold text-primary">
            Why Helena Bioinformatics
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Clinical genomics needs infrastructure that matches its precision. We are building it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div key={pillar.title} className="bg-card border border-border rounded-lg p-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {pillar.title}
                  </h3>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
