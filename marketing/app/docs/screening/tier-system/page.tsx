import Link from 'next/link'

export const metadata = {
  title: 'Tier System | Helix Insight Documentation',
  description: 'Four-tier variant priority ranking with clinical boosts, actionability labels, and tier promotion rules.',
}

export default function TierSystemPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/screening" className="hover:text-primary transition-colors">Screening</Link>
          {' / '}
          <span className="text-foreground">Tier System</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Tier System</h1>
      </div>

      <section className="space-y-3">
        <p className="text-base text-muted-foreground leading-relaxed">
          After scoring, every variant is assigned to one of four priority tiers. Tier assignment considers both the total weighted score and individual component peaks -- a single exceptional signal can elevate a variant to Tier 1. Clinical boosts from patient context can further promote variants to higher tiers.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Tier Definitions</p>
        <div className="space-y-3">
          {[
            { tier: 'Tier 1', color: 'bg-red-500/10 text-red-700', label: 'High Priority', desc: 'Immediate clinical review required. These variants have the strongest evidence for clinical relevance to this patient. Tier 1 is capped at 20 variants by default to keep the review set manageable.' },
            { tier: 'Tier 2', color: 'bg-orange-500/10 text-orange-700', label: 'Moderate Priority', desc: 'Should be reviewed if time permits. These variants have moderate evidence for clinical relevance and may become Tier 1 with additional clinical information.' },
            { tier: 'Tier 3', color: 'bg-yellow-500/10 text-yellow-700', label: 'Low Priority', desc: 'Future consideration. These variants have weak evidence for immediate clinical relevance but may be worth monitoring for reclassification or new evidence.' },
            { tier: 'Tier 4', color: 'bg-gray-500/10 text-gray-700', label: 'Very Low Priority', desc: 'Likely not clinically relevant. Excluded from results by default. Can be included via settings for comprehensive review.' },
          ].map((item) => (
            <div key={item.tier} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-sm font-medium rounded ${item.color}`}>{item.tier}</span>
                <span className="text-base font-medium text-foreground">{item.label}</span>
              </div>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Base Tier Assignment</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The base tier is determined from the weighted total score and individual component peaks. Peak-based promotion ensures that a single exceptional signal (for example, a highly constrained gene with pLI = 0.99) elevates a variant to Tier 1 even if other components are moderate.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Tier</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Condition</th>
              </tr>
            </thead>
            <tbody>
              {[
                { tier: 'Tier 1', cond: 'Total score >= 0.80, OR any of constraint / dosage / deleteriousness / age_relevance >= 0.9' },
                { tier: 'Tier 2', cond: 'Total score >= 0.50' },
                { tier: 'Tier 3', cond: 'Total score >= 0.20' },
                { tier: 'Tier 4', cond: 'Total score < 0.20' },
              ].map((row, i) => (
                <tr key={row.tier} className={i < 3 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.tier}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.cond}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Clinical Boosts</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          After base scoring, patient-specific clinical context adds priority boosts. Boosts are additive to the base score and capped at a total of 1.0. These boosts can promote variants to higher tiers than their base score alone would justify.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Boost</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Condition</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                { boost: 'ACMG Class', cond: 'Pathogenic classification', amount: '+0.30' },
                { boost: 'ACMG Class', cond: 'Likely Pathogenic classification', amount: '+0.20' },
                { boost: 'Phenotype Tier', cond: 'Tier 1 phenotype match', amount: '+0.25' },
                { boost: 'Phenotype Tier', cond: 'Tier 2 phenotype match', amount: '+0.15' },
                { boost: 'Family History', cond: 'Cancer gene + family history', amount: '+0.25' },
                { boost: 'Family History', cond: 'Cardiac gene + family history', amount: '+0.20' },
                { boost: 'Sex-Linked', cond: 'X-linked gene in male patient', amount: '+0.30' },
                { boost: 'Sex-Linked', cond: 'X-linked gene in female patient', amount: '+0.10' },
                { boost: 'Consanguinity', cond: 'Homozygous variant + consanguinity', amount: '+0.25' },
                { boost: 'Ethnicity', cond: 'Ashkenazi Jewish founder gene', amount: '+0.15 to +0.20' },
                { boost: 'De Novo', cond: 'Trio sample in highly constrained gene', amount: '+0.20' },
                { boost: 'Pregnancy', cond: 'Prenatal actionable gene + pregnant', amount: '+0.20' },
              ].map((row, i) => (
                <tr key={i} className={i < 11 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.boost}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.cond}</td>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Final Tier Promotion</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          After all boosts are applied, the final tier is recalculated. Certain conditions guarantee Tier 1 placement regardless of the base score:
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Final Tier</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Condition</th>
              </tr>
            </thead>
            <tbody>
              {[
                { tier: 'Tier 1', cond: 'Any Pathogenic or Likely Pathogenic variant (ACMG boost > 0)' },
                { tier: 'Tier 1', cond: 'Tier 1 phenotype match (phenotype boost >= 0.25)' },
                { tier: 'Tier 1', cond: 'Boosted score >= 0.70' },
                { tier: 'Tier 2', cond: 'Tier 2 phenotype match OR boosted score >= 0.50' },
                { tier: 'Tier 3', cond: 'Boosted score >= 0.20' },
                { tier: 'Tier 4', cond: 'Boosted score < 0.20' },
              ].map((row, i) => (
                <tr key={i} className={i < 5 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.tier}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.cond}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Clinical Actionability Labels</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Each variant also receives a clinical actionability label indicating the recommended clinical response:
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Label</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Criteria</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Immediate', criteria: 'Pathogenic or Likely Pathogenic in an ACMG Secondary Findings gene (81 genes including BRCA1/2, MYBPC3, KCNH2, LDLR)' },
                { label: 'Monitoring', criteria: 'Pathogenic or Likely Pathogenic in other gene, or total score > 0.7' },
                { label: 'Future', criteria: 'Total score > 0.4' },
                { label: 'Research', criteria: 'Everything else' },
              ].map((row, i) => (
                <tr key={i} className={i < 3 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.label}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.criteria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
