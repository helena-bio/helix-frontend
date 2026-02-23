import Link from 'next/link'

export const metadata = {
title: 'Ensembl VEP | Helix Insight Documentation',
description: 'Ensembl Variant Effect Predictor (VEP) -- consequence annotation, transcript selection, and variant effect prediction in Helix Insight.',
}

const fields = [
{ name: 'gene_symbol', description: 'HGNC gene symbol from the most severe transcript annotation.' },
{ name: 'gene_id', description: 'Ensembl gene identifier (ENSG format).' },
{ name: 'transcript_id', description: 'Ensembl transcript identifier (ENST format) from the most severe consequence.' },
{ name: 'hgvs_genomic', description: 'Genomic HGVS notation (e.g., NC_000001.11:g.12345A>G).' },
{ name: 'hgvs_cdna', description: 'cDNA-level HGVS notation relative to the transcript (e.g., NM_000123.4:c.456A>G).' },
{ name: 'hgvs_protein', description: 'Protein-level HGVS notation (e.g., NP_000114.1:p.Arg152Gly). NULL for non-coding variants.' },
{ name: 'consequence', description: 'Sequence Ontology consequence term(s). Examples: missense_variant, frameshift_variant, splice_donor_variant.' },
{ name: 'impact', description: 'Impact severity: HIGH, MODERATE, LOW, or MODIFIER. Determines which ACMG criteria paths are evaluated.' },
{ name: 'biotype', description: 'Transcript biotype (e.g., protein_coding, nonsense_mediated_decay).' },
{ name: 'exon_number', description: 'Exon number within the transcript, if applicable.' },
{ name: 'domains', description: 'Protein domain annotations (e.g., "Pfam:PF00533,InterPro:IPR011364"). Used for PM1 and PM4 criteria.' },
]

const consequences = [
{ impact: 'HIGH', examples: 'frameshift_variant, stop_gained, splice_acceptor_variant, splice_donor_variant', criteria: 'PVS1 pathway' },
{ impact: 'MODERATE', examples: 'missense_variant, inframe_insertion, inframe_deletion', criteria: 'PP3/BP4 (BayesDel), PM4, BP3' },
{ impact: 'LOW', examples: 'synonymous_variant, splice_region_variant', criteria: 'BP7' },
{ impact: 'MODIFIER', examples: 'intron_variant, upstream_gene_variant, downstream_gene_variant', criteria: 'Typically no ACMG criteria triggered' },
]

