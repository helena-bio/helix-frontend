import { Header, Footer } from '@/components'

export const metadata = {
  title: 'Data Protection Impact Assessment | Helix Insight',
  description: 'DPIA summary for the Helix Insight genomic variant analysis platform.',
}

export default function DPIAPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-16 px-6">
        <article className="max-w-4xl mx-auto space-y-10">

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-primary">Data Protection Impact Assessment</h1>
            <p className="text-sm text-muted-foreground">Last updated: February 2026</p>
            <p className="text-base text-foreground leading-relaxed">
              This document provides a summary of the Data Protection Impact Assessment (DPIA) conducted by Helena Bioinformatics for the Helix Insight platform, pursuant to GDPR Article 35. A DPIA is mandatory when processing genetic data on a large scale, as it constitutes high-risk processing of special category data.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">1. Processing Description</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p><strong className="text-foreground">Nature of processing:</strong> automated analysis of genetic variant data (VCF files) uploaded by clinical genetics laboratories. Processing includes variant annotation against population and clinical databases, automated ACMG/AMP classification, phenotype-genotype correlation, biomedical literature mining, and generation of clinical interpretation reports.</p>
              <p><strong className="text-foreground">Scope:</strong> the platform processes whole-exome and whole-genome sequencing data containing thousands to millions of genetic variants per patient sample. Associated phenotype data (HPO terms) and clinical context are also processed.</p>
              <p><strong className="text-foreground">Context:</strong> the platform serves as a clinical decision support tool for qualified geneticists. It does not make autonomous clinical decisions. All outputs require professional review and validation.</p>
              <p><strong className="text-foreground">Purpose:</strong> to reduce variant interpretation time from days to minutes, improving laboratory throughput and consistency while maintaining clinical accuracy.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">2. Necessity and Proportionality</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p><strong className="text-foreground">Necessity:</strong> processing genetic variant data is essential to the core function of the platform. The service cannot be provided without processing VCF files. Phenotype data is necessary for clinical correlation and prioritization of variants.</p>
              <p><strong className="text-foreground">Proportionality:</strong> we process only the minimum data necessary. VCF files are received in pseudonymized form (sample IDs only, no patient names). We do not request or store directly identifying patient information. Phenotype data is limited to standardized HPO codes relevant to the clinical question. Data retention is time-limited with automatic deletion.</p>
              <p><strong className="text-foreground">Legal basis:</strong> for genomic data, the Data Controller (laboratory) relies on explicit consent (Article 9(2)(a)) or the healthcare provision exemption (Article 9(2)(h)). Helena Bioinformatics processes this data as Data Processor under contractual obligation (Article 6(1)(b)) and the DPA.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">3. Risk Assessment</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">

              <p><strong className="text-foreground">Risk 1: Unauthorized access to genetic data</strong></p>
              <p>Severity: High. Genetic data is immutable and uniquely identifying. Likelihood: Low. Mitigated by dedicated servers (not multi-tenant cloud), TLS 1.3 and AES-256 encryption, role-based access control, network firewall rules, and comprehensive audit logging. Residual risk: Low.</p>

              <p><strong className="text-foreground">Risk 2: Data breach during transit</strong></p>
              <p>Severity: High. Likelihood: Very Low. All data transmission uses TLS 1.3 encryption. VCF files are uploaded directly to our EU servers. No data transits through non-EU jurisdictions. Residual risk: Very Low.</p>

              <p><strong className="text-foreground">Risk 3: Re-identification of pseudonymized data</strong></p>
              <p>Severity: High. Genetic data is inherently identifying. Likelihood: Very Low. We receive only sample IDs, not patient identifiers. Our staff cannot link sample IDs to individuals. Access is restricted to automated processing pipelines. Residual risk: Very Low.</p>

              <p><strong className="text-foreground">Risk 4: Incorrect variant classification leading to clinical harm</strong></p>
              <p>Severity: High. Incorrect classification could affect patient care. Likelihood: Low. The platform is explicitly positioned as a decision support tool, not a diagnostic device. All outputs must be reviewed by qualified geneticists. The platform follows established ACMG/AMP guidelines and references validated databases (ClinVar, gnomAD). Regular validation against clinical benchmarks. Residual risk: Low (mitigated by mandatory human review).</p>

              <p><strong className="text-foreground">Risk 5: Excessive data retention</strong></p>
              <p>Severity: Medium. Likelihood: Very Low. Automatic deletion after configurable retention period (default 90 days). Data Controllers can request immediate deletion. Deletion processes are logged and auditable. Residual risk: Very Low.</p>

              <p><strong className="text-foreground">Risk 6: Sub-processor non-compliance</strong></p>
              <p>Severity: Medium. Likelihood: Very Low. Hetzner (infrastructure provider) maintains ISO 27001 certification and provides physical hosting only without logical data access. DPA in place with Hetzner. No sub-processors outside the EU process genomic data. Residual risk: Very Low.</p>

            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">4. Measures to Address Risks</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>The following technical and organizational measures are implemented:</p>
              <p><strong className="text-foreground">Technical measures:</strong> dedicated EU-based servers (Helsinki, Finland) with no multi-tenant sharing; TLS 1.3 encryption in transit and AES-256 at rest; role-based access control with principle of least privilege; JWT authentication with automatic session expiration; comprehensive audit trails for all data operations; automated data deletion based on configurable retention policies; network isolation with firewall restricting non-essential traffic; bcrypt password hashing; and regular vulnerability assessments.</p>
              <p><strong className="text-foreground">Organizational measures:</strong> Data Processing Agreements with all laboratory partners; confidentiality obligations for all personnel; documented security incident response procedures with 24-hour notification to Data Controllers; regular review and updating of security measures; sub-processor management with Data Controller notification; staff training on data protection obligations; and appointed Data Protection Officer.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">5. Conclusion</h2>
            <div className="text-base text-muted-foreground leading-relaxed space-y-3">
              <p>This DPIA concludes that the Helix Insight platform can process genetic data with an acceptable level of residual risk, provided all identified measures are maintained and regularly reviewed. The key factors supporting this conclusion are: data is received only in pseudonymized form; all processing occurs within the EU on dedicated infrastructure; encryption is applied both in transit and at rest; the platform functions as decision support requiring mandatory human review; and data retention is time-limited with automatic deletion.</p>
              <p>This DPIA will be reviewed annually or when significant changes are made to the processing activities, infrastructure, or regulatory landscape.</p>
              <p>For questions regarding this assessment, contact our Data Protection Officer at privacy@helena.bio.</p>
            </div>
          </section>

        </article>
      </main>
      <Footer />
    </div>
  )
}
