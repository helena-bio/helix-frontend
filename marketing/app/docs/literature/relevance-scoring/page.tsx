import Link from 'next/link'

export const metadata = {
  title: 'Relevance Scoring | Helix Insight Documentation',
  description: 'Six-component weighted scoring system for ranking literature publications by clinical relevance.',
}

const components = [
  { name: 'Phenotype', weight: '30%', desc: 'Measures how many of the patient\u2019s HPO terms are mentioned in the publication. Uses morphological matching (stemming) so that "seizure" matches "seizures" and "epileptic" matches "epilepsy". Score equals the fraction of patient HPO terms found in the title and abstract.' },
  { name: 'Publication Type', weight: '20%', desc: 'Prioritizes study types with the highest clinical relevance for variant interpretation. Case reports receive the highest score because they directly describe patient phenotypes and variant associations.' },
  { name: 'Gene Centrality', weight: '15%', desc: 'Measures how prominently the query gene is discussed in the publication, based on mention frequency. A paper mentioning the gene 20+ times is likely focused on that gene, while a single mention may be incidental.' },
  { name: 'Functional Data', weight: '15%', desc: 'Detects the presence of functional studies -- animal models (zebrafish, mouse), knockout experiments, cell line assays, and molecular biology techniques. Functional evidence is critical for ACMG PS3 criterion assessment.' },
  { name: 'Variant Match', weight: '10%', desc: 'Awards a bonus when the exact variant notation is found in the publication. An exact match (1.0) indicates the specific variant has been studied; a gene-only match (0.3) indicates relevance at the gene level.' },
  { name: 'Recency', weight: '10%', desc: 'More recent publications are scored higher using linear decay over 10 years. A 2025 publication scores 1.0; a 2015 publication scores approximately 0.0. This reflects the evolving understanding of variant pathogenicity.' },
]

export default function RelevanceScoringPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/literature" className="hover:text-primary transition-colors">Literature Evidence</Link>
          {' / '}
          <span className="text-foreground">Relevance Scoring</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Relevance Scoring</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          Each candidate publication is scored from 0.0 to 1.0 using a six-component weighted system optimized for ACMG evidence assessment. The total score determines the publication&apos;s rank in search results.
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Six Scoring Components</p>
        <div className="space-y-3">
          {components.map((c) => (
            <div key={c.name} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primary">{c.weight}</span>
                <span className="text-base font-medium text-foreground">{c.name}</span>
              </div>
              <p className="text-md text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Publication Type Scoring</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium text-foreground">Publication Type</th>
                <th className="text-left py-2 pr-3 font-medium text-foreground">Score</th>
                <th className="text-left py-2 font-medium text-foreground">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Case Report', score: '1.0', rationale: 'Directly describes patient phenotypes and variant associations' },
                { type: 'Clinical Trial', score: '0.9', rationale: 'Strong clinical evidence with structured methodology' },
                { type: 'Research Article', score: '0.7', rationale: 'Original research contributing new findings' },
                { type: 'Journal Article', score: '0.5', rationale: 'General scientific publication' },
                { type: 'Review', score: '0.3', rationale: 'Secondary source, lower novelty for classification' },
              ].map((row) => (
                <tr key={row.type} className="border-b border-border/50">
                  <td className="py-2 pr-3 text-md text-foreground">{row.type}</td>
                  <td className="py-2 pr-3 text-md text-muted-foreground">{row.score}</td>
                  <td className="py-2 text-md text-muted-foreground">{row.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Gene Centrality Scoring</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium text-foreground">Mention Count</th>
                <th className="text-left py-2 font-medium text-foreground">Score</th>
              </tr>
            </thead>
            <tbody>
              {[
                { count: '20 or more', score: '1.0' },
                { count: '10-19', score: '0.8' },
                { count: '5-9', score: '0.6' },
                { count: '2-4', score: '0.4' },
                { count: '1', score: '0.2' },
              ].map((row) => (
                <tr key={row.count} className="border-b border-border/50">
                  <td className="py-2 pr-3 text-md text-foreground">{row.count}</td>
                  <td className="py-2 text-md text-muted-foreground">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Morphological Matching</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Phenotype matching uses stemming (NLTK SnowballStemmer, English) to handle morphological variations in clinical language. The stem of each HPO term name is compared against stemmed words in the publication title and abstract. This ensures that &quot;seizure&quot; matches &quot;seizures&quot;, &quot;epileptic&quot; matches &quot;epilepsy&quot;, and &quot;developmental&quot; matches &quot;development&quot; without requiring exact string matches.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Score Interpretation</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-24">0.7 - 1.0</span>
            <span className="text-md text-muted-foreground">Highly relevant -- strong phenotype match, relevant study type, prominent gene discussion</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-24">0.4 - 0.7</span>
            <span className="text-md text-muted-foreground">Moderately relevant -- partial phenotype overlap or relevant gene without phenotype match</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-24">0.1 - 0.4</span>
            <span className="text-md text-muted-foreground">Low relevance -- gene mentioned but limited clinical overlap. Included for completeness.</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-24">Below 0.1</span>
            <span className="text-md text-muted-foreground">Filtered out -- insufficient relevance for clinical review</span>
          </div>
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Parallel Scoring</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Relevance scoring runs across 16 parallel workers, enabling the platform to score thousands of candidate publications in under 500 milliseconds. Each worker is pre-initialized with the stemming engine to eliminate per-request overhead.
        </p>
      </section>
    </div>
  )
}
