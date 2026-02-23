import Link from 'next/link'

export const metadata = {
  title: 'Capabilities | Helix Insight Documentation',
  description: 'What Helix AI can do: conversational variant analysis, literature search, clinical interpretation, report generation, and intelligent visualization.',
}

export default function CapabilitiesPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/ai-assistant" className="hover:text-primary transition-colors">AI Clinical Assistant</Link>
          {' / '}
          <span className="text-foreground">Capabilities</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Capabilities</h1>
      </div>

      <section className="space-y-3">
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix AI combines clinical genetics expertise with direct access to patient data and biomedical literature. It can answer questions about the current case, search for relevant publications, generate clinical reports, and suggest data visualizations -- all within a single conversational interface.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Conversational Variant Analysis</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The assistant can query the patient's variant database using natural language. Questions are automatically translated to SQL and executed against the classified variants (typically 2-3 million per case, 70 columns per variant). Results are filtered to clinically essential columns and formatted for efficient analysis.
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            '"Show me all pathogenic variants in cardiac genes"',
            '"How many VUS have a gnomAD frequency below 0.01%?"',
            '"List frameshift variants in genes with pLI above 0.9"',
            '"What is the ACMG classification breakdown for chromosome 17?"',
            '"Find compound heterozygote candidates in metabolic genes"',
          ].map((q, i) => (
            <p key={i} className="text-md text-muted-foreground italic">{q}</p>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Literature Search</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The assistant searches a local biomedical literature database containing over 1 million publications, 400,000 gene mentions, and 100,000 variant mentions. Literature queries run against this local mirror -- no external API calls are made during the search.
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            '"What does the literature say about SCN1A and epilepsy?"',
            '"Find recent publications mentioning BRCA1 pathogenic variants"',
            '"Are there any case reports for this specific HGVS notation?"',
            '"What is the evidence for this gene in cardiomyopathy?"',
          ].map((q, i) => (
            <p key={i} className="text-md text-muted-foreground italic">{q}</p>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Clinical Interpretation</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The assistant can generate a comprehensive clinical interpretation report for the current case. The report synthesizes ACMG classification results, phenotype correlation, screening priorities, and literature evidence into a structured diagnostic narrative. See <Link href="/docs/ai-assistant/clinical-interpretation" className="text-primary hover:underline">Clinical Interpretation</Link> for details on interpretation levels and report structure.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Report Generation</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Clinical interpretations can be exported as branded PDF or DOCX reports. PDF reports use Helix Insight branding with proper page headers, footers, page numbers, and a "CONFIDENTIAL" watermark. DOCX reports provide editable Word documents for further customization before distribution.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Intelligent Visualization</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          When the assistant executes a database query, it analyzes the results and suggests an appropriate visualization. The suggestion is genomics-aware: ACMG classification queries get pie charts with standard pathogenicity colors, chromosome distribution queries get genomically-sorted bar charts, and gene constraint queries can get scatter plots with clinical priority quadrants.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Query Type</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Visualization</th>
              </tr>
            </thead>
            <tbody>
              {[
                { query: 'ACMG classification breakdown', viz: 'Pie chart with pathogenicity colors' },
                { query: 'Variant impact distribution', viz: 'Severity-ordered bar chart (HIGH to MODIFIER)' },
                { query: 'Variants per chromosome', viz: 'Genomically-sorted bar chart (chr1-22, X, Y, M)' },
                { query: 'Top genes by variant count', viz: 'Bar chart with optional pLI constraint overlay' },
                { query: 'Gene constraint vs. frequency', viz: 'Scatter plot with clinical priority quadrants' },
                { query: 'Specific variant details', viz: 'Sortable, exportable data table' },
              ].map((row, i) => (
                <tr key={i} className={i < 5 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.query}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.viz}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Clinical Knowledge</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Even without querying databases, the assistant has extensive clinical genetics knowledge covering ACMG/AMP classification guidelines, Mendelian inheritance patterns, gene-disease associations, population genetics principles, HPO ontology, and functional predictor interpretation. It can explain why a specific ACMG criterion was triggered, discuss inheritance modes for a gene, or clarify the clinical significance of a computational prediction score.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What the Assistant Does Not Do</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'It does not make clinical diagnoses. The assistant provides analysis and interpretation support, but all findings require validation by a qualified clinical geneticist.',
            'It does not modify variant classifications. ACMG classifications are determined by the automated pipeline and can only be overridden by the reviewing geneticist.',
            'It does not access external databases during conversation. All queries run against local data that was loaded during the analysis pipeline.',
            'It does not retain information between separate analysis sessions. Each case has its own isolated context.',
            'It does not reclassify variants or substitute its own ACMG assessment for the pipeline\'s classification.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
              <p className="text-md text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