export default function VepPage() {
return (
<div className="py-10 space-y-6">
<div>
<p className="text-md text-muted-foreground">
<Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
{' / '}
<Link href="/docs/databases" className="hover:text-primary transition-colors">Reference Databases</Link>
{' / '}
<span className="text-foreground">Ensembl VEP</span>
</p>
<h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Ensembl VEP</h1>
<p className="text-base text-muted-foreground leading-relaxed mt-3">
The Ensembl Variant Effect Predictor (VEP) determines the consequence of each variant on genes, transcripts, and protein sequence. It runs as Stage 3 of the processing pipeline, before reference database annotation, and provides the foundational consequence information that guides all downstream classification logic.
</p>
</div>

{/* Database details */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Configuration</p>
<div className="bg-card border border-border rounded-lg p-4 space-y-2">
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Version</span>
<span className="text-md text-muted-foreground">Ensembl Release 113</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Genome Build</span>
<span className="text-md text-muted-foreground">GRCh38</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Cache</span>
<span className="text-md text-muted-foreground">Local offline cache (no external API calls)</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Processing</span>
<span className="text-md text-muted-foreground">Parallelized across chromosomes (up to 48 workers)</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Source</span>
<span className="text-md text-primary">ensembl.org/vep</span>
</div>
<div className="border-t border-border/50" />
<div className="flex items-center gap-2">
<span className="text-sm font-medium text-foreground w-32">Producer</span>
<span className="text-md text-muted-foreground">European Molecular Biology Laboratory (EMBL-EBI)</span>
</div>
</div>
</section>

{/* Impact levels */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Impact Classification</p>
<p className="text-base text-muted-foreground leading-relaxed">
VEP assigns each consequence a severity level that determines which ACMG criteria pathways are evaluated:
</p>
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="border-b border-border">
<th className="text-left py-2 pr-3 font-medium text-foreground">Impact</th>
<th className="text-left py-2 pr-3 font-medium text-foreground">Example Consequences</th>
<th className="text-left py-2 font-medium text-foreground">ACMG Pathway</th>
</tr>
</thead>
<tbody>
{consequences.map((row) => (
<tr key={row.impact} className="border-b border-border/50">
<td className="py-2 pr-3 text-md text-foreground font-medium">{row.impact}</td>
<td className="py-2 pr-3 text-md text-muted-foreground">{row.examples}</td>
<td className="py-2 text-md text-muted-foreground">{row.criteria}</td>
</tr>
))}
</tbody>
</table>
</div>
</section>

{/* Local execution */}
<section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
<p className="text-base font-medium text-foreground">Local Execution</p>
<p className="text-md text-muted-foreground leading-relaxed">
VEP runs entirely locally using a pre-downloaded offline cache. No variant data is sent to Ensembl servers. The local FASTA reference file provides sequence context for HGVS notation generation. This ensures both data privacy and processing speed independence from network availability.
</p>
</section>

{/* Fields extracted */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Fields Extracted (11)</p>
<p className="text-md text-muted-foreground leading-relaxed">
For each variant, VEP produces annotations across all overlapping transcripts. Helix Insight selects the most severe consequence transcript and extracts the following fields:
</p>
<div className="space-y-3">
{fields.map((field) => (
<div key={field.name} className="bg-card border border-border rounded-lg p-4 space-y-1">
<span className="text-md font-semibold text-foreground">{field.name}</span>
<p className="text-md text-muted-foreground leading-relaxed">{field.description}</p>
</div>
))}
</div>
</section>

{/* ACMG criteria that depend on VEP */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">ACMG Criteria Dependent on VEP</p>
<p className="text-md text-muted-foreground leading-relaxed">
VEP consequence and domain annotations directly determine which ACMG criteria are evaluated:
</p>
<div className="space-y-3">
{[
{ code: 'PVS1', dependency: 'Impact = HIGH + specific consequence types (frameshift, stop_gained, splice_acceptor, splice_donor)' },
{ code: 'PM1', dependency: 'Domains field contains Pfam annotation' },
{ code: 'PM4', dependency: 'In-frame indel consequence + Pfam domain + not repetitive region' },
{ code: 'PP2', dependency: 'Missense consequence type' },
{ code: 'BP1', dependency: 'Missense consequence + MODERATE impact' },
{ code: 'BP3', dependency: 'In-frame indel + repetitive region or no Pfam domain' },
{ code: 'BP7', dependency: 'Synonymous consequence + not splice region' },
].map((item) => (
<div key={item.code} className="flex items-start gap-3">
<span className="text-md font-semibold text-foreground w-12 shrink-0">{item.code}</span>
<p className="text-md text-muted-foreground">{item.dependency}</p>
</div>
))}
</div>
</section>

{/* Limitations */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Limitations</p>
<div className="bg-card border border-border rounded-lg p-4 space-y-2">
{[
'VEP selects one canonical transcript per gene. Variants with different consequences across alternative transcripts may have clinically relevant effects not captured by the primary annotation.',
'VEP indel representation differs from VCF format. The platform reconciles both formats during annotation matching, but complex multi-allelic sites may require manual review.',
'Domain annotations depend on Pfam coverage. Novel or uncharacterized protein domains are not represented.',
'VEP does not predict gain-of-function effects. All consequence annotations reflect loss or disruption of normal function.',
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
McLaren W, et al. &quot;The Ensembl Variant Effect Predictor.&quot; <span className="italic">Genome Biology</span>. 2016;17(1):122. PMID: 27268795.
</p>
</section>
</div>
)
}
