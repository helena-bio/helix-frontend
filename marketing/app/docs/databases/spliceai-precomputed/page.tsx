import Link from 'next/link'

export const metadata = {
title: 'SpliceAI Precomputed | Helix Insight Documentation',
description: 'SpliceAI precomputed splice impact scores for all coding variants -- four delta scores predicting splice site gain and loss.',
}

const deltaScores = [
{ code: 'DS_AG', name: 'Acceptor Gain', description: 'Predicts creation of a new splice acceptor site. A high score indicates the variant may introduce a cryptic acceptor competing with the canonical site.' },
{ code: 'DS_AL', name: 'Acceptor Loss', description: 'Predicts destruction of an existing splice acceptor site. A high score indicates the canonical acceptor is disrupted.' },
{ code: 'DS_DG', name: 'Donor Gain', description: 'Predicts creation of a new splice donor site. A high score indicates a cryptic donor may be introduced.' },
{ code: 'DS_DL', name: 'Donor Loss', description: 'Predicts destruction of an existing splice donor site. A high score indicates the canonical donor is disrupted.' },
]

const thresholds = [
{ range: '0.0 - 0.1', interpretation: 'No predicted splice impact', clinical: 'Variant unlikely to affect splicing. BP7 guard satisfied (SpliceAI < 0.1).' },
{ range: '0.1 - 0.2', interpretation: 'Low predicted impact', clinical: 'Some splice effect possible but below PP3_splice threshold.' },
{ range: '0.2 - 0.5', interpretation: 'Moderate predicted impact', clinical: 'PP3_splice triggered (Supporting). ClinGen SVI 2023 threshold for supporting splice evidence.' },
{ range: '0.5 - 0.8', interpretation: 'High predicted impact', clinical: 'Strong prediction of splice disruption. PP3_splice at Supporting strength.' },
{ range: '0.8 - 1.0', interpretation: 'Very high predicted impact', clinical: 'Near-certain splice disruption. PP3_splice at Supporting strength.' },
]

