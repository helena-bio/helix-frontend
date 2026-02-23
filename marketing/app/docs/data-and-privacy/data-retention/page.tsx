import Link from 'next/link'

export const metadata = {
  title: 'Data Retention | Helix Insight Documentation',
  description: 'What data Helix Insight retains, for how long, and how deletion works.',
}

export default function DataRetentionPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/data-and-privacy" className="hover:text-primary transition-colors">Data and Privacy</Link>
          {' / '}
          <span className="text-foreground">Data Retention</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Data Retention</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          Helix Insight follows the principle of data minimization: we process only what is necessary and retain data only for as long as required. This page describes what data is kept, for how long, and how deletion works.
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Retention by Data Type</p>
        <div className="space-y-3">
          {[
            { type: 'Uploaded VCF Files', retention: 'Deleted after processing completes', desc: 'The original VCF file uploaded by the laboratory is deleted from the server once variant parsing, annotation, and classification are complete. The file is not retained for future use. If re-analysis is needed, the laboratory uploads the file again.' },
            { type: 'Analysis Results', retention: 'Duration specified in service agreement', desc: 'Classified variants, ACMG evidence, phenotype match scores, screening tiers, and literature evidence are retained as a structured database (DuckDB) for the duration agreed with the laboratory. This allows geneticists to return to previous cases for review without re-processing.' },
            { type: 'Clinical Profile Data', retention: 'Retained alongside analysis results', desc: 'Patient phenotype (HPO terms), demographics (age, sex, ethnicity when provided), and clinical context are stored alongside the analysis results. These are deleted when the analysis session is deleted.' },
            { type: 'Literature Search Results', retention: 'Retained alongside analysis results', desc: 'Ranked literature publications with relevance scores and evidence categories are stored as part of the session output. Deleted with the session.' },
            { type: 'Session Metadata', retention: 'Retained for audit purposes', desc: 'Processing timestamps, pipeline parameters, database versions used, and quality metrics are retained for audit trail compliance. These contain no genomic data.' },
            { type: 'Account Data', retention: 'Duration of the service agreement', desc: 'User name, email, organization, and role are retained while the account is active. Deleted within 30 days of account termination or on request.' },
            { type: 'Usage Data', retention: 'Maximum 12 months', desc: 'IP addresses, session logs, and page views are retained for security monitoring for up to 12 months, then automatically purged.' },
          ].map((item) => (
            <div key={item.type} className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-medium text-foreground">{item.type}</span>
                <span className="text-sm text-primary shrink-0">{item.retention}</span>
              </div>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Deletion Mechanisms</p>
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-base font-medium text-foreground">Automatic Deletion</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              VCF files are automatically deleted after processing completes. Analysis sessions that exceed the agreed retention period are automatically purged. No manual intervention is required.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-base font-medium text-foreground">On-Demand Deletion</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              The laboratory (data controller) can request deletion of any analysis session at any time. Helena Bioinformatics will delete all associated data (results, clinical profile, literature evidence, metadata) within 30 days and certify the deletion in writing.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-base font-medium text-foreground">Data Subject Erasure (Article 17)</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              Data subjects (patients) can exercise their right to erasure through the data controller (laboratory). Helena Bioinformatics assists in fulfilling these requests. Deletion may be subject to legal retention requirements (e.g., clinical record-keeping obligations under national legislation).
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-base font-medium text-foreground">Termination Deletion</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              Upon termination of the service agreement, all personal data is either returned to the data controller or securely deleted within 30 days, at the controller&apos;s election. Deletion is certified in writing per the DPA.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What Is NOT Retained</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'Patient names, dates of birth, or national identification numbers (never received)',
            'Original VCF files after processing (automatically deleted)',
            'Raw sequencing data (FASTQ, BAM -- not accepted by the platform)',
            'Intermediate processing files (temporary and deleted after each pipeline stage)',
          ].map((item) => (
            <p key={item} className="text-md text-muted-foreground">{item}</p>
          ))}
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Audit Trail</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Every deletion event is logged in the audit trail: what was deleted, when, by whom (or automatically), and the reason. Audit logs themselves are retained for the minimum period required by applicable legislation and do not contain genomic data.
        </p>
      </section>
    </div>
  )
}
