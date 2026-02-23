import Link from 'next/link'

export const metadata = {
  title: 'GDPR Compliance | Helix Insight Documentation',
  description: 'How Helix Insight complies with GDPR for processing genetic data as special category data.',
}

export default function GDPRCompliancePage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/data-and-privacy" className="hover:text-primary transition-colors">Data and Privacy</Link>
          {' / '}
          <span className="text-foreground">GDPR Compliance</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">GDPR Compliance</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          Genetic data is classified as special category data under GDPR Article 9, requiring additional legal safeguards beyond those for ordinary personal data. Helix Insight is designed to meet these requirements at every level -- legal, organizational, and technical.
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Controller and Processor Roles</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The distinction between data controller and data processor is fundamental to how genomic data flows through the platform:
        </p>
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-base font-medium text-foreground">Laboratory (Data Controller)</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              The clinical genetics laboratory determines the purpose and means of processing. The laboratory is responsible for: ensuring a lawful basis for processing the genomic data (typically explicit consent under Article 9(2)(a) or healthcare provision under Article 9(2)(h)), obtaining any necessary patient consents, providing only pseudonymized data (sample IDs, no patient names or identification numbers), and deciding on data retention periods.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-base font-medium text-foreground">Helena Bioinformatics (Data Processor)</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              Helena Bioinformatics processes genomic data exclusively on documented instructions from the data controller. As processor, we: process data only for the purposes specified in the Data Processing Agreement, implement appropriate technical and organizational security measures, do not engage sub-processors without prior written authorization, assist the controller in responding to data subject requests, and delete or return all data upon termination of the agreement.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Legal Basis for Processing</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Genomic Data (Special Category)</p>
            <p className="text-md text-muted-foreground leading-relaxed">Article 9(2)(a): explicit consent of the data subject, or Article 9(2)(h): processing necessary for healthcare provision. The applicable legal basis is determined by the data controller (laboratory), not by Helena Bioinformatics. We process this data under contractual obligation (Article 6(1)(b)) and the DPA.</p>
          </div>
          <div className="border-t border-border/50" />
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Account Data</p>
            <p className="text-md text-muted-foreground leading-relaxed">Article 6(1)(b): contractual necessity. Name, email, organization, and role are collected during registration to provide the service.</p>
          </div>
          <div className="border-t border-border/50" />
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Usage Data</p>
            <p className="text-md text-muted-foreground leading-relaxed">Article 6(1)(f): legitimate interest. IP addresses, session duration, and pages visited are collected for security monitoring and service improvement.</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Data Subject Rights</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Data subjects (patients whose genomic data is processed) retain full GDPR rights. Because the laboratory is the data controller, rights requests are typically routed through the laboratory. Helena Bioinformatics assists in fulfilling these requests:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            { right: 'Access (Article 15)', desc: 'Confirmation of processing and a copy of the data being processed.' },
            { right: 'Rectification (Article 16)', desc: 'Correction of inaccurate data.' },
            { right: 'Erasure (Article 17)', desc: 'Deletion of genomic data, subject to legal retention requirements.' },
            { right: 'Restriction (Article 18)', desc: 'Limitation of processing while a dispute is resolved.' },
            { right: 'Portability (Article 20)', desc: 'Export of data in machine-readable format (VCF, PDF).' },
            { right: 'Objection (Article 21)', desc: 'Right to object to specific processing activities.' },
          ].map((item) => (
            <div key={item.right} className="flex items-start gap-3">
              <span className="text-sm font-medium text-foreground w-44 shrink-0">{item.right}</span>
              <span className="text-md text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Data Protection Impact Assessment</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          A DPIA is mandatory under GDPR Article 35 when processing genetic data on a large scale. Helena Bioinformatics has conducted a comprehensive DPIA covering: the nature and scope of processing, necessity and proportionality assessment, risk identification (unauthorized access, data breach, re-identification), and mitigation measures (encryption, physical isolation, access controls, audit logging, automatic deletion).
        </p>
        <p className="text-md text-muted-foreground">
          The full DPIA summary is available at <Link href="/dpia" className="text-primary hover:underline font-medium">Data Protection Impact Assessment</Link>.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">International Transfers</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          No genomic data or personal data is transferred outside the European Economic Area. All processing occurs on infrastructure located in Finland (EU). In the event that a transfer outside the EEA becomes necessary in the future, Helena Bioinformatics will obtain prior written consent from the data controller and implement appropriate safeguards under GDPR Chapter V (Standard Contractual Clauses or adequacy decision).
        </p>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Contact</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          For questions regarding data protection, GDPR compliance, or to exercise data subject rights, contact privacy@helena.bio. The full <Link href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link> and <Link href="/dpa" className="text-primary hover:underline font-medium">Data Processing Agreement</Link> are available on our website.
        </p>
      </section>
    </div>
  )
}
