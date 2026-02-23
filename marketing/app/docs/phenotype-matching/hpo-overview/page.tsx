import Link from 'next/link'

export const metadata = {
  title: 'HPO Overview | Helix Insight Documentation',
  description: 'The Human Phenotype Ontology -- standardized vocabulary of phenotypic abnormalities used in Helix Insight.',
}

export default function HpoOverviewPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/phenotype-matching" className="hover:text-primary transition-colors">Phenotype Matching</Link>
          {' / '}
          <span className="text-foreground">HPO Overview</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">HPO Overview</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          The Human Phenotype Ontology (HPO) is a standardized vocabulary of phenotypic abnormalities observed in human disease. It provides the foundation for computational phenotype comparison in Helix Insight.
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What is HPO?</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          HPO is a structured hierarchy (directed acyclic graph) of clinical terms that describes signs, symptoms, and findings in patients with genetic disease. Each term has a unique identifier (e.g., HP:0001250 for "Seizure"), a definition, and relationships to other terms in the hierarchy.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The hierarchy captures the specificity of clinical findings. "Focal clonic seizure" (HP:0002266) is a child of "Motor seizure" (HP:0020219), which is a child of "Seizure" (HP:0001250), which is a child of "Abnormality of the nervous system" (HP:0000707). More specific terms carry more diagnostic information.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Scale</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-44">HPO Terms</span>
            <span className="text-md text-muted-foreground">Over 17,000 standardized clinical terms</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-44">Gene-Phenotype Links</span>
            <span className="text-md text-muted-foreground">Over 320,000 associations</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-44">Disease Coverage</span>
            <span className="text-md text-muted-foreground">Over 8,000 rare diseases from OMIM and Orphanet</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-44">Source</span>
            <span className="text-md text-primary">hpo.jax.org (Monarch Initiative / Jackson Laboratory)</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Why Standardized Terms Matter</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Clinical descriptions in medical records use varied language. One physician writes "fits", another "seizures", a third "epileptic episodes". Without standardization, computational comparison across patients, diseases, and databases is impossible. HPO solves this by assigning each clinical concept a unique identifier.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          When a geneticist selects "Seizure" (HP:0001250) in Helix Insight, the platform knows exactly which concept is meant and can compute its similarity to every other HPO term in the ontology -- including terms the geneticist did not explicitly select.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">How HPO Is Used in Helix Insight</p>
        <div className="space-y-3">
          {[
            { label: 'Patient Phenotype Input', desc: 'The geneticist selects HPO terms describing the patient\'s clinical presentation. The platform provides autocomplete search across all 17,000+ terms and can extract terms automatically from free-text clinical descriptions.' },
            { label: 'Gene-Phenotype Database', desc: 'Every gene in the analysis carries its HPO associations from the reference database. These associations link genes to the clinical features observed in patients with mutations in that gene.' },
            { label: 'Semantic Comparison', desc: 'The matching algorithm compares the patient\'s HPO terms against each gene\'s HPO profile using semantic similarity. Related terms are recognized through their shared ancestry in the ontology graph.' },
            { label: 'ACMG PP4 Criterion', desc: 'When 3 or more patient HPO terms match a gene\'s phenotype profile (or 2 for highly specific genes), the PP4 criterion is applied during ACMG classification, providing supporting pathogenic evidence for phenotype specificity.' },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.label}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Hierarchy Example</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Consider a patient with "Infantile spasms" (HP:0012469) being matched against a gene associated with "Epileptic encephalopathy" (HP:0200134). These terms are not identical, but they share close ancestors in the HPO hierarchy. The semantic similarity algorithm recognizes this relationship and produces a high similarity score. This is the key advantage over simple keyword matching: clinical knowledge encoded in the ontology structure is leveraged automatically.
        </p>
      </section>

      <section className="space-y-2">
        <p className="text-lg font-semibold text-foreground">Reference</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Kohler S, et al. &quot;The Human Phenotype Ontology in 2024: phenotypes around the world.&quot; <span className="italic">Nucleic Acids Research</span>. 2024;52(D1):D1333-D1346. PMID: 37953324.
        </p>
      </section>
    </div>
  )
}
