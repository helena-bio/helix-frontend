import Link from 'next/link'

export const metadata = {
  title: 'Asking Questions | Helix Insight Documentation',
  description: 'How to interact with Helix AI effectively -- question patterns, tool invocation, multi-turn conversations, and phenotype-driven analysis.',
}

export default function AskingQuestionsPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/ai-assistant" className="hover:text-primary transition-colors">AI Clinical Assistant</Link>
          {' / '}
          <span className="text-foreground">Asking Questions</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Asking Questions</h1>
      </div>

      <section className="space-y-3">
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix AI responds to natural language questions about the current case. It automatically decides whether to answer from its clinical knowledge, query the patient variant database, or search the biomedical literature. Understanding how the assistant makes these decisions helps you get better results.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">When the Assistant Queries the Database</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The assistant automatically queries the variant database when your question involves specific data about this patient's variants. It does not query for general genetics knowledge or conceptual explanations.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Triggers Database Query</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Answers Directly</th>
              </tr>
            </thead>
            <tbody>
              {[
                { query: '"Show me pathogenic variants in BRCA1"', direct: '"What does ACMG stand for?"' },
                { query: '"How many VUS are on chromosome 7?"', direct: '"Explain the PP3 criterion"' },
                { query: '"List genes with pLI above 0.9"', direct: '"What is autosomal dominant inheritance?"' },
                { query: '"What is the gnomAD frequency of the TP53 variant?"', direct: '"Why is population frequency important?"' },
              ].map((row, i) => (
                <tr key={i} className={i < 3 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md text-muted-foreground italic">{row.query}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground italic">{row.direct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Effective Question Patterns</p>
        <div className="space-y-3">
          {[
            { pattern: 'Specific Filtering', example: '"Show me missense variants in cardiac genes with gnomAD frequency below 0.01% and DANN score above 0.95"', why: 'Precise filters produce focused results. The assistant translates each condition into SQL WHERE clauses.' },
            { pattern: 'Aggregation', example: '"How many variants per ACMG class are there on each chromosome?"', why: 'The assistant generates GROUP BY queries and suggests appropriate visualizations for the aggregated data.' },
            { pattern: 'Phenotype-Driven', example: '"Given the patient\'s seizure phenotype, which genes should I focus on?"', why: 'The assistant uses its gene-phenotype knowledge to identify candidate genes (SCN1A, SCN2A, KCNQ2, etc.), then checks the variant data for those genes.' },
            { pattern: 'Follow-Up', example: '"Now show me the literature evidence for that gene"', why: 'The assistant maintains conversation context. "That gene" resolves to the gene discussed in the previous response.' },
            { pattern: 'Clinical Correlation', example: '"Are any of the Tier 1 phenotype matches in ACMG Secondary Findings genes?"', why: 'Cross-referencing different analysis modules helps identify clinically actionable findings.' },
          ].map((item) => (
            <div key={item.pattern} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.pattern}</p>
              <p className="text-md text-muted-foreground italic">{item.example}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.why}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Multi-Turn Conversations</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The assistant maintains a conversation window of the last 20 messages. This enables multi-turn investigations where each question builds on previous findings. A typical diagnostic workflow might follow this pattern:
        </p>
        <div className="space-y-3">
          {[
            { turn: 1, msg: '"What are the pathogenic and likely pathogenic variants in this case?"', what: 'The assistant queries the database for P/LP variants and presents them with key annotations.' },
            { turn: 2, msg: '"Tell me more about the MYBPC3 variant"', what: 'The assistant provides detailed information about the specific variant, including ACMG criteria, population frequency, and functional predictions.' },
            { turn: 3, msg: '"What does the literature say about this variant?"', what: 'The assistant searches the literature database for publications mentioning MYBPC3 and the specific variant notation.' },
            { turn: 4, msg: '"Does the phenotype match support this as the causative variant?"', what: 'The assistant checks the phenotype matching results for MYBPC3 and discusses the correlation with the patient\'s clinical presentation.' },
            { turn: 5, msg: '"Generate the clinical interpretation report"', what: 'The assistant produces a comprehensive diagnostic report synthesizing all findings from the conversation and analysis modules.' },
          ].map((item) => (
            <div key={item.turn} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-md font-semibold text-primary">{item.turn}</span>
              </div>
              <div className="space-y-1">
                <p className="text-md text-muted-foreground italic">{item.msg}</p>
                <p className="text-md text-muted-foreground leading-relaxed">{item.what}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Chained Tool Execution</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          A single question can trigger up to five sequential tool calls. The assistant decides when to chain tools based on the complexity of the question. For example, asking "Find all pathogenic variants in constrained genes and check the literature for each" may trigger a variant database query followed by multiple literature searches -- all within one response.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Tips for Best Results</p>
        <div className="space-y-2">
          {[
            'Be specific about what you want to see. "Show pathogenic missense variants" produces better results than "show me some interesting variants".',
            'Use clinical terminology naturally. The assistant understands ACMG classes, HPO terms, gene symbols, HGVS notation, and genomic coordinates.',
            'Ask follow-up questions to drill down. The assistant remembers context and resolves references like "that gene" or "those variants" from previous responses.',
            'For complex analysis, break it into steps. First find the variants, then check the literature, then correlate with phenotype.',
            'If the assistant misunderstands a query, rephrase with more specific criteria. Adding explicit column names or thresholds helps the SQL generator produce accurate queries.',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
              <p className="text-md text-muted-foreground">{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
