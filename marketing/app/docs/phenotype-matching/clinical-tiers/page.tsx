import Link from 'next/link'

export const metadata = {
  title: 'Clinical Tiers | Helix Insight Documentation',
  description: 'Five-tier clinical prioritization system combining phenotype relevance with variant pathogenicity.',
}

const tiers = [
  { tier: 'Tier 1', name: 'Actionable', range: '80-100', color: 'text-red-600', desc: 'Strong phenotype match combined with a Pathogenic or Likely Pathogenic variant. These variants are both pathogenic and relevant to this patient\u2019s clinical presentation. Immediate clinical review recommended.' },
  { tier: 'Tier 2', name: 'Potentially Actionable', range: '60-80', color: 'text-amber-600', desc: 'VUS with strong supporting evidence -- high functional impact, strong phenotype correlation, or both. Candidates for further investigation through literature search, functional studies, or family segregation.' },
  { tier: 'IF', name: 'Incidental Finding', range: '40-60', color: 'text-purple-600', desc: 'Pathogenic or Likely Pathogenic variant in a gene that does NOT match the patient\u2019s phenotype. Clinically important (may be reportable per ACMG Secondary Findings guidelines) but represents a different condition than the referral reason.' },
  { tier: 'Tier 3', name: 'Uncertain', range: '20-40', color: 'text-gray-500', desc: 'VUS with moderate evidence. May warrant monitoring but insufficient for clinical action. Review if Tier 1 and Tier 2 do not explain the phenotype.' },
  { tier: 'Tier 4', name: 'Unlikely', range: '0-20', color: 'text-gray-400', desc: 'Low evidence, benign, likely benign, or common variants. Generally not clinically relevant for this patient. Reported in summary counts only.' },
]

