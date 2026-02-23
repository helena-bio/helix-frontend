import { Header, Footer } from '@/components'

export const metadata = {
  title: 'Data Processing Agreement | Helix Insight',
  description: 'Standard Data Processing Agreement for Helix Insight laboratory partners.',
  alternates: { canonical: 'https://helixinsight.bio/dpa' },
}

export default function DPAPage() {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <article className="max-w-4xl mx-auto space-y-10">

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-primary">Data Processing Agreement</h1>
            <p className="text-sm text-muted-foreground">Last updated: February 2026</p>
            <p className="text-base text-foreground leading-relaxed">
              This Data Processing Agreement (&quot;DPA&quot;) forms part of the service agreement between the laboratory (&quot;Data Controller&quot;) and Helena Bioinformatics EOOD (&quot;Data Processor&quot;) for the use of the Helix Insight platform, pursuant to Article 28 of the EU General Data Protection Regulation (GDPR).
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">1. Scope and Purpose</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>The Data Processor processes personal data, including special category genetic data, on behalf of the Data Controller solely for the purpose of providing variant analysis services through the Helix Insight platform. Processing activities include: ingestion and parsing of VCF files; variant annotation against reference databases (gnomAD, ClinVar, dbNSFP); automated ACMG/AMP classification; phenotype-genotype correlation using HPO ontology; biomedical literature analysis; and generation of clinical interpretation reports.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">2. Categories of Data Subjects and Data</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p><strong className="text-foreground">Data subjects:</strong> patients whose genomic samples have been sequenced by the Data Controller.</p>
              <p><strong className="text-foreground">Categories of personal data:</strong> genetic variant data (VCF format), phenotype descriptors (HPO terms), sample identifiers (pseudonymized), and analysis metadata (timestamps, processing parameters).</p>
              <p>The Data Processor does not receive or process patient names, dates of birth, national identification numbers, or other directly identifying information. All genomic data is received in pseudonymized form using sample identifiers assigned by the Data Controller.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">3. Obligations of the Data Processor</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>The Data Processor shall: process personal data only on documented instructions from the Data Controller; ensure that persons authorized to process personal data are bound by confidentiality obligations; implement appropriate technical and organizational security measures as described in Section 5; not engage sub-processors without prior written authorization from the Data Controller; assist the Data Controller in responding to data subject requests; assist the Data Controller in ensuring compliance with Articles 32-36 GDPR (security, breach notification, DPIA); make available all information necessary to demonstrate compliance and allow for audits; and delete or return all personal data upon termination of the agreement, at the Data Controller&apos;s choice.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">4. Obligations of the Data Controller</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>The Data Controller shall: ensure a lawful basis exists for processing the genomic data (typically explicit consent under Article 9(2)(a) or healthcare provision under Article 9(2)(h)); provide only pseudonymized data to the Data Processor; ensure all necessary patient consents have been obtained prior to uploading data; provide documented processing instructions; and notify the Data Processor promptly of any data subject requests relevant to the processing.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">5. Technical and Organizational Measures</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>The Data Processor implements the following measures pursuant to GDPR Article 32:</p>
              <p><strong className="text-foreground">Encryption:</strong> TLS 1.3 for all data in transit. AES-256 encryption for all data at rest, including database storage and file systems.</p>
              <p><strong className="text-foreground">Access control:</strong> role-based access control (RBAC) enforcing the principle of least privilege. Multi-factor authentication for administrative access. JWT-based session management with automatic expiration.</p>
              <p><strong className="text-foreground">Infrastructure:</strong> dedicated servers (not shared cloud) located in Helsinki, Finland (EU). Network isolation with firewall rules restricting all non-essential traffic. No data transfer outside the EU/EEA.</p>
              <p><strong className="text-foreground">Audit trails:</strong> comprehensive logging of all data access, processing operations, and administrative actions. Logs are tamper-resistant and retained for 24 months.</p>
              <p><strong className="text-foreground">Availability:</strong> regular automated backups with tested recovery procedures. Monitoring and alerting for service health and security events.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">6. Sub-processors</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>The Data Processor currently uses the following sub-processor for genomic data processing:</p>
              <p><strong className="text-foreground">Hetzner Online GmbH</strong> (Gunzenhausen, Germany): dedicated server infrastructure in Helsinki, Finland. Hetzner provides physical hosting only and does not have logical access to the data. Hetzner maintains ISO 27001 certification.</p>
              <p>The Data Processor shall inform the Data Controller of any intended changes to sub-processors at least 30 days in advance, providing the Data Controller with the opportunity to object.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">7. Data Retention and Deletion</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>The default retention period for genomic data is 90 days following analysis completion. The Data Controller may configure a shorter or longer retention period. Upon expiration of the retention period, or upon written request from the Data Controller, all genomic data and derived analysis results are permanently deleted using secure erasure methods. Deletion confirmation is provided to the Data Controller upon request.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">8. Data Breach Notification</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>The Data Processor shall notify the Data Controller without undue delay, and no later than 24 hours, after becoming aware of a personal data breach affecting the Data Controller&apos;s data. The notification shall include: the nature of the breach including categories and approximate number of data subjects affected; the likely consequences of the breach; the measures taken or proposed to address the breach; and the contact point for further information.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">9. International Transfers</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>No genomic data or personal data processed under this DPA is transferred outside the European Economic Area. All processing occurs on infrastructure located in Finland (EU). In the event that a transfer outside the EEA becomes necessary in the future, the Data Processor shall obtain prior written consent from the Data Controller and implement appropriate safeguards under GDPR Chapter V (Standard Contractual Clauses or adequacy decision).</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">10. Audits</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>The Data Processor shall make available to the Data Controller all information necessary to demonstrate compliance with this DPA and GDPR Article 28. The Data Controller or its appointed auditor may conduct audits with 30 days prior written notice, during normal business hours, and subject to reasonable confidentiality obligations.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">11. Term and Termination</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>This DPA remains in effect for the duration of the service agreement. Upon termination, the Data Processor shall, at the Data Controller&apos;s election, return or securely delete all personal data within 30 days and certify the deletion in writing.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">12. Governing Law</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>This DPA is governed by the laws of the Republic of Bulgaria and the European Union. For disputes, the competent courts in Sofia, Bulgaria shall have jurisdiction.</p>
              <p>For questions regarding this DPA, contact privacy@helena.bio.</p>
            </div>
          </section>

        </article>
      <Footer />
      </main>
    </div>
  )
}
