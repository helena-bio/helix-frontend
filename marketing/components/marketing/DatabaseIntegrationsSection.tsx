export function DatabaseIntegrationsSection() {
  const databases = [
    {
      name: "ClinVar",
      org: "NCBI / NIH",
      description: "Clinical variant interpretations",
      url: "https://www.ncbi.nlm.nih.gov/clinvar/",
    },
    {
      name: "gnomAD",
      org: "Broad Institute",
      description: "Population allele frequencies",
      url: "https://gnomad.broadinstitute.org/",
    },
    {
      name: "ClinGen",
      org: "NIH",
      description: "Gene-disease validity",
      url: "https://www.clinicalgenome.org/",
    },
    {
      name: "HPO",
      org: "Monarch Initiative",
      description: "Human Phenotype Ontology",
      url: "https://hpo.jax.org/",
    },
    {
      name: "dbNSFP",
      org: "Liu et al.",
      description: "Functional prediction scores",
      url: "https://sites.google.com/site/jpopgen/dbNSFP",
    },
    {
      name: "PubMed",
      org: "NCBI / NIH",
      description: "Biomedical literature",
      url: "https://pubmed.ncbi.nlm.nih.gov/",
    },
  ]

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-primary">Powered by Established Clinical Databases</h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Helix Insight integrates with authoritative genomic and clinical databases to provide comprehensive, evidence-based variant analysis.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {databases.map((db) => (
            <a key={db.name} href={db.url} target="_blank" rel="noopener noreferrer" className="group bg-card border border-border rounded-lg p-4 flex flex-col items-center text-center space-y-2 hover:border-primary/40 hover:shadow-sm transition-all">
              <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{db.name}</span>
              <span className="text-xs text-muted-foreground leading-tight">{db.org}</span>
              <span className="text-xs text-muted-foreground leading-tight opacity-70">{db.description}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
