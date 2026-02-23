import Link from 'next/link'

export const metadata = {
title: 'dbNSFP | Helix Insight Documentation',
description: 'dbNSFP 4.9c functional prediction database -- SIFT, AlphaMissense, MetaSVM, DANN, BayesDel, PhyloP, and GERP scores for missense variant interpretation.',
}

const columns = [
{ name: 'sift_pred', type: 'VARCHAR', description: 'SIFT prediction: "D" (Deleterious) or "T" (Tolerated). Based on sequence homology across related proteins.' },
{ name: 'sift_score', type: 'FLOAT', description: 'SIFT score (0-1). Lower values indicate higher probability of being deleterious. Threshold: < 0.05 = Deleterious.' },
{ name: 'alphamissense_pred', type: 'VARCHAR', description: 'AlphaMissense prediction: "P" (Pathogenic), "A" (Ambiguous), or "B" (Benign). DeepMind protein structure-based.' },
{ name: 'alphamissense_score', type: 'FLOAT', description: 'AlphaMissense score (0-1). Higher values indicate higher probability of pathogenicity.' },
{ name: 'metasvm_pred', type: 'VARCHAR', description: 'MetaSVM prediction: "D" (Damaging) or "T" (Tolerated). Ensemble of 10 individual predictors combined with SVM.' },
{ name: 'metasvm_score', type: 'FLOAT', description: 'MetaSVM score (continuous). Positive = damaging, negative = tolerated.' },
{ name: 'dann_score', type: 'FLOAT', description: 'DANN score (0-1). Deep neural network pathogenicity score. Higher = more likely pathogenic. Can score any SNV.' },
{ name: 'phylop100way_vertebrate', type: 'FLOAT', description: 'PhyloP conservation score across 100 vertebrate species. Positive = conserved, negative = fast-evolving, zero = neutral.' },
{ name: 'gerp_rs', type: 'FLOAT', description: 'GERP++ rejected substitution score. Higher = more constrained. Scores > 2 suggest constraint, > 4 strong constraint.' },
]

export default function DbnsfpPage() {
return (
<div className="py-10 space-y-6">
<div>
<p className="text-md text-muted-foreground">
<Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
{' / '}
<Link href="/docs/databases" className="hover:text-primary transition-colors">Reference Databases</Link>
{' / '}
<span className="text-foreground">dbNSFP</span>
</p>
<h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">dbNSFP</h1>
<p className="text-base text-muted-foreground leading-relaxed mt-3">
dbNSFP (database of Non-synonymous Functional Predictions) provides precomputed pathogenicity predictions and conservation scores for all possible non-synonymous single nucleotide variants in the human genome. It serves as the source for both BayesDel_noAF (used in ACMG PP3/BP4 criteria) and individual predictor scores used in screening prioritization.
</p>
</div>

{/* Database details */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Database Details</p>
<div className="bg-card border border-border rounded-lg p-4 space-y-2">
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Version</span>
<span className="font-mono text-md text-muted-foreground">4.9c</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Records</span>
<span className="text-md text-muted-foreground">~80.6 million variant sites</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Total Fields</span>
<span className="text-md text-muted-foreground">434 (9 loaded by Helix Insight)</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Genome Build</span>
<span className="font-mono text-md text-muted-foreground">GRCh38</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Source</span>
<span className="text-md text-primary">sites.google.com/site/jpaborern/dbNSFP</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Producer</span>
<span className="text-md text-muted-foreground">Liu X, Li C, Mou C, Dong Y, Tu Y (USF Genomics)</span>
</div>
</div>
</section>

{/* Role in classification */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Role in Classification and Screening</p>
<p className="text-base text-muted-foreground leading-relaxed">
dbNSFP data serves two distinct roles in Helix Insight:
</p>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
<div className="bg-card border border-border rounded-lg p-4 space-y-2">
<p className="text-base font-medium text-foreground">ACMG Classification</p>
<p className="text-md text-muted-foreground leading-relaxed">
BayesDel_noAF (included in dbNSFP) is the primary computational predictor for PP3 and BP4 criteria. ClinGen SVI calibrated thresholds allow PP3 to reach Supporting, Moderate, or Strong evidence strength.
</p>
</div>
<div className="bg-card border border-border rounded-lg p-4 space-y-2">
<p className="text-base font-medium text-foreground">Screening Prioritization</p>
<p className="text-md text-muted-foreground leading-relaxed">
Individual predictor scores (SIFT, AlphaMissense, MetaSVM, DANN) and conservation metrics (PhyloP, GERP) contribute to the weighted deleteriousness component of the screening score.
</p>
</div>
</div>
</section>

{/* Duplicate handling */}
<section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
<p className="text-base font-medium text-foreground">Duplicate Variant Handling</p>
<p className="text-md text-muted-foreground leading-relaxed">
dbNSFP contains approximately 701,000 duplicate variant entries (0.87% of the dataset) due to multi-transcript annotation. Helix Insight resolves these by aggregating to the most pathogenic interpretation: MIN(sift_score) since lower SIFT is more pathogenic, MAX for all other scores, with predictions matched to their corresponding extreme scores.
</p>
</section>

{/* Columns loaded */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Columns Loaded (9)</p>
<p className="text-md text-muted-foreground leading-relaxed">
Variants are matched by exact positional coordinates. From the 434 available fields, Helix Insight loads 9 columns covering 4 functional predictors and 2 conservation metrics:
</p>
<div className="space-y-3">
{columns.map((col) => (
<div key={col.name} className="bg-card border border-border rounded-lg p-4 space-y-1">
<div className="flex items-center gap-2">
<span className="font-mono text-md font-semibold text-foreground">{col.name}</span>
<span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground font-mono">{col.type}</span>
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
'dbNSFP covers non-synonymous (missense) single nucleotide variants only. Indels, structural variants, and synonymous variants are not included.',
'Predictor scores may be NULL for variants not covered by specific prediction algorithms.',
'Different predictors use different training datasets, so their predictions are not fully independent.',
'Conservation scores reflect evolutionary constraint at a position, not the impact of a specific amino acid substitution.',
'BayesDel_noAF deliberately excludes allele frequency to avoid circular reasoning with PM2/BA1/BS1 criteria.',
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
Liu X, et al. &quot;dbNSFP v4: a comprehensive database of transcript-specific functional predictions and annotations for human nonsynonymous and splice-site SNVs.&quot; <span className="italic">Genome Medicine</span>. 2020;12(1):103. PMID: 33261662.
</p>
</section>

<p className="text-md text-muted-foreground">
For details on individual predictors, see the <Link href="/docs/predictors" className="text-primary hover:underline font-medium">Computational Predictors</Link> section.
</p>
</div>
)
}
