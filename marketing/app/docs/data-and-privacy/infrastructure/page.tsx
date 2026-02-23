import Link from 'next/link'

export const metadata = {
  title: 'Infrastructure | Helix Insight Documentation',
  description: 'Where Helix Insight processes and stores genomic data: dedicated EU hardware in Helsinki, Finland.',
}

export default function InfrastructurePage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/data-and-privacy" className="hover:text-primary transition-colors">Data and Privacy</Link>
          {' / '}
          <span className="text-foreground">Infrastructure</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Infrastructure</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          All genomic data processing occurs on dedicated hardware located in the European Union. The infrastructure is purpose-built for clinical genomics workloads, not shared multi-tenant cloud services.
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Hardware</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-36">Server</span>
            <span className="text-md text-muted-foreground">Hetzner AX162R -- dedicated bare-metal server</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-36">Processor</span>
            <span className="text-md text-muted-foreground">AMD EPYC 9454P (48 cores / 96 threads)</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-36">Memory</span>
            <span className="text-md text-muted-foreground">504 GB DDR5 ECC RAM</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-36">Storage</span>
            <span className="text-md text-muted-foreground">2x KIOXIA NVMe SSD in RAID configuration</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-36">Location</span>
            <span className="text-md text-muted-foreground">Hetzner Helsinki datacenter, Finland (EU)</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-36">Jurisdiction</span>
            <span className="text-md text-muted-foreground">Finnish and EU data protection law</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Why Dedicated Hardware</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Multi-tenant cloud providers (AWS, GCP, Azure) share physical infrastructure across customers. Even with logical isolation, genetic data processing on shared hardware introduces risks that dedicated servers eliminate:
        </p>
        <div className="space-y-3">
          {[
            { label: 'Physical isolation', desc: 'No other customer\u2019s workloads run on the same hardware. There is no risk of side-channel attacks, noisy neighbor performance degradation, or accidental data exposure through shared resources.' },
            { label: 'Jurisdiction certainty', desc: 'The server is physically located in Helsinki, Finland. Unlike cloud providers that may move workloads between regions, the physical location of the data is fixed and verifiable.' },
            { label: 'No US jurisdiction exposure', desc: 'Major cloud providers are subject to US laws (CLOUD Act, FISA) that can compel disclosure of data stored on their infrastructure regardless of physical location. Hetzner is a German company subject to EU law only.' },
            { label: 'Full administrative control', desc: 'Helena Bioinformatics has exclusive root-level access to the server. No cloud provider employee has access to the operating system, storage, or network configuration.' },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.label}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Security Measures</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'TLS 1.3 encryption for all data in transit',
            'AES-256 encryption for data at rest',
            'Network firewall with restrictive inbound/outbound rules',
            'Role-based access control (RBAC) for all platform functions',
            'Comprehensive audit logging of all data access and processing activities',
            'No outbound network access from the variant processing pipeline',
            'Regular security assessments and vulnerability scanning',
            'Automated intrusion detection and alerting',
          ].map((item) => (
            <p key={item} className="text-md text-muted-foreground">{item}</p>
          ))}
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Data Path</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          When a laboratory uploads a VCF file, the data travels over TLS 1.3 directly to the Helsinki server. The file is parsed, annotated, classified, and scored entirely on this server. Results are stored on the same server. At no point does the data transit through non-EU infrastructure or third-party services.
        </p>
      </section>
    </div>
  )
}
