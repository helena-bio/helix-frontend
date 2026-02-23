import Link from 'next/link'

export const metadata = {
  title: 'Evidence Strength | Helix Insight Documentation',
  description: 'How literature evidence maps to ACMG-aligned strength categories.',
}

const strengths = [
  { level: 'Strong', criteria: 'Exact variant match AND functional study data present', acmg: 'PS3 / PP3 candidate evidence', color: 'text-red-600', desc: 'The publication describes the exact variant found in the patient and includes functional evidence (animal model, cell assay, enzyme activity). This is the highest-value literature finding for ACMG classification.' },
  { level: 'Moderate', criteria: 'Exact variant match OR functional study data present', acmg: 'PM-level supporting evidence', color: 'text-amber-600', desc: 'The publication either describes the exact variant (without functional data) or provides functional evidence for the gene (without the exact variant). Either finding contributes meaningful evidence to classification.' },
  { level: 'Supporting', criteria: 'Gene match AND phenotype match present', acmg: 'PP4 / PP5 candidate evidence', color: 'text-blue-600', desc: 'The publication discusses the same gene in the context of phenotypes that overlap with the patient\u2019s presentation. Supports the genotype-phenotype correlation without variant-specific or functional evidence.' },
  { level: 'Weak', criteria: 'Gene mentioned only', acmg: 'Background reference', color: 'text-gray-500', desc: 'The publication mentions the gene but lacks phenotype overlap, variant specificity, or functional data. Useful as background context but insufficient for direct ACMG evidence application.' },
]

export default function EvidenceStrengthPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/literature" className="hover:text-primary transition-colors">Literature Evidence</Link>
          {' / '}
          <span className="text-foreground">Evidence Strength</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Evidence Strength</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          Each publication in the literature results is assigned an evidence strength category based on the type of evidence it provides. These categories are aligned with ACMG criteria to help the geneticist quickly identify which publications are most relevant for classification decisions.
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Strength Categories</p>
        <div className="space-y-3">
          {strengths.map((s) => (
            <div key={s.level} className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3">
                <span className={`text-base font-semibold ${s.color}`}>{s.level}</span>
                <span className="text-sm text-muted-foreground ml-auto">{s.acmg}</span>
              </div>
              <p className="text-md text-muted-foreground leading-relaxed">{s.desc}</p>
              <div className="bg-muted/30 rounded px-3 py-2">
                <p className="text-sm text-muted-foreground">Criteria: {s.criteria}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">How Functional Data Is Detected</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The platform identifies functional study evidence through two methods:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">MeSH Descriptor Matching</p>
            <p className="text-md text-muted-foreground leading-relaxed">Publications indexed with MeSH terms indicating model organisms (zebrafish, mice), knockout studies, cell line experiments, or molecular biology techniques are flagged as containing functional data.</p>
          </div>
          <div className="border-t border-border/50" />
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Abstract Keyword Fallback</p>
            <p className="text-md text-muted-foreground leading-relaxed">When MeSH descriptors are insufficient, the abstract text is searched for functional study keywords. This catches publications where the functional component is described in the text but not captured in MeSH indexing.</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">How Variant Matching Works</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Variant mentions extracted during database ingestion are compared against the patient&apos;s variants. An exact match requires the same gene symbol and the same HGVS notation (cDNA or protein level). The platform recognizes multiple notation formats:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'HGVS cDNA: c.123A>G, c.456_789del, c.100_101insATG',
            'HGVS protein: p.Arg248Gln, p.Gly12Val',
            'Legacy single-letter: R248Q, G12V',
          ].map((item) => (
            <p key={item} className="text-md text-muted-foreground">{item}</p>
          ))}
        </div>
        <p className="text-md text-muted-foreground leading-relaxed">
          When the exact variant is not found but the gene is mentioned, the publication receives a partial variant score (0.3 instead of 1.0) and is categorized based on its other evidence components.
        </p>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Clinical Judgment Required</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Evidence strength categories are computational estimates based on extracted data. A publication labeled &quot;Strong&quot; may contain a variant match in a different clinical context than the current patient. A &quot;Weak&quot; publication may contain a crucial observation in its discussion section that the extraction pipeline did not capture. The geneticist should review the actual publication before applying evidence to ACMG classification.
        </p>
      </section>
    </div>
  )
}
