import Link from 'next/link'

export const metadata = {
  title: 'Database Queries | Helix Insight Documentation',
  description: 'How Helix AI translates natural language to SQL and queries patient variant and biomedical literature databases.',
}

export default function DatabaseQueriesPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/ai-assistant" className="hover:text-primary transition-colors">AI Clinical Assistant</Link>
          {' / '}
          <span className="text-foreground">Database Queries</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Database Queries</h1>
      </div>

      <section className="space-y-3">
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix AI can query two databases through natural language: the patient's classified variant database and the biomedical literature database. The assistant automatically determines which database to query based on your question, generates SQL, executes it, and incorporates the results into its response.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Two Databases</p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Database</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Content</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Scale</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">Patient Variants</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Classified variants with ACMG annotations, population frequencies, functional predictions, phenotype matches, and screening scores.</td>
                <td className="px-4 py-2 text-md text-muted-foreground">~2.3M variants, 70 columns per variant</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md font-medium text-foreground">Biomedical Literature</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PubMed publications with gene mentions, variant mentions, abstracts, MeSH terms, and publication metadata.</td>
                <td className="px-4 py-2 text-md text-muted-foreground">1M+ publications, 400K gene mentions, 100K variant mentions</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">How Queries Work</p>
        <div className="space-y-3">
          {[
            { step: 1, label: 'Question Analysis', desc: 'The assistant determines whether the question requires a database query. Questions about specific patient data trigger a query; general genetics knowledge is answered directly.' },
            { step: 2, label: 'SQL Generation', desc: 'The question is sent to a specialized SQL generation module that translates natural language into DuckDB SQL. The generator uses a low temperature (0.1) for precise, deterministic output and has access to the complete database schema.' },
            { step: 3, label: 'Execution', desc: 'The SQL query runs against a read-only DuckDB connection with a 30-second timeout. All queries are read-only -- the assistant cannot modify patient data.' },
            { step: 4, label: 'Result Filtering', desc: 'For detail queries (specific variants), results are filtered to 20 clinically essential columns out of 70, reducing token usage by approximately 70%. Aggregation queries preserve all columns.' },
            { step: 5, label: 'Response Integration', desc: 'The assistant receives the query results and incorporates them into its clinical response, adding visualization suggestions for chart-appropriate data.' },
          ].map((item) => (
            <div key={item.step} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-md font-semibold text-primary">{item.step}</span>
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-foreground">{item.label}</p>
                <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Queryable Data</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The patient variant database contains 70 columns per variant. The most commonly queried fields include:
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Category</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Fields</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: 'Identity', fields: 'gene_symbol, chromosome, position, hgvs_protein, hgvs_cdna, rsid, transcript_id' },
                { cat: 'Classification', fields: 'acmg_class, acmg_criteria, confidence_score' },
                { cat: 'Consequence', fields: 'consequence, impact, biotype, exon_number, domains' },
                { cat: 'Population Frequency', fields: 'gnomad_af, gnomad_popmax, gnomad_popmax_af, gnomad_hom' },
                { cat: 'ClinVar', fields: 'clinvar_significance, clinvar_review_status, stars' },
                { cat: 'Functional Predictions', fields: 'sift_prediction, alphamissense_prediction, metasvm_prediction, dann_score' },
                { cat: 'Gene Constraint', fields: 'gene_pli, gene_oe_lof, gene_loeuf' },
                { cat: 'Phenotype', fields: 'hpo_terms, hpo_count, hpo_phenotypes' },
                { cat: 'Screening', fields: 'priority_score, priority_tier' },
              ].map((row, i) => (
                <tr key={i} className={i < 8 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.cat}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.fields}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Query Performance</p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Operation</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Typical Latency</th>
              </tr>
            </thead>
            <tbody>
              {[
                { op: 'SQL generation', latency: '1-3 seconds' },
                { op: 'Variant database query', latency: 'Under 200 milliseconds' },
                { op: 'Literature database query', latency: 'Under 500 milliseconds' },
                { op: 'Total (generation + execution)', latency: '2-4 seconds' },
              ].map((row, i) => (
                <tr key={i} className={i < 3 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.op}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Safety</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          All database access is strictly read-only. The assistant cannot insert, update, or delete any data. Query execution has a 30-second timeout to prevent runaway queries. Results are capped at a safe size limit to maintain responsive conversation flow.
        </p>
      </section>
    </div>
  )
}
