import Link from 'next/link'

export const metadata = {
  title: 'No External Calls | Helix Insight Documentation',
  description: 'How Helix Insight processes genomic data with zero outbound network calls.',
}

export default function NoExternalCallsPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/data-and-privacy" className="hover:text-primary transition-colors">Data and Privacy</Link>
          {' / '}
          <span className="text-foreground">No External Calls</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">No External Calls</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          During variant processing, Helix Insight makes zero outbound network calls. No patient data, genomic coordinates, variant identifiers, or query parameters are sent to any external service at any point in the analysis pipeline. This is a fundamental architectural decision, not a configuration option.
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What Runs Locally</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Every component of the variant analysis pipeline operates on local data stored on the Helsinki server. No external API calls are made during processing:
        </p>
        <div className="space-y-3">
          {[
            { component: 'Ensembl VEP', desc: 'Variant Effect Predictor runs locally with a local offline cache (Release 113, GRCh38). No calls to the Ensembl REST API. Consequence annotation, transcript selection, and impact classification all run on local data.' },
            { component: 'gnomAD', desc: 'Population frequency database (v4.1.0, 759 million variants) is stored locally. Allele frequencies, homozygote counts, and population-specific data are queried from local storage.' },
            { component: 'ClinVar', desc: 'Clinical significance database (2025-01, 4.1 million variants) is stored locally. Clinical significance, review status, and star ratings are queried without any connection to NCBI.' },
            { component: 'dbNSFP', desc: 'Functional prediction scores (4.9c, 80.6 million sites) -- SIFT, AlphaMissense, MetaSVM, DANN, BayesDel, PhyloP, GERP -- all stored and queried locally.' },
            { component: 'HPO Ontology', desc: 'Human Phenotype Ontology with 17,000+ terms and 320,000+ gene-phenotype associations. Phenotype matching and semantic similarity computed locally using the pyhpo library.' },
            { component: 'ClinGen', desc: 'Dosage sensitivity data (1,600+ genes) for haploinsufficiency and triplosensitivity stored locally.' },
            { component: 'SpliceAI Precomputed', desc: 'Splice impact delta scores for MANE transcripts stored locally. No calls to the Illumina API or SpliceAI web interface.' },
            { component: 'Literature Database', desc: 'Local PubMed mirror with 2-3 million genetics-relevant publications. Literature search, relevance scoring, and evidence assessment all run against local data. No calls to NCBI PubMed.' },
          ].map((item) => (
            <div key={item.component} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.component}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Network Architecture</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The variant processing pipeline has no outbound network access by design. Network architecture enforces this at the infrastructure level:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Inbound only</p>
            <p className="text-md text-muted-foreground leading-relaxed">The platform accepts VCF uploads and API requests from authenticated users over TLS 1.3. These are the only inbound connections.</p>
          </div>
          <div className="border-t border-border/50" />
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">No outbound from processing</p>
            <p className="text-md text-muted-foreground leading-relaxed">The variant analysis, phenotype matching, screening, and literature search services have no outbound network routes. They cannot make HTTP requests, DNS queries, or any other network calls to external services.</p>
          </div>
          <div className="border-t border-border/50" />
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Separate update channel</p>
            <p className="text-md text-muted-foreground leading-relaxed">Reference database updates (ClinVar quarterly, PubMed daily) are fetched by a separate background process that does not have access to patient data. The update process downloads public data; it never sends any data outbound.</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Why This Matters</p>
        <div className="space-y-3">
          {[
            { label: 'No data leakage risk', desc: 'If the processing pipeline cannot make network calls, it cannot leak data -- even in the event of a software vulnerability or misconfiguration.' },
            { label: 'No third-party dependency', desc: 'Processing does not depend on external API availability. The platform operates at full capacity even if every external service is offline.' },
            { label: 'No third-party data access', desc: 'No external organization receives genomic data, variant identifiers, or query parameters. There is no risk of external services logging, caching, or retaining patient-related data.' },
            { label: 'Verifiable by design', desc: 'The network isolation is enforced at the infrastructure level (firewall rules, Docker network configuration), not at the application level. It can be independently verified through network audit.' },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.label}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">AI Clinical Assistant</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          The AI Clinical Assistant is the one component that may use an external language model API. When this occurs, only anonymized variant data is transmitted -- genomic coordinates and classification results, never patient identifiers, sample IDs, or phenotype data. The AI assistant is an optional feature; all core analysis (classification, phenotype matching, screening, literature search) runs entirely locally without any external calls.
        </p>
      </section>
    </div>
  )
}
