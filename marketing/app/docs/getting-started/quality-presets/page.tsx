import Link from 'next/link'

export const metadata = {
  title: 'Quality Presets | Helix Insight Documentation',
  description: 'Three quality filtering levels for variant analysis in Helix Insight -- Strict, Balanced, and Permissive -- with the ClinVar rescue mechanism.',
}

export default function QualityPresetsPage() {
  return (
    <div className="py-10 space-y-6">
      {/* Breadcrumb */}
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/getting-started" className="hover:text-primary transition-colors">Getting Started</Link>
          {' / '}
          <span className="text-foreground">Quality Presets</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Quality Presets</h1>
      </div>

      <p className="text-base text-muted-foreground leading-relaxed">
        Quality filtering occurs before annotation and classification. Three configurable presets control the stringency of variant filtering based on sequencing quality metrics.
      </p>

      {/* Presets table */}
      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-md font-semibold text-foreground">Preset</th>
                <th className="text-left px-5 py-3 text-md font-semibold text-foreground">Quality (QUAL)</th>
                <th className="text-left px-5 py-3 text-md font-semibold text-foreground">Depth (DP)</th>
                <th className="text-left px-5 py-3 text-md font-semibold text-foreground">Genotype Quality (GQ)</th>
                <th className="text-left px-5 py-3 text-md font-semibold text-foreground">Recommended Use</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Strict', qual: '>= 30', depth: '>= 20', gq: '>= 30', use: 'High-confidence clinical reporting' },
                { name: 'Balanced', qual: '>= 20', depth: '>= 15', gq: '>= 20', use: 'Standard clinical analysis (default)' },
                { name: 'Permissive', qual: '>= 10', depth: '>= 10', gq: '>= 10', use: 'Maximum sensitivity / research' },
              ].map((row, i) => (
                <tr key={row.name} className={i < 2 ? 'border-b border-border' : ''}>
                  <td className="px-5 py-3 text-md font-medium text-foreground">{row.name}</td>
                  <td className="px-5 py-3 text-md font-mono text-muted-foreground">{row.qual}</td>
                  <td className="px-5 py-3 text-md font-mono text-muted-foreground">{row.depth}</td>
                  <td className="px-5 py-3 text-md font-mono text-muted-foreground">{row.gq}</td>
                  <td className="px-5 py-3 text-md text-muted-foreground">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* When to use each */}
      <section className="space-y-4">
        <p className="text-lg font-semibold text-foreground">When to Use Each Preset</p>
        <div className="space-y-3">
          {[
            { name: 'Strict', desc: 'Use for final clinical reports where only high-confidence variant calls are acceptable. Minimizes false positives at the cost of potentially missing variants in low-coverage regions.' },
            { name: 'Balanced', desc: 'Recommended for most clinical analyses. Provides a good balance between sensitivity and specificity. This is the default preset.' },
            { name: 'Permissive', desc: 'Use in research settings, for reanalysis of older or lower-quality sequencing data, or in cases where maximum sensitivity is needed even at the cost of more false positives. Review flagged variants carefully.' },
          ].map((item) => (
            <div key={item.name} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.name}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ClinVar rescue */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-3">
        <p className="text-lg font-semibold text-foreground">ClinVar Rescue Mechanism</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Regardless of the selected preset, variants with documented ClinVar Pathogenic or Likely Pathogenic significance that fail quality thresholds are not discarded. They are flagged as "rescued" variants and proceed through the full classification pipeline. This prevents clinically significant findings from being silently excluded due to sequencing quality in low-coverage regions.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          When reviewing rescued variants, pay careful attention to the quality metrics. Low sequencing coverage means the genotype call itself may be unreliable. Consider confirmation by Sanger sequencing for rescued variants that are clinically actionable.
        </p>
      </section>

      <p className="text-md text-muted-foreground">
        For the complete quality filtering documentation with technical details, see the <Link href="/methodology#quality-filtering" className="text-primary hover:underline">Methodology</Link> page.
      </p>
    </div>
  )
}
