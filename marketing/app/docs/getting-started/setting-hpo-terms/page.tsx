import Link from 'next/link'

export const metadata = {
  title: 'Setting HPO Terms | Helix Insight Documentation',
  description: 'How to provide patient phenotype information using HPO terms and why it improves variant analysis in Helix Insight.',
}

export default function SettingHpoTermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
      {/* Breadcrumb */}
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/getting-started" className="hover:text-primary transition-colors">Getting Started</Link>
          {' / '}
          <span className="text-foreground">Setting HPO Terms</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Setting HPO Terms</h1>
      </div>

      {/* What are HPO terms */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What Are HPO Terms</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The Human Phenotype Ontology (HPO) is a standardized clinical vocabulary for phenotypic abnormalities observed in human disease. It contains over 17,000 terms organized in a hierarchical structure where specific terms (such as "Focal clonic seizure", HP:0002266) are children of broader terms (such as "Seizure", HP:0001250). Using standardized HPO terms enables computational comparison across patients, diseases, and databases.
        </p>
      </section>

      {/* Why they matter */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Why HPO Terms Matter</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Providing HPO terms enables three platform features that significantly improve the clinical relevance of results. First, the PP4 ACMG criterion activates when patient phenotype matches a gene with a known disease association, adding supporting pathogenic evidence. Second, the Phenotype Matching service scores every candidate gene against the patient's presentation, producing a 0-100 similarity score and clinical tier assignment. Third, the Screening service uses phenotype correlation to boost prioritization of variants in phenotype-relevant genes.
        </p>
      </section>

      {/* How to select */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Selecting HPO Terms</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Be specific. "Seizure" (HP:0001250) provides more discrimination than "Abnormality of the nervous system" (HP:0012638). Include findings from all affected organ systems, not just the primary complaint. Negative findings with clinical significance should also be included -- the platform handles negation. Five to fifteen specific terms is optimal for most cases.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The platform provides two input methods: manual HPO term search and selection with real-time autocomplete, and free-text clinical description where the platform automatically extracts HPO terms using ontology matching with negation detection.
        </p>
      </section>

      {/* Domain-specific guidance */}
      <section className="space-y-4">
        <p className="text-lg font-semibold text-foreground">HPO Term Selection by Clinical Domain</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { domain: 'Neurodevelopmental', terms: 'Seizure types and onset age, developmental milestones (sitting, walking, speech), brain MRI findings, EEG patterns, behavioral features.' },
            { domain: 'Cardiology', terms: 'Specific cardiomyopathy type (dilated, hypertrophic, restrictive), arrhythmia pattern, ECG findings, echocardiographic measurements, family history of sudden cardiac death.' },
            { domain: 'Nephrology', terms: 'Specific renal finding (cysts, proteinuria, hematuria), biopsy findings, extrarenal manifestations.' },
            { domain: 'Metabolic', terms: 'Specific metabolites elevated or decreased, enzyme activity levels, organ involvement, response to treatment.' },
            { domain: 'Neonatal', terms: 'Gestational age, birth parameters, feeding difficulties, hypotonia, seizure onset, congenital anomalies, metabolic screening results.' },
          ].map((item) => (
            <div key={item.domain} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.domain}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.terms}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Without HPO terms */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-3">
        <p className="text-lg font-semibold text-foreground">Analysis Without HPO Terms</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The platform works fully without HPO terms. Variant classification, annotation, and all non-phenotype-dependent criteria proceed normally. However, phenotype-dependent features -- PP4, phenotype matching, and phenotype-based screening boosts -- will not be available. For clinical cases, providing HPO terms is strongly recommended.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        For more on how phenotype information is used in prioritization, see <Link href="/docs/phenotype-matching" className="text-primary hover:underline">Phenotype Matching</Link>.
      </p>
    </div>
  )
}
