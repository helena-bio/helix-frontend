import Link from 'next/link'

export const metadata = {
  title: 'PubMed Coverage | Helix Insight Documentation',
  description: 'What is and is not covered in the Helix Insight literature database.',
}

export default function PubMedCoveragePage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/literature" className="hover:text-primary transition-colors">Literature Evidence</Link>
          {' / '}
          <span className="text-foreground">PubMed Coverage</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">PubMed Coverage</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          The literature database is derived from the complete NCBI PubMed corpus, filtered to retain only genetics-relevant publications. This page describes what is included, what is excluded, and how the database is maintained.
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Source</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-36">Source</span>
            <span className="text-md text-muted-foreground">NCBI PubMed (ftp.ncbi.nlm.nih.gov)</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-36">Total PubMed</span>
            <span className="text-md text-muted-foreground">Approximately 35 million articles</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-36">After Filtering</span>
            <span className="text-md text-muted-foreground">Approximately 2-3 million genetics-relevant articles</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-36">Filter Pass Rate</span>
            <span className="text-md text-muted-foreground">7-8% of total PubMed corpus</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-36">Date Range</span>
            <span className="text-md text-muted-foreground">1990 to present</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-36">Update Frequency</span>
            <span className="text-md text-muted-foreground">Daily (PubMed update files, approximately 15 minutes)</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Genetics Relevance Filter</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Articles must have at least one MeSH descriptor from the following curated set of genetics-relevant terms:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'Mutation',
            'Polymorphism, Single Nucleotide',
            'Genetic Variation',
            'Sequence Analysis, DNA',
            'Exome Sequencing',
            'Whole Genome Sequencing',
            'Genome-Wide Association Study',
            'Pharmacogenetics',
          ].map((term) => (
            <p key={term} className="text-md text-foreground">{term}</p>
          ))}
        </div>
        <p className="text-md text-muted-foreground leading-relaxed">
          MeSH descriptors are assigned by NLM (National Library of Medicine) indexers and represent curated, high-confidence topic annotations. This is the most reliable signal for genetics relevance.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Excluded Publication Types</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The following publication types are excluded regardless of MeSH descriptors, as they typically do not contain original clinical or functional data:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'Editorials',
            'Letters',
            'News articles',
            'Published errata',
            'Comments',
            'Retracted publications',
          ].map((type) => (
            <p key={type} className="text-md text-muted-foreground">{type}</p>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What Is NOT Covered</p>
        <div className="space-y-3">
          {[
            { label: 'Very recent publications', desc: 'Publications indexed by PubMed within the last 1-2 days may not yet be available. Daily updates typically process new entries within 24 hours.' },
            { label: 'Preprints', desc: 'Preprint servers (bioRxiv, medRxiv) are not included. Only peer-reviewed publications indexed in PubMed are covered.' },
            { label: 'Non-genetics literature', desc: 'Publications without genetics-relevant MeSH descriptors are excluded. A cardiology paper without genetic context will not appear even if it mentions a gene incidentally.' },
            { label: 'Pre-1990 publications', desc: 'Articles published before 1990 are excluded. While some older studies remain relevant, the vast majority of clinically actionable genetics literature is from the past 30 years.' },
            { label: 'Full-text content', desc: 'Only titles, abstracts, and MeSH descriptors are indexed. Full-text articles are not downloaded. The PubMed Central ID is provided for publications with open-access full text.' },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.label}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Gene Validation</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Gene symbols extracted from publications are validated against the human protein-coding gene database. This strict validation uses a three-layer filter:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Blacklist filtering</p>
            <p className="text-md text-muted-foreground leading-relaxed">Common abbreviations (DNA, RNA, PCR, MRI, HIV, ELISA) and non-gene entities are rejected before validation.</p>
          </div>
          <div className="border-t border-border/50" />
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Protein-coding gene verification</p>
            <p className="text-md text-muted-foreground leading-relaxed">Each candidate symbol is verified as a human protein-coding gene. Pseudogenes, antisense transcripts, and non-coding RNA genes are excluded.</p>
          </div>
          <div className="border-t border-border/50" />
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Exact symbol matching</p>
            <p className="text-md text-muted-foreground leading-relaxed">The extracted symbol must exactly match an HGNC-approved gene symbol. Partial matches and aliases are rejected to prevent false associations.</p>
          </div>
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Database Updates</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          The literature database uses a blue-green deployment pattern: daily updates are ingested into a separate database, verified, and then atomically promoted to production. This ensures zero-downtime updates and enables instant rollback if an update introduces issues. The baseline database is rebuilt periodically to incorporate PubMed&apos;s retroactive corrections and retractions.
        </p>
      </section>
    </div>
  )
}
