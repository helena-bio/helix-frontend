import Link from 'next/link'

export const metadata = {
  title: 'Limitations | Helix Insight Documentation',
  description: 'Known limitations of the Helix Insight platform -- variant types, analysis scope, AI boundaries, and database coverage.',
}

export default function LimitationsPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <span className="text-foreground">Limitations</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Limitations</h1>
      </div>

      <section className="space-y-3">
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix Insight is designed for germline variant interpretation in Mendelian disease contexts. The following limitations should be considered when using the platform for clinical genomic analysis.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Variant Types</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'Single nucleotide variants (SNVs) and small insertions/deletions (indels) are fully supported.',
            'Structural variants (SVs), copy number variants (CNVs), and complex rearrangements are not analyzed. These variant types require specialized callers and interpretation pipelines not currently integrated.',
            'Mitochondrial DNA (mtDNA) variants are not included in the analysis pipeline. Variants on chrM are present in the VCF but not annotated with mitochondrial-specific databases.',
            'Repeat expansions (trinucleotide repeats, short tandem repeats) are not detected or interpreted. Conditions like Huntington disease, Fragile X, and myotonic dystrophy require dedicated repeat expansion callers.',
            'Somatic variants are not supported. The platform assumes germline origin for all variants. Tumor-normal paired analysis and somatic-specific databases are not integrated.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
              <p className="text-md text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Genome Build</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'GRCh38 (hg38) is the primary supported genome build. All reference databases are indexed to GRCh38.',
            'GRCh37 (hg19) VCF files are accepted and automatically lifted over to GRCh38 using CrossMap. Liftover may fail for a small number of variants in regions with structural differences between builds.',
            'Earlier genome builds (hg18 and prior) are not supported.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
              <p className="text-md text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">ACMG Classification</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            '19 of 28 ACMG criteria are automated. The remaining 9 criteria (PS2, PS3, PS4, PM3, PM6, PP1, PP5, BS3, BS4) require clinical judgment, functional studies, or family segregation data that cannot be derived from a VCF file alone.',
            'Gene-specific VCEP specifications are applied where available through ClinGen, but coverage is incomplete. Genes without VCEP specifications use the default ACMG thresholds.',
            'The platform does not perform manual variant curation. Automated classifications should be reviewed and potentially adjusted by a clinical geneticist before reporting.',
            'Compound heterozygote detection requires phasing information. Without trio data or read-based phasing, compound het candidates are flagged but not confirmed.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
              <p className="text-md text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Database Coverage</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'gnomAD v4.1 population frequencies have uneven coverage across ancestry groups. Non-Finnish European samples represent the majority of the cohort. Variants in underrepresented populations may have less precise frequency estimates.',
            'ClinVar assertions vary in quality. Single-submitter assertions with zero review stars carry less weight than expert panel consensus. The platform applies review star filtering but cannot independently validate submitter quality.',
            'dbNSFP functional predictions are limited to missense variants at coding positions. Non-coding variants, UTR variants, and deep intronic variants do not receive BayesDel, SIFT, or AlphaMissense scores.',
            'HPO gene-phenotype associations depend on the completeness of disease gene curation. Recently discovered gene-disease associations may not yet be reflected in the HPO database.',
            'The literature database is a local PubMed mirror and may lag behind the live PubMed index by up to one month.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
              <p className="text-md text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">AI Clinical Assistant</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'The AI assistant generates clinical interpretations that require independent validation by a qualified clinical geneticist. AI-generated content does not constitute a medical diagnosis.',
            'The assistant only has access to data within the current analysis session. It cannot cross-reference findings across different patients or historical cases.',
            'Conversation context is limited to the last 20 messages. Very long diagnostic discussions may lose early context.',
            'SQL generation from natural language may occasionally produce incorrect queries for ambiguous or highly complex questions. The generated SQL is visible to the user for verification.',
            'The literature search operates on the local PubMed mirror. It cannot access preprint servers, full-text content, or databases outside the indexed PubMed corpus.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
              <p className="text-md text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Input Requirements</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'Only single-sample VCF files are accepted. Multi-sample VCFs must be split before upload.',
            'VCF files must conform to VCF 4.1 or 4.2 specification. Non-standard fields in the INFO or FORMAT columns are ignored.',
            'The platform processes up to approximately 5 million variants per file. Whole genome sequencing files typically contain 4-5 million variants and are fully supported.',
            'Phenotype matching requires HPO terms. Free-text clinical descriptions are supported through automatic HPO term extraction, but manually curated HPO terms produce better matching accuracy.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
              <p className="text-md text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card border border-primary/20 rounded-lg p-4 space-y-2">
        <p className="text-base font-medium text-foreground">Intended Use</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Helix Insight is a clinical decision support tool for germline variant interpretation. It is not a diagnostic device. All automated classifications, screening priorities, and AI-generated interpretations must be independently reviewed and validated by qualified clinical professionals before being used in patient care decisions.
        </p>
      </section>
    </div>
  )
}
