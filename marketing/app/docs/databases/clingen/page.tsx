import Link from 'next/link'

export const metadata = {
title: 'ClinGen | Helix Insight Documentation',
description: 'ClinGen dosage sensitivity database -- haploinsufficiency and triplosensitivity scores used for BS1 and BP2 ACMG criteria.',
}

const hiScores = [
{ score: '3', evidence: 'Sufficient evidence', meaning: 'Multiple independent studies demonstrate haploinsufficiency causes disease. Gene is intolerant to loss of one copy.', usage: 'Used as proxy for autosomal dominant inheritance in BS1 threshold selection.' },
{ score: '2', evidence: 'Emerging evidence', meaning: 'Some evidence suggests haploinsufficiency, but additional studies needed.', usage: 'Informational. Does not affect ACMG criteria thresholds.' },
{ score: '1', evidence: 'Little evidence', meaning: 'Limited or conflicting evidence for haploinsufficiency.', usage: 'Informational. Does not affect ACMG criteria thresholds.' },
{ score: '0', evidence: 'No evidence', meaning: 'No published evidence for haploinsufficiency.', usage: 'Does not affect ACMG criteria.' },
{ score: '30', evidence: 'Gene associated with autosomal recessive phenotype', meaning: 'Disease mechanism requires biallelic variants.', usage: 'AR proxy. Used to calibrate BS1 frequency thresholds and BP2 logic.' },
{ score: '40', evidence: 'Dosage sensitivity unlikely', meaning: 'Evidence suggests the gene tolerates copy number changes.', usage: 'Used in BP2: dosage sensitivity unlikely supports benign interpretation for compound heterozygotes.' },
]

export default function ClingenPage() {
return (
<div className="py-10 space-y-6">
<div>
<p className="text-md text-muted-foreground">
<Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
{' / '}
<Link href="/docs/databases" className="hover:text-primary transition-colors">Reference Databases</Link>
{' / '}
<span className="text-foreground">ClinGen</span>
</p>
<h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">ClinGen</h1>
<p className="text-base text-muted-foreground leading-relaxed mt-3">
The Clinical Genome Resource (ClinGen) provides expert-curated dosage sensitivity assessments for genes. Haploinsufficiency and triplosensitivity scores indicate whether a gene is sensitive to copy number changes, which serves as a proxy for inheritance pattern in ACMG classification.
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
<span className="text-md text-muted-foreground">~1,600 genes with dosage assessments</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Source</span>
<span className="text-md text-primary">clinicalgenome.org</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Producer</span>
<span className="text-md text-muted-foreground">ClinGen Consortium (NIH-funded)</span>
</div>
</div>
</section>

{/* Role in classification */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Role in ACMG Classification</p>
<p className="text-base text-muted-foreground leading-relaxed">
ClinGen dosage scores provide inheritance pattern proxies that calibrate frequency-based ACMG criteria:
</p>
<div className="space-y-3">
{[
{ code: 'BS1', strength: 'Strong Benign', desc: 'Haploinsufficiency score = 3 is used as a proxy for autosomal dominant inheritance. When triggered, BS1 applies a stricter frequency threshold (AF >= 0.1%) compared to the default recessive threshold (AF >= 5%).' },
{ code: 'BP2', strength: 'Supporting Benign', desc: 'When a variant is a compound heterozygote candidate and ClinGen haploinsufficiency score = 30 (dosage sensitivity unlikely), BP2 applies. This combination suggests the variant is less likely to be pathogenic in a dominant context.' },
].map((item) => (
<div key={item.code} className="bg-card border border-border rounded-lg p-4 space-y-1">
<div className="flex items-center gap-2">
<span className="font-mono text-base font-semibold text-foreground">{item.code}</span>
<span className="px-2 py-0.5 text-sm rounded bg-muted text-muted-foreground">{item.strength}</span>
</div>
<p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
</div>
))}
</div>
</section>

{/* Columns loaded */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Columns Loaded (2)</p>
<p className="text-md text-muted-foreground leading-relaxed">
ClinGen data is joined on gene symbol. Each variant inherits its gene-level dosage sensitivity scores.
</p>
<div className="space-y-3">
<div className="bg-card border border-border rounded-lg p-4 space-y-1">
<div className="flex items-center gap-2">
<span className="font-mono text-md font-semibold text-foreground">haploinsufficiency_score</span>
<span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground font-mono">INTEGER</span>
</div>
<p className="text-md text-muted-foreground leading-relaxed">
Haploinsufficiency assessment score. Values 0-3 indicate evidence level for haploinsufficiency. Special values: 30 = autosomal recessive phenotype, 40 = dosage sensitivity unlikely.
</p>
</div>
<div className="bg-card border border-border rounded-lg p-4 space-y-1">
<div className="flex items-center gap-2">
<span className="font-mono text-md font-semibold text-foreground">triplosensitivity_score</span>
<span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground font-mono">INTEGER</span>
</div>
<p className="text-md text-muted-foreground leading-relaxed">
Triplosensitivity assessment score. Same 0-3 scale as haploinsufficiency. Indicates sensitivity to gene duplication (three copies). Currently informational in Helix Insight and not directly used in ACMG criteria.
</p>
</div>
</div>
</section>

{/* Score table */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Haploinsufficiency Score Interpretation</p>
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="border-b border-border">
<th className="text-left py-2 pr-3 font-medium text-foreground">Score</th>
<th className="text-left py-2 pr-3 font-medium text-foreground">Evidence Level</th>
<th className="text-left py-2 pr-3 font-medium text-foreground">Meaning</th>
<th className="text-left py-2 font-medium text-foreground">Usage in Classification</th>
</tr>
</thead>
<tbody>
{hiScores.map((row) => (
<tr key={row.score} className="border-b border-border/50">
<td className="py-2 pr-3 font-mono text-md text-foreground">{row.score}</td>
<td className="py-2 pr-3 text-md text-muted-foreground">{row.evidence}</td>
<td className="py-2 pr-3 text-md text-muted-foreground">{row.meaning}</td>
<td className="py-2 text-md text-muted-foreground">{row.usage}</td>
</tr>
))}
</tbody>
</table>
</div>
</section>

{/* Limitations */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Limitations</p>
<div className="bg-card border border-border rounded-lg p-4 space-y-2">
{[
'ClinGen covers approximately 1,600 genes. Variants in unassessed genes will have NULL dosage scores.',
'Dosage sensitivity is a gene-level property. It does not distinguish between different variant types or positions within the gene.',
'The haploinsufficiency score is used as an inheritance proxy, not a direct measure of variant pathogenicity.',
'Genes with score 0 (no evidence) are not the same as genes with negative evidence -- absence of evidence is not evidence of absence.',
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
Rehm HL, et al. &quot;ClinGen -- The Clinical Genome Resource.&quot; <span className="italic">New England Journal of Medicine</span>. 2015;372(23):2235-2242. PMID: 26014595.
</p>
</section>
</div>
)
}
