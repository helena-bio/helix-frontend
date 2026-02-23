import Link from 'next/link'

export const metadata = {
title: 'HPO | Helix Insight Documentation',
description: 'Human Phenotype Ontology (HPO) gene-phenotype associations used for PP4 criteria and phenotype matching in Helix Insight.',
}

const columns = [
{ name: 'hpo_ids', type: 'VARCHAR', description: 'Semicolon-separated HPO term identifiers associated with the gene (e.g., "HP:0001250;HP:0001263;HP:0002069"). Sorted by HPO ID to maintain 1:1 correspondence with hpo_names.' },
{ name: 'hpo_names', type: 'VARCHAR', description: 'Semicolon-separated HPO term names corresponding to hpo_ids (e.g., "Seizure;Global developmental delay;Dementia"). Sorted to match hpo_ids.' },
{ name: 'hpo_count', type: 'INTEGER', description: 'Number of unique HPO terms associated with the gene. Used in screening mode as a proxy for clinical breadth when no patient HPO terms are available.' },
{ name: 'hpo_frequency_data', type: 'VARCHAR', description: 'Frequency of each phenotype in the associated condition, when available. Not all gene-phenotype associations have frequency data.' },
{ name: 'hpo_disease_ids', type: 'VARCHAR', description: 'OMIM or Orphanet disease identifiers that link the gene to each HPO phenotype.' },
{ name: 'hpo_gene_id', type: 'VARCHAR', description: 'HPO internal gene identifier used for cross-referencing within the ontology.' },
]

export default function HpoPage() {
return (
<div className="py-10 space-y-6">
<div>
<p className="text-md text-muted-foreground">
<Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
{' / '}
<Link href="/docs/databases" className="hover:text-primary transition-colors">Reference Databases</Link>
{' / '}
<span className="text-foreground">HPO</span>
</p>
<h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">HPO</h1>
<p className="text-base text-muted-foreground leading-relaxed mt-3">
The Human Phenotype Ontology (HPO) provides a standardized vocabulary of phenotypic abnormalities and their associations with genes and diseases. In Helix Insight, HPO data enables genotype-phenotype correlation by matching patient clinical features to gene-associated phenotypes.
</p>
</div>

{/* Database details */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Database Details</p>
<div className="bg-card border border-border rounded-lg p-4 space-y-2">
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Version</span>
<span className="text-md text-muted-foreground">Latest release</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Records</span>
<span className="text-md text-muted-foreground">~320,000 gene-phenotype associations</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Source</span>
<span className="text-md text-primary">hpo.jax.org</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Producer</span>
<span className="text-md text-muted-foreground">The Monarch Initiative / Jackson Laboratory</span>
</div>
</div>
</section>

{/* Role in classification */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Role in Classification and Analysis</p>
<p className="text-base text-muted-foreground leading-relaxed">
HPO data supports three analysis functions:
</p>
<div className="space-y-3">
{[
{ label: 'ACMG PP4 Criterion', desc: 'When patient HPO terms are provided, PP4 triggers if >= 3 patient HPO terms match the gene HPO profile, or >= 2 terms match for a highly specific gene (<= 5 total HPO associations). This provides supporting pathogenic evidence.' },
{ label: 'Phenotype Matching Service', desc: 'The dedicated phenotype matching module uses HPO semantic similarity to compute overlap between patient phenotype and gene-associated phenotypes, producing clinical tiers (Tier 1 through Tier 4) for variant prioritization.' },
{ label: 'Screening Prioritization', desc: 'When no patient HPO terms are available, the hpo_count field serves as a proxy for clinical relevance. Genes associated with more phenotypes receive higher screening scores, reflecting broader clinical significance.' },
].map((item) => (
<div key={item.label} className="bg-card border border-border rounded-lg p-4 space-y-1">
<p className="text-base font-medium text-foreground">{item.label}</p>
<p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
</div>
))}
</div>
</section>

{/* Data structure */}
<section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
<p className="text-base font-medium text-foreground">Data Deduplication</p>
<p className="text-md text-muted-foreground leading-relaxed">
The same HPO term can be associated with a gene through multiple diseases. During annotation, HPO terms are deduplicated per gene before aggregation, ensuring each unique phenotype is counted once. Both hpo_ids and hpo_names are sorted by HPO ID to maintain a reliable 1:1 correspondence between identifiers and names.
</p>
</section>

{/* Columns loaded */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Columns Loaded (6)</p>
<p className="text-md text-muted-foreground leading-relaxed">
HPO data is joined on gene symbol. Each variant inherits the complete HPO profile of its associated gene.
</p>
<div className="space-y-3">
{columns.map((col) => (
<div key={col.name} className="bg-card border border-border rounded-lg p-4 space-y-1">
<div className="flex items-center gap-2">
<span className="text-md font-semibold text-foreground">{col.name}</span>
<span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">{col.type}</span>
</div>
<p className="text-md text-muted-foreground leading-relaxed">{col.description}</p>
</div>
))}
</div>
</section>

{/* Limitations */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Limitations</p>
<div className="bg-card border border-border rounded-lg p-4 space-y-2">
{[
'HPO coverage varies by disease. Well-studied conditions have comprehensive phenotype profiles, while rare diseases may have minimal HPO annotation.',
'HPO terms are associated at the gene level, not the variant level. Different variants in the same gene may produce different phenotypes.',
'Frequency data for phenotype-disease associations is incomplete. The absence of frequency data does not mean the phenotype is rare.',
'HPO is primarily focused on rare diseases. Common complex conditions may have less comprehensive ontology coverage.',
'Phenotype matching depends on accurate HPO term selection by the clinician. Overly broad or imprecise terms reduce matching specificity.',
].map((lim, i) => (
<div key={i} className="flex items-start gap-2">
<div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
<p className="text-md text-muted-foreground">{lim}</p>
</div>
))}
</div>
</section>

{/* Reference */}
<section className="space-y-2">
<p className="text-lg font-semibold text-foreground">Reference</p>
<p className="text-md text-muted-foreground leading-relaxed">
Kohler S, et al. &quot;The Human Phenotype Ontology in 2024: phenotypes around the world.&quot; <span className="italic">Nucleic Acids Research</span>. 2024;52(D1):D1333-D1346. PMID: 37953324.
</p>
</section>

<p className="text-md text-muted-foreground">
For details on phenotype-based analysis, see the <Link href="/docs/phenotype-matching" className="text-primary hover:underline font-medium">Phenotype Matching</Link> section.
</p>
</div>
)
}
