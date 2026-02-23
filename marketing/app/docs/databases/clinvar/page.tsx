import Link from 'next/link'

export const metadata = {
title: 'ClinVar | Helix Insight Documentation',
description: 'ClinVar clinical significance database -- variant assertions from submitting laboratories used for PS1, PP5, BP6, and ClinVar classification override.',
}

const columns = [
{ name: 'clinical_significance', type: 'VARCHAR', description: 'Aggregate clinical significance: Pathogenic, Likely pathogenic, Uncertain significance, Likely benign, Benign, or Conflicting classifications.' },
{ name: 'review_status', type: 'VARCHAR', description: 'Review status text describing the level of review. Maps to review stars.' },
{ name: 'review_stars', type: 'INTEGER', description: 'Review confidence level from 0 to 4 stars. Determines whether PS1 (>=2 stars) or PP5 (>=1 star) is applied.' },
{ name: 'clinvar_variation_id', type: 'INTEGER', description: 'Unique ClinVar variation identifier. Links to the ClinVar web entry for full submission details.' },
{ name: 'clinvar_rsid', type: 'VARCHAR', description: 'dbSNP rsID associated with the ClinVar entry, if available.' },
{ name: 'disease_name', type: 'VARCHAR', description: 'Condition name(s) associated with the clinical assertion. May contain multiple conditions separated by semicolons.' },
{ name: 'hgvsp', type: 'VARCHAR', description: 'Protein-level HGVS notation from ClinVar. Used for PS1 matching (same amino acid change as established pathogenic).' },
]

const reviewStars = [
{ stars: 4, status: 'Practice guideline', meaning: 'Classification from a recognized clinical practice guideline.', criteria: 'PS1 eligible' },
{ stars: 3, status: 'Reviewed by expert panel', meaning: 'Classified by a ClinGen Expert Panel (VCEP) with full evidence review.', criteria: 'PS1 eligible' },
{ stars: 2, status: 'Criteria provided, multiple submitters, no conflicts', meaning: 'Two or more submitters agree, using stated criteria, with no conflicting assertions.', criteria: 'PS1 eligible' },
{ stars: 1, status: 'Criteria provided, single/conflicting submitters', meaning: 'At least one submitter provided criteria, but there may be conflicts or only one submitter.', criteria: 'PP5/BP6 eligible' },
{ stars: 0, status: 'No assertion criteria provided', meaning: 'Classification submitted without supporting evidence criteria.', criteria: 'Not used' },
]

