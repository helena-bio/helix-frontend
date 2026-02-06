import { Shield, Server, Lock, FileText, Eye, Trash2 } from 'lucide-react'

const securityFeatures = [
  {
    icon: Server,
    title: 'EU Data Residency',
    description: 'All genomic data is processed and stored exclusively on dedicated servers in Helsinki, Finland. Your data never leaves the European Union.',
  },
  {
    icon: Lock,
    title: 'Encryption',
    description: 'TLS 1.3 encryption in transit and AES-256 encryption at rest. All data is encrypted end-to-end from upload to storage.',
  },
  {
    icon: Eye,
    title: 'Access Control & Audit Trails',
    description: 'Role-based access control with complete audit logging. Every access, modification, and analysis is tracked and auditable.',
  },
  {
    icon: FileText,
    title: 'GDPR Article 9 Compliance',
    description: 'Genetic data is classified as special category data under GDPR. We maintain full compliance with Data Protection Impact Assessments and Records of Processing Activities.',
  },
  {
    icon: Shield,
    title: 'Data Processing Agreements',
    description: 'Standard DPA provided for every laboratory partnership, clearly defining data controller and processor responsibilities, retention periods, and breach notification procedures.',
  },
  {
    icon: Trash2,
    title: 'Data Minimization & Retention',
    description: 'We process only the genomic data necessary for analysis. Configurable retention policies with automatic deletion. Your data, your control.',
  },
]

const complianceDocuments = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Data Processing Agreement', href: '/dpa' },
  { name: 'Data Protection Impact Assessment', href: '/dpia' },
]

export function SecurityComplianceSection() {
  return (
    <section className="py-16 px-6 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold text-primary">
            Security & Compliance
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Genomic data demands the highest level of protection. Our infrastructure and processes are designed for clinical-grade security from the ground up.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {securityFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="bg-background border border-border rounded-lg p-8 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Compliance Documents */}
        <div className="bg-background border border-border rounded-lg p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Compliance Documentation
              </h3>
              <p className="text-base text-muted-foreground">
                Full transparency. All compliance documents are available for review.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {complianceDocuments.map((doc) => (
                
                  <a key={doc.name}
                  href={doc.href}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-md text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {doc.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