export default function SpliceaiPrecomputedPage() {
return (
<div className="py-10 space-y-6">
<div>
<p className="text-md text-muted-foreground">
<Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
{' / '}
<Link href="/docs/databases" className="hover:text-primary transition-colors">Reference Databases</Link>
{' / '}
<span className="text-foreground">SpliceAI Precomputed</span>
</p>
<h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">SpliceAI Precomputed</h1>
<p className="text-base text-muted-foreground leading-relaxed mt-3">
SpliceAI is a deep learning model developed by Illumina that predicts the impact of genetic variants on mRNA splicing. Helix Insight uses precomputed SpliceAI scores for all coding variants, eliminating the need for on-the-fly prediction and ensuring consistent, reproducible results.
</p>
</div>

{/* Database details */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Database Details</p>
<div className="bg-card border border-border rounded-lg p-4 space-y-2">
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Version</span>
<span className="text-md text-muted-foreground">Ensembl MANE R113</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Coverage</span>
<span className="text-md text-muted-foreground">All coding variants in MANE Select transcripts</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Genome Build</span>
<span className="text-md text-muted-foreground">GRCh38</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Source</span>
<span className="text-md text-primary">github.com/Illumina/SpliceAI</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Producer</span>
<span className="text-md text-muted-foreground">Illumina, Inc.</span>
</div>
</div>
</section>

{/* Four delta scores */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Four Delta Scores</p>
<p className="text-base text-muted-foreground leading-relaxed">
SpliceAI produces four delta scores, each ranging from 0 to 1, representing the change in splice probability caused by the variant:
</p>
<div className="space-y-3">
{deltaScores.map((ds) => (
<div key={ds.code} className="bg-card border border-border rounded-lg p-4 space-y-1">
<div className="flex items-center gap-2">
<span className="text-md font-semibold text-foreground">{ds.code}</span>
<span className="px-2 py-0.5 text-sm rounded bg-muted text-muted-foreground">{ds.name}</span>
</div>
<p className="text-md text-muted-foreground leading-relaxed">{ds.description}</p>
</div>
))}
</div>
<p className="text-md text-muted-foreground leading-relaxed">
The maximum of the four delta scores (max_score) is used for classification thresholds. This captures the strongest predicted splice effect regardless of mechanism.
</p>
</section>

{/* Thresholds */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Score Interpretation</p>
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="border-b border-border">
<th className="text-left py-2 pr-3 font-medium text-foreground">Max Score</th>
<th className="text-left py-2 pr-3 font-medium text-foreground">Interpretation</th>
<th className="text-left py-2 font-medium text-foreground">Clinical Implication</th>
</tr>
</thead>
<tbody>
{thresholds.map((row) => (
<tr key={row.range} className="border-b border-border/50">
<td className="py-2 pr-3 text-md text-foreground">{row.range}</td>
<td className="py-2 pr-3 text-md text-muted-foreground">{row.interpretation}</td>
<td className="py-2 text-md text-muted-foreground">{row.clinical}</td>
</tr>
))}
</tbody>
</table>
</div>
</section>

{/* Role in classification */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Role in ACMG Classification</p>
<div className="space-y-3">
{[
{ code: 'PP3_splice', strength: 'Supporting Pathogenic', desc: 'SpliceAI max_score >= 0.2 triggers PP3 at Supporting strength. Applies only when PVS1 does not already apply (ClinGen SVI double-counting guard). Aligned with Walker et al. 2023 ClinGen SVI recommendations.' },
{ code: 'BP7 guard', strength: 'Benign guard', desc: 'BP7 (synonymous + no splice impact) requires SpliceAI max_score < 0.1 to confirm the variant does not affect splicing. Without this guard, a synonymous variant near a splice site could be incorrectly classified as benign.' },
{ code: 'BP4 guard', strength: 'Benign guard', desc: 'BP4 (computational evidence suggests no impact) additionally requires SpliceAI max_score < 0.1 to ensure no predicted splice disruption before applying benign computational evidence.' },
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

{/* PVS1 double-counting guard */}
<section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
<p className="text-base font-medium text-foreground">PVS1 Double-Counting Guard</p>
<p className="text-md text-muted-foreground leading-relaxed">
When a variant triggers PVS1 (null variant in a LoF-intolerant gene) through a splice consequence (splice_acceptor_variant or splice_donor_variant), SpliceAI PP3_splice is not additionally applied. This prevents counting the same splice disruption evidence twice -- once through the consequence-based PVS1 pathway and again through the SpliceAI prediction pathway. This follows ClinGen SVI 2023 guidelines.
</p>
</section>

{/* Limitations */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Limitations</p>
<div className="bg-card border border-border rounded-lg p-4 space-y-2">
{[
'SpliceAI predictions are based on primary sequence context. Tissue-specific splicing regulation is not modeled.',
'Precomputed scores cover coding variants in MANE Select transcripts. Variants in non-MANE transcripts or deep intronic regions may not have scores.',
'SpliceAI does not predict the functional consequence of aberrant splicing (exon skipping, intron retention, etc.), only the probability that splicing is disrupted.',
'Scores near the 0.2 threshold should be interpreted with caution. RNA studies can confirm or refute predicted splice effects.',
].map((lim, i) => (
<div key={i} className="flex items-start gap-2">
<div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
<p className="text-md text-muted-foreground">{lim}</p>
</div>
))}
</div>
</section>

{/* References */}
<section className="space-y-2">
<p className="text-lg font-semibold text-foreground">References</p>
<div className="space-y-2">
<p className="text-md text-muted-foreground leading-relaxed">
Jaganathan K, et al. &quot;Predicting splicing from primary sequence with deep learning.&quot; <span className="italic">Cell</span>. 2019;176(3):535-548. PMID: 30661751.
</p>
<p className="text-md text-muted-foreground leading-relaxed">
Walker LC, et al. &quot;Using the ACMG/AMP framework to capture evidence related to predicted and observed impact on splicing.&quot; <span className="italic">American Journal of Human Genetics</span>. 2023;110(7):1046-1067. PMID: 37352859.
</p>
</div>
</section>

<p className="text-md text-muted-foreground">
For more details on SpliceAI interpretation, see the dedicated <Link href="/docs/predictors/spliceai" className="text-primary hover:underline font-medium">SpliceAI predictor</Link> page.
</p>
</div>
)
}
