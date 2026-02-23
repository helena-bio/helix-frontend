import Link from 'next/link'

export const metadata = {
title: 'Database Update Policy | Helix Insight Documentation',
description: 'How and when reference databases are updated, validated, and versioned in Helix Insight.',
}

const updateSchedule = [
{ database: 'gnomAD', frequency: 'Major release only', current: 'v4.1.0', trigger: 'New gnomAD major version (e.g., v5.0)', note: 'Major releases add significant new samples or populations.' },
{ database: 'ClinVar', frequency: 'Quarterly', current: '2025-01', trigger: 'NCBI monthly release', note: 'Quarterly cadence balances currency with validation effort.' },
{ database: 'dbNSFP', frequency: 'Major release only', current: '4.9c', trigger: 'New dbNSFP version', note: 'Includes predictor algorithm updates.' },
{ database: 'SpliceAI', frequency: 'With Ensembl release', current: 'MANE R113', trigger: 'New Ensembl MANE release', note: 'Tied to VEP cache version.' },
{ database: 'gnomAD Constraint', frequency: 'With gnomAD', current: 'v4.1.0', trigger: 'New gnomAD constraint release', note: 'Updated alongside population frequency data.' },
{ database: 'HPO', frequency: 'Quarterly', current: 'Latest release', trigger: 'New HPO data release', note: 'Phenotype annotations are actively curated.' },
{ database: 'ClinGen', frequency: 'Quarterly', current: 'Latest release', trigger: 'New ClinGen dosage release', note: 'Dosage curation is ongoing.' },
{ database: 'Ensembl VEP', frequency: 'Annual', current: 'Release 113', trigger: 'New Ensembl release with cache update', note: 'Includes transcript model updates.' },
]

export default function UpdatePolicyPage() {
return (
<div className="py-10 space-y-6">
<div>
<p className="text-md text-muted-foreground">
<Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
{' / '}
<Link href="/docs/databases" className="hover:text-primary transition-colors">Reference Databases</Link>
{' / '}
<span className="text-foreground">Update Policy</span>
</p>
<h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Database Update Policy</h1>
<p className="text-base text-muted-foreground leading-relaxed mt-3">
Reference database updates affect variant classification. A variant classified as VUS today may be reclassified as Likely Pathogenic after a ClinVar update adds new clinical evidence. Helix Insight manages database updates through a controlled process that balances clinical currency with classification stability.
</p>
</div>

{/* Update principles */}
<section className="space-y-4">
<p className="text-lg font-semibold text-foreground">Update Principles</p>
<div className="space-y-3">
{[
{ label: 'Versioned and Documented', desc: 'Every database update is logged with version, date, record counts, and validation results. The current version of each database is displayed on its documentation page.' },
{ label: 'Validated Before Deployment', desc: 'Each database update undergoes regression testing against a reference cohort of known pathogenic and benign variants. Classification changes are reviewed before production deployment.' },
{ label: 'Atomic Updates', desc: 'Database updates are applied atomically. All analyses in progress complete with the previous version. New analyses use the updated version. No analysis ever mixes database versions.' },
{ label: 'Reproducible', desc: 'Analysis results include the database versions used. Re-analysis of a case with the same database versions will produce identical results.' },
].map((item) => (
<div key={item.label} className="bg-card border border-border rounded-lg p-4 space-y-1">
<p className="text-base font-medium text-foreground">{item.label}</p>
<p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
</div>
))}
</div>
</section>

{/* Update schedule */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Update Schedule</p>
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="border-b border-border">
<th className="text-left py-2 pr-3 font-medium text-foreground">Database</th>
<th className="text-left py-2 pr-3 font-medium text-foreground">Frequency</th>
<th className="text-left py-2 pr-3 font-medium text-foreground">Current</th>
<th className="text-left py-2 font-medium text-foreground">Note</th>
</tr>
</thead>
<tbody>
{updateSchedule.map((row) => (
<tr key={row.database} className="border-b border-border/50">
<td className="py-2 pr-3 font-mono text-md text-foreground">{row.database}</td>
<td className="py-2 pr-3 text-md text-muted-foreground">{row.frequency}</td>
<td className="py-2 pr-3 font-mono text-md text-muted-foreground">{row.current}</td>
<td className="py-2 text-md text-muted-foreground">{row.note}</td>
</tr>
))}
</tbody>
</table>
</div>
</section>

{/* Validation process */}
<section className="space-y-4">
<p className="text-lg font-semibold text-foreground">Validation Process</p>
<p className="text-base text-muted-foreground leading-relaxed">
Before any database update reaches production, the following validation steps are performed:
</p>
<div className="space-y-3">
{[
{ step: 1, label: 'Record Count Verification', desc: 'Compare new version record counts against previous version. Unexpected drops in coverage trigger manual review.' },
{ step: 2, label: 'Schema Compatibility', desc: 'Verify that all columns and data types expected by the annotation pipeline are present in the new version.' },
{ step: 3, label: 'Reference Cohort Regression', desc: 'Run classification on a curated set of variants with known pathogenicity. Compare results against expected classifications.' },
{ step: 4, label: 'Classification Delta Report', desc: 'Generate a report of all classification changes between database versions. Review reclassifications for clinical appropriateness.' },
{ step: 5, label: 'Deployment Approval', desc: 'Classification delta report is reviewed. If changes are within acceptable limits, the update is approved for production deployment.' },
].map((item) => (
<div key={item.step} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
<div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
<span className="text-md font-semibold text-primary">{item.step}</span>
</div>
<div className="space-y-1">
<p className="text-base font-medium text-foreground">{item.label}</p>
<p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
</div>
</div>
))}
</div>
</section>

{/* Impact on existing analyses */}
<section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
<p className="text-base font-medium text-foreground">Impact on Existing Analyses</p>
<p className="text-md text-muted-foreground leading-relaxed">
Database updates do not retroactively change existing analysis results. Completed analyses retain their original database versions and classifications. To benefit from updated databases, cases can be re-analyzed using the current database versions. The platform tracks which database versions were used for each analysis.
</p>
</section>

{/* Changelog */}
<section className="space-y-3">
<p className="text-lg font-semibold text-foreground">Version History</p>
<p className="text-md text-muted-foreground leading-relaxed">
Database version changes are documented in the <Link href="/docs/changelog" className="text-primary hover:underline font-medium">Changelog</Link>. Each entry includes the database name, old and new versions, number of classification changes in the reference cohort, and the deployment date.
</p>
</section>
</div>
)
}
