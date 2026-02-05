import { Clock, CheckCircle, DollarSign, TrendingUp } from 'lucide-react'

const benefits = [
  {
    icon: Clock,
    title: 'Operational Efficiency',
    items: [
      'Reduce analysis time from 5-10 days to 30-60 minutes',
      'Process more cases with existing staff',
      'Eliminate manual literature searches',
    ],
  },
  {
    icon: CheckCircle,
    title: 'Quality & Compliance',
    items: [
      'Standardized, reproducible interpretation',
      'Complete audit trails for regulatory compliance',
      'Continuous updates from clinical guidelines',
    ],
  },
  {
    icon: DollarSign,
    title: 'Cost Structure',
    items: [
      'Freemium pricing for small laboratories',
      'Pay-per-analysis model that scales',
      'ROI positive within first year',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Strategic Benefits',
    items: [
      'Enable precision medicine at scale',
      'Reduce time to diagnosis for patients',
      'Future-proof AI architecture',
    ],
  },
]

export function BenefitsSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl font-bold text-primary">
            Built for Clinical Genetics Laboratories
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your variant analysis operation with AI-powered infrastructure that scales with demand
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div
                key={benefit.title}
                className="bg-card border border-border rounded-lg p-6 space-y-4"
              >
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-base font-medium font-bold text-foreground">
                  {benefit.title}
                </h3>
                <ul className="space-y-3">
                  {benefit.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-md text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
