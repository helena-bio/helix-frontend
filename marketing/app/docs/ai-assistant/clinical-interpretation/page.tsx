import Link from 'next/link'

export const metadata = {
  title: 'Clinical Interpretation | Helix Insight Documentation',
  description: 'AI-generated clinical genomic interpretation reports with four adaptive levels, structured templates, and data grounding safeguards.',
}

export default function ClinicalInterpretationPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/ai-assistant" className="hover:text-primary transition-colors">AI Clinical Assistant</Link>
          {' / '}
          <span className="text-foreground">Clinical Interpretation</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Clinical Interpretation</h1>
      </div>

      <section className="space-y-3">
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix AI can generate a comprehensive clinical genomic interpretation report for the current case. The report synthesizes all available analysis results into a structured diagnostic narrative. The interpretation depth adapts automatically based on which analysis modules have been completed.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Interpretation Levels</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The system detects which data is available and adapts the report accordingly. More complete data produces deeper, more clinically useful interpretations.
        </p>
        <div className="space-y-3">
          {[
            { level: 'Level 1', label: 'Variants Only', req: 'ACMG classification completed', focus: 'Pathogenic and Likely Pathogenic variants, notable VUS with HIGH impact. Recommends enabling additional analysis modules.' },
            { level: 'Level 2', label: 'Screening-Focused', req: '+ Clinical screening completed', focus: 'Actionability tiers, prioritized variants with constraint scores, age-appropriate gene relevance. Adds clinical context from screening boosts.' },
            { level: 'Level 3', label: 'Phenotype-Focused', req: '+ Phenotype matching completed', focus: 'Genotype-phenotype correlation, semantic similarity scores, clinical tier assignments. Correlates findings with patient symptoms.' },
            { level: 'Level 4', label: 'Full Analysis', req: '+ All modules completed', focus: 'Comprehensive diagnostic synthesis integrating classification, screening, phenotype matching, and literature evidence into a cohesive clinical narrative.' },
          ].map((item) => (
            <div key={item.level} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-sm font-medium rounded bg-primary/10 text-primary">{item.level}</span>
                <span className="text-base font-medium text-foreground">{item.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.req}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.focus}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Report Structure</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Every report has three sections. The header and disclaimer are template-driven and never AI-generated, ensuring accuracy for patient information and legal text. Only the clinical interpretation body is produced by the AI.
        </p>
        <div className="space-y-3">
          {[
            { section: 'Header (Template)', content: 'Report metadata, patient demographics, ethnicity, clinical indication, family history, consanguinity status, consent settings, HPO phenotype terms, analysis modules completed, and dataset summary (total variants, P/LP/VUS counts).' },
            { section: 'Clinical Interpretation (AI-Generated)', content: 'Diagnostic narrative typically 2,000-4,000 words. Covers primary findings, evidence assessment with ACMG criteria explanation, allele frequencies in scientific notation, inheritance mode analysis, genotype-phenotype correlation, and clinical recommendations.' },
            { section: 'Disclaimer (Template)', content: 'Legal statement noting the AI origin of the interpretation, requirement for validation by a qualified clinical geneticist, liability limitation, and co-signing requirement.' },
          ].map((item) => (
            <div key={item.section} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.section}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Data Grounding</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The interpretation system enforces strict data grounding rules to prevent hallucination:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'The AI only discusses genes and variants that appear in the provided analysis data. It does not invent or fabricate findings.',
            'It does not add "textbook" pathogenic variants that are not present in the patient\'s results.',
            'It does not reclassify variants. If the pipeline classified a variant as VUS, the interpretation discusses it as VUS.',
            'Allele frequencies are reported in scientific notation with the exact values from the database.',
            'When data for a specific analysis module is missing, the AI acknowledges the gap and recommends enabling that module rather than speculating.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
              <p className="text-md text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Export Formats</p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Format</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Features</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-md font-medium text-foreground">PDF</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Branded A4 layout with Helix Insight header, page numbers, "CONFIDENTIAL" watermark, print-friendly links, proper table formatting.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-md font-medium text-foreground">DOCX</td>
                <td className="px-4 py-2 text-md text-muted-foreground">Editable Word document with formatted headings, tables, and inline styling. Suitable for further customization before distribution.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Important</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          The clinical interpretation is AI-generated and does not constitute a medical diagnosis. All findings must be independently validated by a qualified clinical geneticist before being used in patient care. The report includes a standard disclaimer section stating this requirement.
        </p>
      </section>
    </div>
  )
}
