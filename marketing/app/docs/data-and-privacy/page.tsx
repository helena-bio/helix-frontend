import Link from 'next/link'

export const metadata = {
  title: 'Data and Privacy | Helix Insight Documentation',
  description: 'How Helix Insight protects genomic data: EU infrastructure, GDPR compliance, data retention, and zero external calls.',
}

const subpages = [
  { href: '/docs/data-and-privacy/infrastructure', title: 'Infrastructure', description: 'Dedicated EU hardware, Helsinki datacenter, no multi-tenant cloud.' },
  { href: '/docs/data-and-privacy/gdpr-compliance', title: 'GDPR Compliance', description: 'Article 9 special category data, controller/processor roles, data subject rights.' },
  { href: '/docs/data-and-privacy/data-retention', title: 'Data Retention', description: 'What data is kept, for how long, and how deletion works.' },
  { href: '/docs/data-and-privacy/no-external-calls', title: 'No External Calls', description: 'Zero outbound network calls during variant processing.' },
]

export default function DataAndPrivacyPage() {
  return (
    <div className="py-10 space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">Data and Privacy</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Genomic data is the most sensitive category of personal data under EU law. It is immutable, uniquely identifying, and carries implications for the data subject and their biological relatives. Helix Insight is designed from the ground up to process this data with clinical-grade security and full GDPR compliance.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The platform operates on dedicated hardware in the European Union, makes zero external API calls during variant processing, and provides transparent data retention with automatic deletion. Every access, modification, and analysis is tracked and auditable.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Key Principles</p>
        <div className="space-y-3">
          {[
            { label: 'EU-Only Processing', desc: 'All genomic data is processed and stored on dedicated hardware in Helsinki, Finland. Data never leaves the European Union at any processing stage. No cloud services with non-EU jurisdiction are used for variant data.' },
            { label: 'Data Minimization', desc: 'The platform processes only the genomic data necessary for analysis. VCF files are received in pseudonymized form -- sample identifiers only, no patient names, dates of birth, or national identification numbers.' },
            { label: 'Zero External Calls', desc: 'During variant processing, the platform makes zero outbound network calls. All reference databases, annotation tools, and the literature database run locally. No patient data or query parameters are sent to any external service.' },
            { label: 'Transparent Retention', desc: 'Uploaded VCF files are deleted after processing completes. Analysis results are retained for the duration specified in the service agreement. All data is deletable on request per GDPR Article 17.' },
            { label: 'Controller/Processor Separation', desc: 'The laboratory is the data controller. Helena Bioinformatics acts as data processor under a signed Data Processing Agreement (DPA) that defines responsibilities, retention periods, and breach notification procedures.' },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.label}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Compliance Documents</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The following legal documents are available on our website:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            { name: 'Privacy Policy', href: '/privacy', desc: 'How we collect, use, store, and protect personal and genomic data.' },
            { name: 'Data Processing Agreement (DPA)', href: '/dpa', desc: 'Standard DPA for laboratory partners, pursuant to GDPR Article 28.' },
            { name: 'Data Protection Impact Assessment (DPIA)', href: '/dpia', desc: 'Risk assessment for high-risk processing of genetic data, per GDPR Article 35.' },
          ].map((doc) => (
            <div key={doc.name} className="flex items-start gap-3">
              <Link href={doc.href} className="text-primary hover:underline font-medium text-base shrink-0">{doc.name}</Link>
              <span className="text-md text-muted-foreground">{doc.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">In This Section</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subpages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="bg-card border border-border rounded-lg p-4 space-y-1 hover:border-primary/30 transition-colors group"
            >
              <p className="text-base font-medium text-foreground group-hover:text-primary transition-colors">{page.title}</p>
              <p className="text-md text-muted-foreground">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
