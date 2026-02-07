import { Target, Microscope, Globe } from 'lucide-react'

const pillars = [
  {
    icon: Target,
    title: 'The Bottleneck',
    description: 'A single whole-exome sequencing case generates 20-50 Variants of Unknown Significance. Each requires manual cross-referencing across ClinVar, gnomAD, PubMed, OMIM, and classification guideline application. Laboratories process this across dozens of browser tabs over 5-10 working days. This is the rate-limiting step in clinical genomics.',
  },
  {
    icon: Microscope,
    title: 'Our Solution',
    description: 'Helix Insight automates the systematic work: multi-source variant annotation, ACMG/AMP classification, HPO-based phenotype matching, and biomedical literature mining. Every result includes a complete evidence trail. The geneticist reviews and validates -- the platform does the assembly.',
  },
  {
    icon: Globe,
    title: 'EU-Native Infrastructure',
    description: 'Dedicated servers in Helsinki, Finland -- not multi-tenant cloud. AES-256 encryption at rest, TLS 1.3 in transit, role-based access control, complete audit trails. Genomic data never leaves the European Union. Built to the security standards that genetic data demands under GDPR Article 9.',
  },
]

export function MissionSection() {
  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold text-primary">Why We Exist</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            85% of clinical genetics laboratories lack access to enterprise-grade interpretation tools. We are building the infrastructure to change that.
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
                  <h3 className="text-lg font-semibold text-foreground">{pillar.title}</h3>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed">{pillar.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
