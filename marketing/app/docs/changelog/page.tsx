import Link from 'next/link'

export const metadata = {
  title: 'Changelog | Helix Insight Documentation',
  description: 'Version history and release notes for the Helix Insight platform.',
}

const releases = [
  {
    version: '1.0.0',
    date: 'February 2026',
    label: 'Initial Release',
    changes: [
      { category: 'Classification', items: [
        'ACMG/AMP 2015 classification with Bayesian point-based framework (Tavtigian 2018/2020)',
        '19 of 28 ACMG criteria automated',
        'BayesDel_noAF with ClinGen SVI-calibrated thresholds for PP3/BP4 (Pejaver 2022)',
        'SpliceAI integration for PP3_splice with PVS1 double-counting prevention',
        'ClinVar override logic with review star quality filtering',
        'Gene-specific VCEP threshold support',
      ]},
      { category: 'Reference Databases', items: [
        'gnomAD v4.1 (759M variants, 807K individuals)',
        'gnomAD Constraint v4.1 (18.2K genes)',
        'ClinVar 2025-01',
        'dbNSFP 4.9c',
        'SpliceAI precomputed (Ensembl MANE Release 113)',
        'HPO gene-phenotype associations',
        'ClinGen dosage sensitivity',
        'Ensembl VEP Release 113 with local offline cache',
      ]},
      { category: 'Phenotype Matching', items: [
        'Lin semantic similarity with HPO ontology graph',
        'Five-tier clinical priority system',
        'Gene-level deduplication and aggregation',
        'Automatic HPO term extraction from free-text clinical descriptions',
      ]},
      { category: 'Screening', items: [
        'Seven-component scoring algorithm (constraint, deleteriousness, phenotype, dosage, consequence, compound het, age relevance)',
        'Six screening modes (diagnostic, neonatal, pediatric, proactive adult, carrier, pharmacogenomics)',
        'Age-aware prioritization with curated gene lists',
        'Clinical boosts for ethnicity, family history, sex-linked inheritance, consanguinity, pregnancy',
        'Four-tier priority ranking with clinical actionability labels',
      ]},
      { category: 'AI Clinical Assistant', items: [
        'Conversational variant analysis with natural language database queries',
        'Biomedical literature search (1M+ publications, local PubMed mirror)',
        'Four-level adaptive clinical interpretation generation',
        'PDF and DOCX report export with Helix Insight branding',
        'Genomics-aware visualization suggestions',
        'On-premise LLM inference within EU infrastructure',
      ]},
      { category: 'Infrastructure', items: [
        'EU-based processing (Helsinki, Finland)',
        'All databases stored and queried locally',
        'Zero external API calls during variant processing',
        'GDPR-compliant data handling',
        'DuckDB-based analytical pipeline',
      ]},
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <span className="text-foreground">Changelog</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Changelog</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          Version history and release notes for the Helix Insight platform.
        </p>
      </div>

      {releases.map((release) => (
        <section key={release.version} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-base font-semibold rounded bg-primary/10 text-primary">v{release.version}</span>
            <span className="text-md text-muted-foreground">{release.date}</span>
            <span className="text-md font-medium text-foreground">{release.label}</span>
          </div>

          {release.changes.map((group) => (
            <div key={group.category} className="space-y-2">
              <p className="text-lg font-semibold text-foreground">{group.category}</p>
              <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                {group.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
                    <p className="text-md text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
