import { Header, Footer } from '@/components'

export const metadata = {
  title: 'Privacy Policy | Helix Insight',
  description: 'How Helena Bioinformatics collects, processes, and protects your personal and genomic data.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto pt-8 pb-12 px-6">
        <article className="max-w-4xl mx-auto space-y-10">

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-primary">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: February 2026</p>
            <p className="text-base text-foreground leading-relaxed">
              Helena Bioinformatics EOOD (&quot;Helena Bioinformatics&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the Helix Insight platform. This Privacy Policy explains how we collect, use, store, and protect personal data, including genomic data, in compliance with the EU General Data Protection Regulation (GDPR) and applicable Bulgarian data protection legislation.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">1. Data Controller</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>
                For personal data collected through our website (account registration, contact forms, demo requests), Helena Bioinformatics acts as the <strong className="text-foreground">data controller</strong>.
              </p>
              <p>
                For genomic data (VCF files, variant data, phenotype information) uploaded by partner laboratories for analysis, the laboratory is the data controller and Helena Bioinformatics acts as the <strong className="text-foreground">data processor</strong>. The relationship is governed by a Data Processing Agreement (DPA) executed with each partner.
              </p>
              <p>Helena Bioinformatics EOOD<br />Sofia, Bulgaria<br />Contact: privacy@helena.bio</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">2. Categories of Personal Data</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>We process the following categories of data:</p>
              <p>
                <strong className="text-foreground">Account Data:</strong> name, email address, organization name, role, and authentication credentials. Collected directly from users during registration. Legal basis: contractual necessity (GDPR Article 6(1)(b)).
              </p>
              <p>
                <strong className="text-foreground">Genomic Data (Special Category):</strong> VCF files containing genetic variant information, associated phenotype terms (HPO codes), and clinical annotations. This constitutes special category data under GDPR Article 9. Legal basis: explicit consent of the data subject or processing necessary for healthcare provision (Article 9(2)(h)), as determined by the data controller (the laboratory). We process genomic data exclusively on instruction from the data controller under a DPA.
              </p>
              <p>
                <strong className="text-foreground">Usage Data:</strong> IP addresses, browser type, pages visited, and session duration. Collected automatically for security monitoring and service improvement. Legal basis: legitimate interest (Article 6(1)(f)).
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">3. Purpose of Processing</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>We process personal data for the following purposes: providing and maintaining the Helix Insight platform, including variant annotation, ACMG classification, phenotype matching, and literature analysis; authenticating users and managing access control; communicating with users about their accounts and platform updates; responding to demo requests and support inquiries; security monitoring, fraud prevention, and audit logging; and complying with legal obligations.</p>
              <p>Genomic data is processed solely for the purpose of providing variant analysis services as instructed by the data controller (laboratory). We do not use genomic data for marketing, profiling, automated decision-making, or any purpose beyond the contracted analysis services.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">4. Data Storage and Security</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>
                All data is processed and stored on dedicated servers located in <strong className="text-foreground">Helsinki, Finland</strong> (Hetzner Online GmbH), within the European Union. No personal or genomic data is transferred outside the EU/EEA.
              </p>
              <p>We implement the following technical and organizational measures: TLS 1.3 encryption for all data in transit; AES-256 encryption for data at rest; role-based access control with principle of least privilege; complete audit trails for all data access and processing operations; network isolation with firewall rules restricting access to authorized services; regular security assessments and vulnerability monitoring; and bcrypt password hashing for authentication credentials.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">5. Data Retention</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>
                <strong className="text-foreground">Genomic data:</strong> retained for the duration specified in the DPA with each laboratory partner. Default retention period is 90 days after analysis completion, after which data is automatically and permanently deleted. Laboratories may request immediate deletion at any time.
              </p>
              <p>
                <strong className="text-foreground">Account data:</strong> retained for the duration of the active account and for 12 months following account closure for audit purposes.
              </p>
              <p>
                <strong className="text-foreground">Audit logs:</strong> retained for 24 months to comply with regulatory requirements and then permanently deleted.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">6. Data Subject Rights</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>Under GDPR, individuals have the following rights regarding their personal data: the right of access (Article 15), the right to rectification (Article 16), the right to erasure (Article 17), the right to restriction of processing (Article 18), the right to data portability (Article 20), and the right to object (Article 21).</p>
              <p>For genomic data where the laboratory is the data controller, data subject requests should be directed to the laboratory. We will assist the laboratory in fulfilling such requests in accordance with our DPA.</p>
              <p>To exercise your rights regarding account data, contact us at privacy@helena.bio. We will respond within 30 days.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">7. Sub-processors</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>We use the following sub-processors:</p>
              <p>
                <strong className="text-foreground">Hetzner Online GmbH</strong> (Gunzenhausen, Germany) for dedicated server infrastructure located in Helsinki, Finland. Hetzner processes data solely for hosting purposes and maintains ISO 27001 certification.
              </p>
              <p>
                <strong className="text-foreground">Vercel Inc.</strong> (San Francisco, USA) for hosting our marketing website and application frontend. Vercel processes only usage data (no genomic data). Data processing is covered by Standard Contractual Clauses.
              </p>
              <p>We will notify data controllers of any intended changes to sub-processors, providing the opportunity to object.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">8. Data Breach Notification</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>In the event of a personal data breach, we will notify the relevant data controller without undue delay and no later than 24 hours after becoming aware of the breach. Where required, we will notify the Bulgarian Commission for Personal Data Protection (CPDP) within 72 hours in accordance with GDPR Article 33.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">9. Cookies</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>Our platform uses only essential cookies required for authentication and session management. We do not use advertising cookies, tracking cookies, or third-party analytics. No cookie consent banner is required as we use only strictly necessary cookies exempt under the ePrivacy Directive.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">10. Changes to This Policy</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>We may update this Privacy Policy to reflect changes in our practices or applicable law. Material changes will be communicated to registered users via email. The &quot;Last updated&quot; date at the top indicates the most recent revision.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">11. Contact and Supervisory Authority</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>For any data protection inquiries, contact our Data Protection Officer at privacy@helena.bio.</p>
              <p>You have the right to lodge a complaint with the Bulgarian Commission for Personal Data Protection (CPDP): 2 Prof. Tsvetan Lazarov Blvd., Sofia 1592, Bulgaria, kzld@cpdp.bg, www.cpdp.bg.</p>
            </div>
          </section>

        </article>
      </main>
      <Footer />
    </div>
  )
}
