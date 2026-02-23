import Link from 'next/link'

export const metadata = {
  title: 'Interpreting Scores | Helix Insight Documentation',
  description: 'How to read phenotype match scores and what factors affect their accuracy.',
}

export default function InterpretingScoresPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/phenotype-matching" className="hover:text-primary transition-colors">Phenotype Matching</Link>
          {' / '}
          <span className="text-foreground">Interpreting Scores</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Interpreting Scores</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          Phenotype match scores range from 0 to 100 and reflect how closely a gene&apos;s known disease phenotype resembles the patient&apos;s clinical presentation. This page explains what the scores mean in practice and what factors can affect their accuracy.
        </p>
      </div>

      {/* Score ranges */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Score Ranges</p>
        <div className="space-y-3">
          {[
            { range: '80-100', label: 'Excellent Match', desc: 'The gene\u2019s known disease phenotype closely resembles the patient\u2019s presentation. Most patient HPO terms have strong matches in the gene\u2019s profile. High confidence in phenotype-genotype correlation.' },
            { range: '60-79', label: 'Good Match', desc: 'Significant phenotypic overlap. Several patient terms match well. The gene should be considered a strong candidate even if not all features are represented.' },
            { range: '40-59', label: 'Moderate Match', desc: 'Some shared features between the patient\u2019s presentation and the gene\u2019s profile. May represent partial phenotypic overlap or an atypical presentation of the associated disease.' },
            { range: '20-39', label: 'Weak Match', desc: 'Few shared phenotypic features. The patient\u2019s presentation has limited overlap with the gene\u2019s known disease spectrum.' },
            { range: '0-19', label: 'Poor Match', desc: 'Little to no phenotypic similarity. The gene\u2019s associated diseases do not match the patient\u2019s clinical features.' },
          ].map((item) => (
            <div key={item.range} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primary">{item.range}</span>
                <span className="text-base font-medium text-foreground">{item.label}</span>
              </div>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Individual term matches */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Individual Term Matches</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Beyond the overall score, Helix Insight reports which specific patient HPO terms matched and how well. For each patient term, the system identifies the best-matching gene HPO term and its similarity score. A match is considered significant when the individual similarity score exceeds 0.5 (on the 0-1 Lin similarity scale).
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Reviewing individual matches helps the geneticist understand why a gene scored the way it did. A gene with 2 of 3 patient terms matched at high similarity is a stronger candidate than one with 3 of 3 matched at low similarity, even if the overall score is similar.
        </p>
      </section>

      {/* Factors affecting accuracy */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Factors Affecting Accuracy</p>
        <div className="space-y-3">
          {[
            { label: 'HPO term specificity', desc: 'More specific terms (e.g., "Focal clonic seizure" instead of "Seizure") produce more discriminating scores. Broad terms match many genes equally, reducing the ability to differentiate between candidates.' },
            { label: 'Number of patient terms', desc: '5-15 terms is optimal. Too few terms may miss relevant matches. Too many terms can dilute the average score if some are not well-characterized in the HPO database.' },
            { label: 'Gene annotation completeness', desc: 'Well-characterized genes (e.g., BRCA1, SCN1A) have extensive HPO profiles and score more accurately. Recently discovered disease genes or genes with limited clinical descriptions may score lower than expected.' },
            { label: 'Atypical presentations', desc: 'If the patient has an unusual phenotype for the underlying disease, the standard HPO profile for the gene may not capture the presentation well. The score reflects what is known in the database, not all possible presentations.' },
            { label: 'Ontology structure', desc: 'The HPO hierarchy sometimes groups terms in ways that may not perfectly reflect clinical similarity. Scores should be interpreted as prioritization guides, not definitive clinical judgments.' },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.label}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* When scores may be misleading */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">When Scores May Be Misleading</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Under-annotated genes</p>
            <p className="text-md text-muted-foreground leading-relaxed">Genes with few HPO annotations will score low even if truly relevant. If the gene has recently been associated with disease and the HPO database has not yet been updated, the phenotype match will underestimate the gene&apos;s relevance.</p>
          </div>
          <div className="border-t border-border/50" />
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Broad HPO terms</p>
            <p className="text-md text-muted-foreground leading-relaxed">Using non-specific terms like &quot;Abnormality of the nervous system&quot; instead of specific seizure types dilutes the score. The algorithm cannot distinguish between genes when the input terms match many HPO profiles equally.</p>
          </div>
          <div className="border-t border-border/50" />
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Multi-system diseases</p>
            <p className="text-md text-muted-foreground leading-relaxed">If a patient has features from multiple organ systems and only some are entered as HPO terms, the score for a gene that matches the missing features will be underestimated.</p>
          </div>
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Recommendation</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Always review Tier 1 and Tier 2 genes regardless of exact score. Use the phenotype match score as a prioritization guide, not a definitive answer. The score helps rank hundreds of candidate genes, but the final clinical interpretation remains with the geneticist.
        </p>
      </section>

      <p className="text-md text-muted-foreground">
        For guidance on selecting HPO terms that maximize score accuracy, see the <Link href="/docs/phenotype-matching/hpo-term-selection-guide" className="text-primary hover:underline font-medium">HPO Term Selection Guide</Link>.
      </p>
    </div>
  )
}
