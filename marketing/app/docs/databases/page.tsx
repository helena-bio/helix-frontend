import Link from 'next/link'

export const metadata = {
  title: 'Reference Databases | Helix Insight Documentation',
  description: 'Reference databases used in Helix Insight -- gnomAD, ClinVar, dbNSFP, HPO, ClinGen, Ensembl VEP, and SpliceAI precomputed scores.',
}

const subpages = [
  { href: '/docs/databases/gnomad', title: 'gnomAD', description: 'Population allele frequencies from 807,162 individuals across 8 genetic ancestry groups.' },
  { href: '/docs/databases/clinvar', title: 'ClinVar', description: 'Clinical significance assertions from submitting laboratories worldwide.' },
  { href: '/docs/databases/dbnsfp', title: 'dbNSFP', description: 'Functional predictions and conservation scores for all possible coding SNVs.' },
  { href: '/docs/databases/hpo', title: 'HPO', description: 'Gene-phenotype associations from the Human Phenotype Ontology.' },
  { href: '/docs/databases/clingen', title: 'ClinGen', description: 'Gene dosage sensitivity curation from the Clinical Genome Resource.' },
  { href: '/docs/databases/ensembl-vep', title: 'Ensembl VEP', description: 'Variant Effect Predictor for consequence annotation and transcript selection.' },
  { href: '/docs/databases/spliceai-precomputed', title: 'SpliceAI Precomputed', description: 'Precomputed splice impact delta scores for all coding variants.' },
  { href: '/docs/databases/database-update-policy', title: 'Update Policy', description: 'How and when reference databases are updated, validated, and versioned.' },
]

const databases = [
  { name: 'gnomAD', version: 'v4.1.0', records: '~759M variants', use: 'Population frequencies', criteria: 'BA1, BS1, BS2, PM2' },
  { name: 'ClinVar', version: '2025-01', records: '~4.1M variants', use: 'Clinical significance', criteria: 'PS1, PP5, BP6, ClinVar override' },
  { name: 'dbNSFP', version: '4.9c', records: '~80.6M sites', use: 'Functional predictions', criteria: 'PP3, BP4 (BayesDel_noAF)' },
  { name: 'SpliceAI', version: 'MANE R113', records: 'All coding variants', use: 'Splice impact', criteria: 'PP3_splice, BP7 guard' },
  { name: 'gnomAD Constraint', version: 'v4.1.0', records: '~18.2K genes', use: 'Gene-level tolerance', criteria: 'PVS1, PP2, BP1' },
  { name: 'HPO', version: 'Latest release', records: '~320K associations', use: 'Gene-phenotype mapping', criteria: 'PP4' },
  { name: 'ClinGen', version: 'Latest release', records: '~1.6K genes', use: 'Dosage sensitivity', criteria: 'BS1, BP2' },
  { name: 'Ensembl VEP', version: 'Release 113', records: 'All consequences', use: 'Variant effect prediction', criteria: 'PVS1, PM1, PM4, BP1, BP3, BP7' },
]

export default function DatabasesPage() {
  return (
    <div className="py-10 space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">Reference Databases</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix Insight uses eight reference databases for variant annotation and ACMG classification. All databases are stored locally on EU-based infrastructure in Helsinki, Finland. No variant data is sent to external APIs during processing.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Database versions are fixed per deployment. Each version undergoes validation testing before production deployment to ensure consistency with expected classification outcomes. The current versions and their roles in ACMG classification are documented below.
        </p>
      </section>

      {/* Key principle */}
      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Zero External API Calls</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          During variant processing, Helix Insight makes zero external API calls. All reference databases are stored locally. Ensembl VEP runs with a local cache. No patient data leaves the server at any processing stage.
        </p>
      </section>

      {/* Database summary table */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Database Summary</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium text-foreground">Database</th>
                <th className="text-left py-2 pr-3 font-medium text-foreground">Version</th>
                <th className="text-left py-2 pr-3 font-medium text-foreground">Records</th>
                <th className="text-left py-2 pr-3 font-medium text-foreground">Primary Use</th>
                <th className="text-left py-2 font-medium text-foreground">ACMG Criteria</th>
              </tr>
            </thead>
            <tbody>
              {databases.map((db) => (
                <tr key={db.name} className="border-b border-border/50">
                  <td className="py-2 pr-3 text-md text-foreground">{db.name}</td>
                  <td className="py-2 pr-3 text-md text-muted-foreground">{db.version}</td>
                  <td className="py-2 pr-3 text-md text-muted-foreground">{db.records}</td>
                  <td className="py-2 pr-3 text-md text-muted-foreground">{db.use}</td>
                  <td className="py-2 text-md text-muted-foreground">{db.criteria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Annotation pipeline */}
      <section className="space-y-4">
        <p className="text-lg font-semibold text-foreground">Annotation Pipeline</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Reference data is loaded into each variant record during Stage 4 of the processing pipeline. After annotation, every variant carries all reference columns directly -- no database lookups are needed during classification or clinical review. The annotation order is:
        </p>
        <div className="space-y-3">
          {[
            { phase: 1, label: 'gnomAD v4.1', desc: 'Population allele frequencies. Positional match on chromosome, position, reference allele, and alternate allele. Loads 6 columns.' },
            { phase: 2, label: 'ClinVar', desc: 'Clinical significance assertions. Same positional match. Loads 7 columns including review stars and disease associations.' },
            { phase: 3, label: 'dbNSFP 4.9c', desc: 'Functional predictions from SIFT, AlphaMissense, MetaSVM, DANN, BayesDel, and conservation scores. Loads 9 columns with duplicate variant aggregation.' },
            { phase: 4, label: 'gnomAD Constraint', desc: 'Gene-level tolerance metrics. Joined on gene symbol. Loads 4 columns: pLI, LOEUF, o/e LoF, and missense Z-score.' },
            { phase: 5, label: 'HPO', desc: 'Gene-phenotype associations. Joined on gene symbol with deduplication and aggregation. Loads 6 columns.' },
            { phase: 6, label: 'ClinGen', desc: 'Dosage sensitivity scores. Joined on gene symbol. Loads 2 columns: haploinsufficiency and triplosensitivity.' },
          ].map((item) => (
            <div key={item.phase} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-md font-semibold text-primary">{item.phase}</span>
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-foreground">{item.label}</p>
                <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-md text-muted-foreground leading-relaxed">
          Ensembl VEP runs as a separate stage (Stage 3) before database annotation, providing consequence predictions and transcript selection that the annotation phases then build upon. SpliceAI scores are accessed from precomputed data during VEP annotation.
        </p>
      </section>

      {/* Subpages */}
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

      <p className="text-md text-muted-foreground">
        For details on how these databases are combined during ACMG classification, see the <Link href="/docs/classification/criteria-reference" className="text-primary hover:underline font-medium">Criteria Reference</Link>.
      </p>
    </div>
  )
}
