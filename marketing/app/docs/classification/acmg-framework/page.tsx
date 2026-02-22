import Link from 'next/link'

export const metadata = {
  title: 'ACMG Framework | Helix Insight Documentation',
  description: 'The ACMG/AMP 2015 variant classification framework as implemented in Helix Insight with the Bayesian point-based system.',
}

export default function AcmgFrameworkPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/classification" className="hover:text-primary transition-colors">Classification</Link>
          {' / '}
          <span className="text-foreground">ACMG Framework</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">ACMG/AMP 2015 Framework</h1>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What Is ACMG/AMP 2015</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The ACMG/AMP 2015 framework is a joint consensus recommendation from the American College of Medical Genetics and Genomics and the Association for Molecular Pathology, published in Genetics in Medicine (Richards et al., 2015, PMID: 25741868). It is the international standard for clinical variant classification, used by laboratories worldwide and required by many accreditation bodies.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Evidence Criteria</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The framework defines 28 evidence criteria organized by direction (pathogenic or benign) and strength level. Each criterion represents a specific type of evidence that supports or argues against variant pathogenicity.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Strength Level</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Count</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Bayesian Points</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Examples</th>
              </tr>
            </thead>
            <tbody>
              {[
                { level: 'Stand-alone', count: '1', points: 'Override to Benign', examples: 'BA1' },
                { level: 'Very Strong', count: '1', points: '+8', examples: 'PVS1' },
                { level: 'Strong (pathogenic)', count: '4', points: '+4', examples: 'PS1, PS2, PS3, PS4' },
                { level: 'Moderate', count: '6', points: '+2', examples: 'PM1, PM2, PM3, PM4, PM5, PM6' },
                { level: 'Supporting (pathogenic)', count: '6', points: '+1', examples: 'PP1-PP5, PP3_splice' },
                { level: 'Strong (benign)', count: '4', points: '-4', examples: 'BS1, BS2, BS3, BS4' },
                { level: 'Supporting (benign)', count: '6', points: '-1', examples: 'BP1-BP7' },
              ].map((row, i) => (
                <tr key={row.level} className={i < 6 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.level}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.count}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.points}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Helix Insight Implementation</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix Insight automates 19 of the 28 criteria. The remaining 9 require information not available from a single VCF file -- family segregation data, functional study results, de novo confirmation, or case-level clinical context. These must be evaluated manually by the reviewing geneticist.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Classification uses the Bayesian point-based system (Tavtigian et al. 2018, 2020), which is mathematically equivalent to the original 18 ACMG combining rules while properly classifying evidence combinations not explicitly covered by the 2015 guidelines. Computational predictor evidence (PP3/BP4) uses BayesDel_noAF with ClinGen SVI calibrated thresholds (Pejaver et al. 2022), providing evidence strength modulation from Supporting through Strong.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">VCEP Gene-Specific Specifications</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          For approximately 50-60 genes with published ClinGen Variant Curation Expert Panel (VCEP) specifications, gene-specific thresholds are available as an optional overlay. These modify frequency cutoffs (BA1, BS1, PM2) and criterion applicability (PVS1) based on the published VCEP specification. The overlay is enabled by default and can be toggled per case. When applied, an audit trail marker (e.g., "[VCEP:Hearing Loss v1.0]") appears in the criteria string.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Key Principle</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          The ACMG framework provides a structured, reproducible method for variant classification. Two geneticists using the same evidence should reach the same classification. Helix Insight ensures this reproducibility by applying identical rules to every variant, with full transparency on which criteria were triggered and why.
        </p>
      </section>

      <p className="text-md text-muted-foreground">
        Reference: Richards S, et al. Genetics in Medicine. 2015;17(5):405-424. <a href="https://pubmed.ncbi.nlm.nih.gov/25741868/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 25741868</a>
      </p>
    </div>
  )
}
