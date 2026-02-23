import Link from 'next/link'

export const metadata = {
  title: 'AI Clinical Assistant | Helix Insight Documentation',
  description: 'Helix AI -- a clinical genetics assistant powered by Qwen3-32B that queries patient variants, searches literature, generates interpretations, and produces clinical reports.',
}

const subpages = [
  { href: '/docs/ai-assistant/capabilities', title: 'Capabilities', description: 'What Helix AI can do: variant queries, literature search, clinical interpretation, report generation, and visualization.' },
  { href: '/docs/ai-assistant/asking-questions', title: 'Asking Questions', description: 'How to interact with the AI assistant effectively -- question patterns, tool invocation, and multi-turn conversations.' },
  { href: '/docs/ai-assistant/clinical-interpretation', title: 'Clinical Interpretation', description: 'AI-generated diagnostic reports with four interpretation levels, structured headers, and legal disclaimers.' },
  { href: '/docs/ai-assistant/database-queries', title: 'Database Queries', description: 'Natural language to SQL translation against patient variant and biomedical literature databases.' },
]

export default function AiAssistantOverviewPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <span className="text-foreground">AI Clinical Assistant</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">AI Clinical Assistant</h1>
      </div>

      <section className="space-y-3">
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix AI is a clinical genetics assistant embedded in the Helix Insight platform. It provides conversational access to patient variant data, biomedical literature, and automated clinical interpretation -- all through natural language. The assistant is designed for geneticists and clinical laboratory professionals who need to interrogate genomic analysis results, correlate findings with clinical phenotype, and produce diagnostic reports.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The assistant runs on Qwen3-32B, a large language model hosted entirely on EU-based infrastructure. No patient data is sent to external AI services. All inference happens on-premise through a secure internal connection.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">How It Works</p>
        <div className="space-y-3">
          {[
            { step: 1, label: 'Context Loading', desc: 'When a conversation starts, the assistant loads the complete analysis context for the current case: ACMG classifications, pathogenic variants, phenotype matching results, screening tiers, clinical profile, and any previously generated interpretation.' },
            { step: 2, label: 'Natural Language Interaction', desc: 'The geneticist asks questions in natural language. The assistant can answer directly from its clinical knowledge, or invoke tools to query the patient database or search the literature database.' },
            { step: 3, label: 'Tool Execution', desc: 'When a question requires data, the assistant automatically translates it to SQL, executes it against the appropriate database, and incorporates the results into its response. Up to five sequential tool calls can be chained in a single interaction.' },
            { step: 4, label: 'Streaming Response', desc: 'Responses are streamed in real-time via Server-Sent Events. Text appears token by token, with structured events for query results, literature findings, and visualization suggestions.' },
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
        <p className="text-lg font-semibold text-foreground">Key Principles</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'The assistant only discusses genes and variants that are present in the patient\'s data. It does not invent findings or add textbook examples that are not in the actual results.',
            'All responses are grounded in the analysis data. When the assistant references a variant, it has either seen it in the loaded context or queried it from the database.',
            'The assistant uses a phenotype-first approach: it considers the patient\'s clinical presentation to identify candidate genes, then checks whether those genes appear in the variant data.',
            'Clinical interpretation reports clearly separate AI-generated content from template-based sections (patient demographics, legal disclaimer). The AI never fabricates patient information.',
            'Conversation history is maintained for 24 hours in an encrypted cache, enabling multi-turn discussions that build on previous questions and findings.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
              <p className="text-md text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">On-Premise AI</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Helix AI runs on Qwen3-32B hosted on dedicated GPU infrastructure within the EU. The model is accessed through a secure internal tunnel -- no patient data leaves the server environment. This architecture ensures full GDPR compliance while providing the clinical reasoning capabilities of a large language model.
        </p>
      </section>

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
    </div>
  )
}