export default function ClinicalTiersPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/phenotype-matching" className="hover:text-primary transition-colors">Phenotype Matching</Link>
          {' / '}
          <span className="text-foreground">Clinical Tiers</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Clinical Tiers</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          After phenotype matching, each variant is assigned to one of five clinical tiers. The tier system answers: &quot;How relevant is this variant to THIS patient&apos;s specific phenotype?&quot; -- not &quot;How pathogenic is this variant in general?&quot;
        </p>
      </div>

      {/* Key insight */}
      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Why Phenotype Relevance Matters</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          A Pathogenic BRCA1 variant found in a patient referred for epilepsy should not outrank a VUS in SCN1A with strong phenotype match for seizures. The tier system ensures that pathogenic variants without phenotype relevance are flagged as Incidental Findings (IF), not mixed with phenotype-confirmed results. This matches clinical reality where secondary findings must be reported separately.
        </p>
      </section>

      {/* Tier definitions */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Tier Definitions</p>
        <div className="space-y-3">
          {tiers.map((t) => (
            <div key={t.tier} className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3">
                <span className={`text-base font-semibold ${t.color}`}>{t.tier}</span>
                <span className="text-base font-medium text-foreground">{t.name}</span>
                <span className="text-sm text-muted-foreground ml-auto">Score range: {t.range}</span>
              </div>
              <p className="text-md text-muted-foreground leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Score structure */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Score Structure</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Each variant receives a clinical priority score (0-100) composed of a tier base score plus a fine score for within-tier ranking. This guarantees non-overlapping score ranges between tiers:
        </p>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-base text-foreground text-center leading-relaxed">
            Final Score = Tier Base Score + Fine Score (0 to 19.99)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium text-foreground">Tier</th>
                <th className="text-left py-2 pr-3 font-medium text-foreground">Base Score</th>
                <th className="text-left py-2 font-medium text-foreground">Score Range</th>
              </tr>
            </thead>
            <tbody>
              {[
                { tier: 'Tier 1 - Actionable', base: '80', range: '80.00 - 99.99' },
                { tier: 'Tier 2 - Potentially Actionable', base: '60', range: '60.00 - 79.99' },
                { tier: 'IF - Incidental Finding', base: '40', range: '40.00 - 59.99' },
                { tier: 'Tier 3 - Uncertain', base: '20', range: '20.00 - 39.99' },
                { tier: 'Tier 4 - Unlikely', base: '0', range: '0.00 - 19.99' },
              ].map((row) => (
                <tr key={row.tier} className="border-b border-border/50">
                  <td className="py-2 pr-3 text-md text-foreground">{row.tier}</td>
                  <td className="py-2 pr-3 text-md text-muted-foreground">{row.base}</td>
                  <td className="py-2 text-md text-muted-foreground">{row.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Fine score */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Within-Tier Fine Scoring</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Within each tier, the fine score (0-19.99) ranks variants by three weighted components:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-40">Phenotype Match</span>
            <span className="text-md text-muted-foreground">40% -- strength of phenotype-genotype correlation</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-40">ACMG Pathogenicity</span>
            <span className="text-md text-muted-foreground">30% -- Pathogenic (100), Likely Pathogenic (85), VUS (50), Likely Benign (15), Benign (0)</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-40">Population Frequency</span>
            <span className="text-md text-muted-foreground">30% -- rarer variants score higher (absent = 100, common = 0)</span>
          </div>
        </div>
      </section>

      {/* Tier determination rules */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Tier Assignment Rules</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Tier assignment is rule-based, not purely score-based. The rules combine ACMG classification, population frequency, variant impact, and phenotype match strength:
        </p>

        <div className="space-y-2">
          <p className="text-base font-medium text-foreground">Always Tier 4</p>
          <div className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-md text-muted-foreground">Benign or Likely Benign variants (regardless of phenotype match)</p>
            <p className="text-md text-muted-foreground">Common variants (gnomAD allele frequency 1% or higher)</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-base font-medium text-foreground">Pathogenic / Likely Pathogenic Pathway</p>
          <div className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-md text-muted-foreground">P/LP + rare + phenotype match at or above 20% = Tier 1 (Actionable)</p>
            <p className="text-md text-muted-foreground">P/LP + rare + HIGH impact + phenotype match at or above 5% = Tier 1 (lower threshold for high-impact variants)</p>
            <p className="text-md text-muted-foreground">P/LP + rare + phenotype match below thresholds = IF (Incidental Finding)</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-base font-medium text-foreground">VUS Pathway</p>
          <div className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-md text-muted-foreground">VUS + HIGH impact + rare = Tier 2 (Potentially Actionable)</p>
            <p className="text-md text-muted-foreground">VUS + HIGH or MODERATE impact + phenotype match at or above 70% + rare = Tier 2</p>
            <p className="text-md text-muted-foreground">VUS + MODERATE or HIGH impact + phenotype match at or above 30% = Tier 3 (Uncertain)</p>
            <p className="text-md text-muted-foreground">VUS + phenotype match at or above 50% + rare = Tier 3</p>
            <p className="text-md text-muted-foreground">Everything else = Tier 4 (Unlikely)</p>
          </div>
        </div>
      </section>

      {/* Frequency scoring */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Frequency Scoring</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Population frequency from gnomAD is converted to a 0-100 score for the fine-scoring component:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium text-foreground">gnomAD AF</th>
                <th className="text-left py-2 pr-3 font-medium text-foreground">Score</th>
                <th className="text-left py-2 font-medium text-foreground">Category</th>
              </tr>
            </thead>
            <tbody>
              {[
                { af: 'Absent (None or 0)', score: '100', cat: 'Not observed in population' },
                { af: '< 0.001%', score: '95', cat: 'Ultra-rare' },
                { af: '< 0.01%', score: '85', cat: 'Very rare' },
                { af: '< 0.1%', score: '70', cat: 'Rare' },
                { af: '< 1%', score: '40', cat: 'Uncommon' },
                { af: '< 5%', score: '15', cat: 'Low frequency' },
                { af: '5% or higher', score: '0', cat: 'Common' },
              ].map((row) => (
                <tr key={row.af} className="border-b border-border/50">
                  <td className="py-2 pr-3 text-md text-foreground">{row.af}</td>
                  <td className="py-2 pr-3 text-md text-muted-foreground">{row.score}</td>
                  <td className="py-2 text-md text-muted-foreground">{row.cat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-md text-muted-foreground">
        For guidance on reading phenotype match scores in practice, see <Link href="/docs/phenotype-matching/interpreting-scores" className="text-primary hover:underline font-medium">Interpreting Scores</Link>.
      </p>
    </div>
  )
}
