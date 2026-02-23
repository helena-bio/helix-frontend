import Link from 'next/link'

export const metadata = {
  title: 'Literature Evidence | Helix Insight Documentation',
  description: 'How Helix Insight searches, scores, and presents literature evidence for clinical variant interpretation.',
}

export default function LiteratureEvidencePage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/literature" className="hover:text-primary transition-colors">Literature Evidence</Link>
          {' / '}
          <span className="text-foreground">Literature Evidence</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Literature Evidence</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          Literature evidence supports variant classification by identifying published studies that describe the same gene, variant, or phenotype. The platform automates what would otherwise require hours of manual PubMed searching per variant, producing ranked results with transparent scoring in under 500 milliseconds.
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What the Platform Extracts</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          During database ingestion, each genetics-relevant publication is processed to extract structured entities from free text:
        </p>
        <div className="space-y-3">
          {[
            { label: 'Gene Mentions', desc: 'Gene symbols identified in titles and abstracts, validated against the human protein-coding gene database. Each mention records the gene symbol, frequency count, and surrounding context. Strict validation eliminates false positives from abbreviations (DNA, HIV, PCR).' },
            { label: 'Variant Mentions', desc: 'Variant notations extracted using HGVS patterns (c.123A>G, p.Arg248Gln) and legacy notation (R248Q). Each variant is associated with the nearest gene mention in the text and includes the surrounding sentence for clinical context.' },
            { label: 'Phenotype Associations', desc: 'Phenotype terms from curated MeSH descriptors assigned by NLM indexers. These provide high-confidence phenotype mappings with HPO, OMIM, and MeSH identifiers.' },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.label}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Search Strategy</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          When a clinical literature search is triggered, the platform runs two complementary search strategies and merges the results:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Indexed Gene Lookup</p>
            <p className="text-md text-muted-foreground leading-relaxed">Direct query against the gene mentions index. Returns publications where the gene was identified and validated during ingestion. Fast (approximately 50ms) and high-precision.</p>
          </div>
          <div className="border-t border-border/50" />
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Full-Text Search</p>
            <p className="text-md text-muted-foreground leading-relaxed">Text search in titles and abstracts to catch mentions not captured by the gene extraction stage. Broader recall but lower precision. Limited to 10,000 results per query to maintain performance.</p>
          </div>
        </div>
        <p className="text-md text-muted-foreground leading-relaxed">
          Both result sets are merged and deduplicated. Each candidate publication is then enriched with all extracted entities (gene mentions, variant mentions, phenotype associations) before relevance scoring.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What Is Reported</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          For each relevant publication, the platform reports:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'Publication metadata: title, authors, journal, date, DOI, PubMed Central ID',
            'Abstract text for quick review without leaving the platform',
            'Six-component relevance score with individual score breakdown',
            'Evidence strength category (Strong, Moderate, Supporting, Weak)',
            'Matched genes, variants, and phenotypes highlighted',
            'Presence of functional study data (animal models, cell assays)',
            'Direct link to the full publication on PubMed',
          ].map((item) => (
            <p key={item} className="text-md text-muted-foreground leading-relaxed">{item}</p>
          ))}
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Advisory, Not Diagnostic</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Literature evidence categories are advisory. The geneticist must review the actual publications to determine whether they provide sufficient evidence for specific ACMG criteria. The platform identifies relevant papers and estimates their strength; the clinician determines their applicability to the specific case.
        </p>
      </section>

      <p className="text-md text-muted-foreground">
        For details on how publications are ranked, see <Link href="/docs/literature/relevance-scoring" className="text-primary hover:underline font-medium">Relevance Scoring</Link>.
      </p>
    </div>
  )
}
