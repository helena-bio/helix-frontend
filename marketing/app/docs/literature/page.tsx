import Link from 'next/link'

export const metadata = {
  title: 'Literature Evidence | Helix Insight Documentation',
  description: 'How Helix Insight provides literature evidence from a local PubMed database for variant interpretation.',
}

const subpages = [
  { href: '/docs/literature/literature-evidence', title: 'Literature Evidence', description: 'How the platform searches, scores, and presents literature for clinical variant interpretation.' },
  { href: '/docs/literature/relevance-scoring', title: 'Relevance Scoring', description: 'Six-component weighted scoring system for ranking publications by clinical relevance.' },
  { href: '/docs/literature/evidence-strength', title: 'Evidence Strength', description: 'How literature evidence maps to ACMG-aligned strength categories.' },
  { href: '/docs/literature/pubmed-coverage', title: 'PubMed Coverage', description: 'What is and is not covered in the literature database.' },
]

export default function LiteraturePage() {
  return (
    <div className="py-10 space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">Literature Evidence</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          The platform maintains a local, pre-processed subset of PubMed focused on clinical genetics literature. Approximately 2-3 million publications are indexed, filtered from the full PubMed corpus of approximately 35 million articles using curated MeSH (Medical Subject Headings) descriptors for genetics relevance.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          When a case is analyzed, the platform searches this local database for publications relevant to the patient&apos;s genes, variants, and phenotype. Results are ranked by clinical relevance and annotated with evidence strength categories aligned to ACMG criteria.
        </p>
      </section>

      <section className="space-y-4">
        <p className="text-lg font-semibold text-foreground">How It Works</p>
        <div className="space-y-3">
          {[
            { step: 1, label: 'Query Construction', desc: 'The platform identifies genes carrying candidate variants and the patient\u2019s HPO terms. These form the search query against the local literature database.' },
            { step: 2, label: 'Publication Discovery', desc: 'Two search strategies run in parallel: direct gene mention lookup (indexed) and full-text search in titles and abstracts. Results are merged into a single candidate set.' },
            { step: 3, label: 'Evidence Enrichment', desc: 'Each candidate publication is enriched with extracted data: gene mentions with frequency counts, variant mentions with HGVS notation, and phenotype associations from MeSH descriptors.' },
            { step: 4, label: 'Relevance Scoring', desc: 'Publications are scored across six weighted dimensions: phenotype match, publication type, gene centrality, functional data, variant match, and recency. Low-relevance results are filtered out.' },
            { step: 5, label: 'Clinical Review', desc: 'Ranked results are presented with evidence strength labels (Strong, Moderate, Supporting, Weak) aligned to ACMG criteria. The geneticist reviews the publications to determine their applicability.' },
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

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Local Database, No External Queries</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          All literature searches run against a local database stored on EU infrastructure. No patient data or query parameters are sent to PubMed or any external service during clinical search. The database is updated daily from PubMed&apos;s public FTP server as a background process, separate from clinical queries.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Performance</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Clinical literature search completes in under 500 milliseconds for a typical query (3-5 genes, 5-10 HPO terms). Results are pre-generated and cached for streaming to the frontend.
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
