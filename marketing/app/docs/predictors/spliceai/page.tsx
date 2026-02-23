import Link from 'next/link'

export const metadata = {
  title: 'SpliceAI | Helix Insight Documentation',
  description: 'How Helix Insight uses SpliceAI deep learning predictions to assess variant impact on mRNA splicing for ACMG classification.',
}

export default function SpliceAIPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/predictors" className="hover:text-primary transition-colors">Computational Predictors</Link>
          {' / '}
          <span className="text-foreground">SpliceAI</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">SpliceAI</h1>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What SpliceAI Is</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          SpliceAI is a deep learning model developed by Illumina that predicts whether a genetic variant will disrupt normal mRNA splicing. Splicing is the process by which the cell removes non-coding sections (introns) from the pre-mRNA and joins the coding sections (exons) to produce the final messenger RNA. Variants that disrupt this process can lead to abnormal proteins or complete loss of protein production, even if they do not directly change the amino acid sequence.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The model was published in Cell (Jaganathan et al., 2019) and is widely used in clinical genetics laboratories. It is one of two computational tools in Helix Insight that directly influences ACMG classification.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Four Delta Scores</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          SpliceAI produces four scores, each representing a different type of splice disruption. Each score ranges from 0 (no impact) to 1 (certain disruption). The maximum of the four scores is used for classification thresholds.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Score</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Name</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {[
                { score: 'DS_AG', name: 'Acceptor Gain', meaning: 'The variant creates a new splice acceptor site where one did not exist' },
                { score: 'DS_AL', name: 'Acceptor Loss', meaning: 'The variant destroys an existing splice acceptor site' },
                { score: 'DS_DG', name: 'Donor Gain', meaning: 'The variant creates a new splice donor site where one did not exist' },
                { score: 'DS_DL', name: 'Donor Loss', meaning: 'The variant destroys an existing splice donor site' },
              ].map((row, i) => (
                <tr key={row.score} className={i < 3 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.score}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.name}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Interpreting Scores</p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Max Score Range</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {[
                { range: '0.0 -- 0.1', interp: 'No predicted splice impact. The variant is unlikely to affect splicing.' },
                { range: '0.1 -- 0.2', interp: 'Low predicted impact. Some splice effect possible but below the clinical evidence threshold.' },
                { range: '0.2 -- 0.5', interp: 'Moderate predicted impact. Supporting evidence for spliceogenicity per ClinGen SVI 2023.' },
                { range: '0.5 -- 0.8', interp: 'High predicted impact. Strong prediction of splice disruption.' },
                { range: '0.8 -- 1.0', interp: 'Very high predicted impact. Near-certain splice disruption.' },
              ].map((row, i) => (
                <tr key={row.range} className={i < 4 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground whitespace-nowrap">{row.range}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.interp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">How Helix Insight Uses SpliceAI</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          SpliceAI scores are used in three distinct ways within the classification engine. Each role has a specific threshold and clinical rationale.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Condition</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">ACMG Effect</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  cond: 'Max score >= 0.2',
                  effect: 'PP3_splice (Supporting pathogenic)',
                  rationale: 'Supporting evidence for splice impact, applied as an independent path separate from the BayesDel missense assessment. This threshold follows ClinGen SVI 2023 recommendations.',
                },
                {
                  cond: 'Max score < 0.1',
                  effect: 'Required for BP4',
                  rationale: 'A variant cannot receive computational benign evidence (BP4) if SpliceAI predicts any splice impact. This prevents benign classification when splice disruption is possible.',
                },
                {
                  cond: 'Max score <= 0.1',
                  effect: 'Required for BP7',
                  rationale: 'Synonymous variants are only classified as Likely Benign (via BP7) when SpliceAI confirms no splice impact. Synonymous variants near splice junctions can be pathogenic through aberrant splicing.',
                },
              ].map((row, i) => (
                <tr key={i} className={i < 2 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground whitespace-nowrap">{row.cond}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.effect}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">PVS1 Double-Counting Guard</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          When PVS1 (loss-of-function) is triggered for a variant, PP3_splice is not applied. This prevents counting the same biological mechanism -- splice disruption leading to loss of function -- as both PVS1 and PP3 evidence. A splice donor variant that causes a frameshift already receives Very Strong evidence through PVS1; adding PP3_splice on top would double-count the same observation. This follows ClinGen SVI 2023 recommendations (Walker et al., 2023).
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Score Source</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          SpliceAI scores are precomputed from Ensembl MANE transcript predictions (Release 113). They are not computed at runtime. This ensures reproducibility -- the same variant always receives the same SpliceAI scores regardless of when the analysis is run.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Limitations</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          SpliceAI predictions are computational. RNA splicing studies (RT-PCR, minigene assays) remain the gold standard for confirming splice-altering effects. Scores are computed on MANE Select transcripts only, so non-MANE transcript-specific splicing effects may be missed. Deep intronic variants beyond the SpliceAI prediction window (typically +/- 50bp from precomputed scores) may not be captured. The model was trained on known splice sites, so novel splice mechanisms not represented in the training data may not be predicted.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Clinical Relevance</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Approximately 10-15% of pathogenic variants cause disease through aberrant splicing. SpliceAI provides a fast, reproducible screen for splice impact that can guide whether RNA studies are warranted. When reviewing variants with high SpliceAI scores, consider recommending RT-PCR or minigene assay confirmation.
        </p>
      </section>

      <div className="space-y-1">
        <p className="text-md text-muted-foreground">
          Reference: Jaganathan K, et al. Cell. 2019;176(3):535-548. <a href="https://pubmed.ncbi.nlm.nih.gov/30661751/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 30661751</a>
        </p>
        <p className="text-md text-muted-foreground">
          ClinGen SVI: Walker LC, et al. Am J Hum Genet. 2023;110(7):1046-1067. <a href="https://pubmed.ncbi.nlm.nih.gov/37352859/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 37352859</a>
        </p>
      </div>
    </div>
  )
}
