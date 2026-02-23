import Link from 'next/link'

export const metadata = {
  title: 'HPO Term Selection Guide | Helix Insight Documentation',
  description: 'Practical guidance for selecting HPO terms that maximize phenotype matching accuracy.',
}

export default function HpoTermSelectionGuidePage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/phenotype-matching" className="hover:text-primary transition-colors">Phenotype Matching</Link>
          {' / '}
          <span className="text-foreground">HPO Term Selection Guide</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">HPO Term Selection Guide</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          The quality of phenotype matching depends directly on the HPO terms selected by the geneticist. More specific, comprehensive term sets produce more accurate and discriminating phenotype match scores.
        </p>
      </div>

      {/* General principles */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">General Principles</p>
        <div className="space-y-3">
          {[
            { label: 'Be specific', desc: 'Use "Focal clonic seizure" (HP:0002266) instead of just "Seizure" (HP:0001250). More specific terms have higher information content and produce more discriminating similarity scores. The platform\u2019s autocomplete helps find the most specific matching term.' },
            { label: 'Be comprehensive', desc: 'Include findings from all organ systems, not just the primary complaint. A patient referred for seizures may also have microcephaly, feeding difficulties, and hypotonia -- all of these help narrow the differential diagnosis.' },
            { label: 'Include negative findings', desc: 'When clinically significant, include negative findings. The platform\u2019s text extraction handles negation (e.g., "no hearing loss" will identify the term but mark it as negated). Negative findings help exclude conditions.' },
            { label: 'Aim for 5-15 terms', desc: 'This range is optimal for most cases. Fewer than 5 terms may miss relevant matches. More than 15 terms can dilute the average score if some are poorly characterized in the HPO database.' },
            { label: 'Prefer observed over inferred', desc: 'Select HPO terms for findings that have been directly observed or documented, not suspected diagnoses. "Seizure" is better than "Epilepsy" if the patient has had a seizure but no formal epilepsy diagnosis.' },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.label}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Domain-specific guidance */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Domain-Specific Guidance</p>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-base font-medium text-foreground">Neurodevelopmental</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              Include seizure type and age of onset, developmental milestones (sitting, walking, speech), brain MRI findings (e.g., &quot;Cortical dysplasia&quot;, &quot;Thin corpus callosum&quot;), EEG patterns if specific, behavioral features (e.g., &quot;Stereotypy&quot;, &quot;Self-injurious behavior&quot;), and tone abnormalities (hypotonia or spasticity).
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-base font-medium text-foreground">Cardiology</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              Specify the cardiomyopathy type (dilated, hypertrophic, restrictive), arrhythmia type, ECG findings (e.g., &quot;Prolonged QT interval&quot;), echocardiographic measurements, family history of sudden cardiac death, and any extracardiac features.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-base font-medium text-foreground">Nephrology</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              Include the specific renal finding (cysts, proteinuria, hematuria), biopsy findings if available, extrarenal manifestations (hearing loss, eye abnormalities), and age of onset. Terms like &quot;Renal insufficiency&quot; are less informative than &quot;Autosomal dominant polycystic kidney disease&quot; when specific.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-base font-medium text-foreground">Metabolic</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              Include specific metabolites elevated or decreased, enzyme activity levels, organ involvement, and response to treatment. Terms describing biochemical abnormalities (e.g., &quot;Elevated serum lactate&quot;) are often more specific than clinical descriptions.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-base font-medium text-foreground">Neonatal</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              Particularly relevant for newborn screening contexts. Include gestational age-related findings, birth parameters, feeding difficulties, hypotonia, seizure onset age, congenital anomalies, and metabolic screening results. Early-onset findings are often the most diagnostically informative.
            </p>
          </div>
        </div>
      </section>

      {/* Using the platform tools */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Using the Platform Tools</p>
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-base font-medium text-foreground">Autocomplete Search</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              Start typing a clinical finding in the HPO term input field. The platform searches across all 17,000+ HPO terms in real time, including synonyms. Select the most specific term from the suggestions.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-base font-medium text-foreground">Free-Text Extraction</p>
            <p className="text-md text-muted-foreground leading-relaxed">
              Paste a clinical description or referral letter into the text extraction field. The platform identifies HPO terms mentioned in the text, handles negation (marking terms preceded by &quot;no&quot;, &quot;without&quot;, &quot;denies&quot;, etc.), and returns only positive findings. Review the extracted terms and adjust as needed before running phenotype matching.
            </p>
          </div>
        </div>
      </section>

      {/* Common mistakes */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Common Mistakes</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Using only the chief complaint</p>
            <p className="text-md text-muted-foreground leading-relaxed">Entering only &quot;Seizure&quot; for an epilepsy patient misses the opportunity to differentiate between hundreds of epilepsy-associated genes. Add seizure type, developmental status, MRI findings, and any other relevant features.</p>
          </div>
          <div className="border-t border-border/50" />
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Selecting parent terms when children exist</p>
            <p className="text-md text-muted-foreground leading-relaxed">&quot;Abnormality of the nervous system&quot; matches thousands of genes equally. If the patient has seizures, select &quot;Seizure&quot; or an even more specific child term.</p>
          </div>
          <div className="border-t border-border/50" />
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Omitting extraprimary findings</p>
            <p className="text-md text-muted-foreground leading-relaxed">A cardiac patient with short stature and lens dislocation should include all three features. The combination may point to a specific syndrome (e.g., Marfan) that individual features would not identify.</p>
          </div>
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Iterative Refinement</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Phenotype matching can be re-run at any time with updated HPO terms. If the initial results do not include expected candidate genes, consider adding more specific terms or terms from additional organ systems. The platform preserves previous matching results until a new run replaces them.
        </p>
      </section>
    </div>
  )
}
