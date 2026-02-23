import Link from 'next/link'

export const metadata = {
  title: 'Consensus Calculation | Helix Insight Documentation',
  description: 'How Helix Insight computes PP3 and BP4 ACMG criteria using BayesDel_noAF with ClinGen SVI calibrated evidence strength thresholds.',
}

export default function ConsensusCalculationPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/predictors" className="hover:text-primary transition-colors">Computational Predictors</Link>
          {' / '}
          <span className="text-foreground">Consensus Calculation</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">PP3/BP4 Evidence Calculation</h1>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">BayesDel_noAF with ClinGen SVI Calibration</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix Insight uses BayesDel_noAF as the single computational tool for determining PP3 (computational evidence supports a deleterious effect) and BP4 (computational evidence suggests no impact). BayesDel is a meta-predictor that integrates deleteriousness scores from multiple tools into a single calibrated score. The "_noAF" variant explicitly excludes allele frequency from its model, which is critical: since the ACMG framework already has frequency-based criteria (PM2, BA1, BS1), using a predictor that includes frequency would double-count the same evidence.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The evidence strength thresholds were calibrated by the ClinGen Sequence Variant Interpretation (SVI) Working Group against clinical truth sets (Pejaver et al. 2022). These thresholds map BayesDel_noAF score ranges directly to ACMG evidence strength levels, enabling evidence strength modulation -- a feature not possible with simpler binary (damaging/benign) approaches.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Two Independent Paths</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          PP3 and BP4 are evaluated through two independent paths that capture different biological mechanisms. These paths do not overlap: a given variant is assessed through the missense path, the splice path, or both, depending on the available data.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Path</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Tool</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Applies To</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Evidence</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">Missense</td>
                <td className="px-4 py-2 text-md text-muted-foreground">BayesDel_noAF</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Variants with BayesDel score available</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PP3 (Strong / Moderate / Supporting) or BP4 (Moderate / Supporting)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md font-medium text-foreground">Splice</td>
                <td className="px-4 py-2 text-md text-muted-foreground">SpliceAI</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Variants with SpliceAI score available</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PP3_splice (Supporting)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">PP3 Pathogenic Evidence (BayesDel)</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The ClinGen SVI calibration provides three evidence strength levels for pathogenic computational evidence. Higher BayesDel scores produce stronger evidence. This graduated approach reflects the clinical reality that a variant with a very high pathogenicity score provides more compelling evidence than one near the minimum threshold.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">BayesDel_noAF Score</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Evidence Strength</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Criteria Label</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Bayesian Points</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">{'>= 0.518'}</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Strong</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PP3_Strong</td>
                <td className="px-4 py-2 text-md text-muted-foreground">+4</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">0.290 -- 0.517</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Moderate</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PP3_Moderate</td>
                <td className="px-4 py-2 text-md text-muted-foreground">+2</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md font-medium text-foreground">0.130 -- 0.289</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Supporting</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PP3</td>
                <td className="px-4 py-2 text-md text-muted-foreground">+1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">PP3 Splice Evidence (SpliceAI)</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Independently of the BayesDel missense assessment, SpliceAI provides splice-specific evidence. When the maximum SpliceAI delta score is 0.2 or above, PP3_splice is triggered as Supporting pathogenic evidence (+1 Bayesian point). This threshold follows ClinGen SVI 2023 recommendations (Walker et al., 2023).
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          PP3_splice is excluded when PVS1 (loss-of-function) applies to the same variant. This prevents double-counting splice disruption that already contributed to the Very Strong PVS1 criterion. See <Link href="/docs/predictors/spliceai" className="text-primary hover:underline">SpliceAI</Link> for full details.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">BP4 Benign Evidence (BayesDel)</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Low BayesDel scores provide evidence that a variant is computationally predicted to be benign. Two evidence strength levels are calibrated:
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">BayesDel_noAF Score</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Evidence Strength</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Criteria Label</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Bayesian Points</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">{'<= -0.361'}</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Moderate</td>
                <td className="px-4 py-2 text-md text-muted-foreground">BP4_Moderate</td>
                <td className="px-4 py-2 text-md text-muted-foreground">-2</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md font-medium text-foreground">-0.360 -- -0.181</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Supporting</td>
                <td className="px-4 py-2 text-md text-muted-foreground">BP4</td>
                <td className="px-4 py-2 text-md text-muted-foreground">-1</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-base text-muted-foreground leading-relaxed">
          BP4 at any level requires that SpliceAI max score is below 0.1 or absent. A variant cannot receive computational benign evidence if there is any predicted splice impact.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">PM1 + PP3 Point-Sum Cap</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The ClinGen SVI Working Group recommends that the combined evidence from PM1 (variant in a functional domain) and PP3 (computational prediction) should not exceed Strong equivalent (4 Bayesian points). This prevents over-counting evidence when a variant is both in a known functional domain and computationally predicted to be damaging -- since these two observations are not fully independent.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          In practice, PM1 contributes Moderate evidence (2 points). When PM1 is triggered and BayesDel reaches the Strong threshold (&gt;= 0.518), PP3 is automatically downgraded from Strong (4 points) to Moderate (2 points), keeping the combined total at 4 points. When PM1 is not triggered, PP3_Strong is applied at full strength.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Scenario</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">PM1</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">PP3</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Combined Points</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md text-muted-foreground">No functional domain, BayesDel &gt;= 0.518</td>
                <td className="px-4 py-2 text-md text-muted-foreground">-- (0 pts)</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PP3_Strong (4 pts)</td>
                <td className="px-4 py-2 text-md font-medium text-foreground">4</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md text-muted-foreground">Pfam domain, BayesDel &gt;= 0.518</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PM1 (2 pts)</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PP3_Moderate (2 pts, capped)</td>
                <td className="px-4 py-2 text-md font-medium text-foreground">4</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md text-muted-foreground">Pfam domain, BayesDel 0.290-0.517</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PM1 (2 pts)</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PP3_Moderate (2 pts)</td>
                <td className="px-4 py-2 text-md font-medium text-foreground">4</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md text-muted-foreground">Pfam domain, BayesDel 0.130-0.289</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PM1 (2 pts)</td>
                <td className="px-4 py-2 text-md text-muted-foreground">PP3 (1 pt)</td>
                <td className="px-4 py-2 text-md font-medium text-foreground">3</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Indeterminate Zone</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          BayesDel_noAF scores between -0.180 and 0.129 fall in the indeterminate zone -- neither PP3 nor BP4 is applied. This is intentional: variants in this range do not have sufficient computational signal to contribute evidence in either direction. Approximately 20-30% of rare missense variants fall in this zone (Stenton et al. 2024), which prevents computational evidence from being over-applied.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Expected Evidence Yield</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          For a typical case with approximately 75 rare missense variants in disease genes, the expected distribution is approximately: 1 variant receiving PP3_Strong, 3-5 receiving PP3_Moderate, 3-5 receiving PP3_Supporting, 41-49 receiving BP4, and 17-19 in the indeterminate zone (Stenton et al. 2024). PP3_Strong is rare enough to avoid excessive reclassification of VUS variants.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Why Not a Multi-Predictor Consensus</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Some variant classification systems use a weighted consensus across multiple individual predictors (SIFT, PolyPhen, CADD, etc.) to determine PP3/BP4. Helix Insight uses BayesDel_noAF as a single calibrated tool instead, for three reasons: it has ClinGen SVI-calibrated thresholds directly mapping to ACMG evidence strength levels; it excludes allele frequency, avoiding circular reasoning with PM2/BA1/BS1; and it provides evidence strength modulation (Supporting, Moderate, Strong) which a binary consensus approach cannot. The individual predictors (SIFT, AlphaMissense, MetaSVM, DANN, PhyloP, GERP) remain displayed in the results for additional clinical context.
        </p>
      </section>

      <div className="space-y-1">
        <p className="text-md text-muted-foreground">
          ClinGen SVI calibration: Pejaver V, et al. Am J Hum Genet. 2022;109(12):2163-2177. <a href="https://pubmed.ncbi.nlm.nih.gov/36413997/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 36413997</a>
        </p>
        <p className="text-md text-muted-foreground">
          Evidence yield: Stenton SL, et al. Genet Med. 2024;26(11):101213. <a href="https://pubmed.ncbi.nlm.nih.gov/39030733/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 39030733</a>
        </p>
        <p className="text-md text-muted-foreground">
          ClinGen SVI splice: Walker LC, et al. Am J Hum Genet. 2023;110(7):1046-1067. <a href="https://pubmed.ncbi.nlm.nih.gov/37352859/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 37352859</a>
        </p>
        <p className="text-md text-muted-foreground">
          BayesDel original: Feng BJ. Hum Mutat. 2017;38(3):243-251.
        </p>
      </div>
    </div>
  )
}