export default function ClinvarPage() {
return (
<div className="py-10 space-y-6">
<div>
<p className="text-md text-muted-foreground">
<Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
{' / '}
<Link href="/docs/databases" className="hover:text-primary transition-colors">Reference Databases</Link>
{' / '}
<span className="text-foreground">ClinVar</span>
</p>
<h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">ClinVar</h1>
<p className="text-base text-muted-foreground leading-relaxed mt-3">
ClinVar is a public archive of clinical significance assertions for genetic variants, maintained by the National Center for Biotechnology Information (NCBI). It aggregates submissions from clinical laboratories, research groups, and expert panels worldwide.
</p>
</div>

{/* Database details */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Database Details</p>
<div className="bg-card border border-border rounded-lg p-4 space-y-2">
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Version</span>
<span className="text-md text-muted-foreground">2025-01</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Records</span>
<span className="text-md text-muted-foreground">~4.1 million variants</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Genome Build</span>
<span className="text-md text-muted-foreground">GRCh38</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Source</span>
<span className="text-md text-primary">ncbi.nlm.nih.gov/clinvar</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Producer</span>
<span className="text-md text-muted-foreground">National Center for Biotechnology Information (NCBI)</span>
</div>
</div>
</section>

{/* Role in classification */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Role in ACMG Classification</p>
<p className="text-base text-muted-foreground leading-relaxed">
ClinVar serves two distinct functions in Helix Insight. First, it provides evidence criteria (PS1, PP5, BP6) based on prior clinical assertions. Second, it provides a classification override mechanism for variants with established clinical significance and no conflicting computational evidence.
</p>
<div className="space-y-3">
{[
{ code: 'PS1', strength: 'Strong Pathogenic', desc: 'Same amino acid change reported as Pathogenic or Likely Pathogenic with >= 2 review stars. The higher star threshold reflects greater confidence in the clinical assertion.' },
{ code: 'PP5', strength: 'Supporting Pathogenic', desc: 'Pathogenic or Likely Pathogenic with >= 1 review star but < 2 stars. Lower confidence tier than PS1. Retained for maximum sensitivity despite ClinGen SVI retirement recommendation.' },
{ code: 'BP6', strength: 'Supporting Benign', desc: 'Benign or Likely Benign with >= 1 review star. Retained for maximum sensitivity despite ClinGen SVI retirement recommendation.' },
{ code: 'Override', strength: 'Classification Priority 3', desc: 'ClinVar classification is applied directly when no conflicting computational evidence exists and review stars >= 1. ClinVar VUS does not override computational classification. Override is subordinate to BA1 and high-confidence conflict checks.' },
].map((item) => (
<div key={item.code} className="bg-card border border-border rounded-lg p-4 space-y-1">
<div className="flex items-center gap-2">
<span className="text-base font-semibold text-foreground">{item.code}</span>
<span className="px-2 py-0.5 text-sm rounded bg-muted text-muted-foreground">{item.strength}</span>
</div>
<p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
</div>
))}
</div>
</section>

{/* ClinVar rescue */}
<section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
<p className="text-base font-medium text-foreground">ClinVar Pathogenic Rescue</p>
<p className="text-md text-muted-foreground leading-relaxed">
During quality filtering (Stage 2), variants that fail quality thresholds are normally excluded from classification. However, variants with ClinVar Pathogenic or Likely Pathogenic status are rescued and retain their quality-pass flag regardless of quality metrics. This ensures that known pathogenic variants in low-coverage regions are never silently discarded.
</p>
</section>

{/* Review stars */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Review Star System</p>
<p className="text-md text-muted-foreground leading-relaxed">
ClinVar assigns review stars based on the level of evidence review and submitter agreement. Helix Insight uses these stars to calibrate the strength of ClinVar-derived evidence:
</p>
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="border-b border-border">
<th className="text-left py-2 pr-3 font-medium text-foreground">Stars</th>
<th className="text-left py-2 pr-3 font-medium text-foreground">Review Status</th>
<th className="text-left py-2 pr-3 font-medium text-foreground">Meaning</th>
<th className="text-left py-2 font-medium text-foreground">Criteria</th>
</tr>
</thead>
<tbody>
{reviewStars.map((row) => (
<tr key={row.stars} className="border-b border-border/50">
<td className="py-2 pr-3 text-md text-foreground">{row.stars}</td>
<td className="py-2 pr-3 text-md text-muted-foreground">{row.status}</td>
<td className="py-2 pr-3 text-md text-muted-foreground">{row.meaning}</td>
<td className="py-2 text-md text-muted-foreground">{row.criteria}</td>
</tr>
))}
</tbody>
</table>
</div>
</section>

{/* Columns loaded */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Columns Loaded (7)</p>
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
'ClinVar submissions vary in quality. A 1-star submission without criteria may reflect older, less rigorous classification practices.',
'Conflicting classifications (e.g., one submitter says Pathogenic, another says Benign) are flagged but require manual review to resolve.',
'ClinVar updates monthly. The deployed version may not include the most recent submissions.',
'Some ClinVar entries reference GRCh37 coordinates that have been lifted over to GRCh38, which may introduce positional ambiguity for complex variants.',
'ClinVar VUS does not contribute evidence in either direction and does not override computational classification.',
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
Landrum MJ, et al. &quot;ClinVar: improvements to accessing data.&quot; <span className="italic">Nucleic Acids Research</span>. 2020;48(D1):D835-D844. PMID: 31777943.
</p>
</section>
</div>
)
}
