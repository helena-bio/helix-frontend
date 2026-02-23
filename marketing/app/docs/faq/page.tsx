import Link from 'next/link'
import { JsonLd } from '@/components/seo'

export const metadata = {
  title: 'FAQ | Helix Insight Documentation',
  description: 'Frequently asked questions about Helix Insight -- data handling, classification methodology, supported formats, and clinical use.',
}

const faqs = [
  {
    q: 'What file formats does Helix Insight accept?',
    a: 'Single-sample VCF files in version 4.1 or 4.2 format, either plain text (.vcf) or bgzipped (.vcf.gz). Multi-sample VCFs must be split into individual samples before upload.',
  },
  {
    q: 'Which genome builds are supported?',
    a: 'GRCh38 (hg38) is the primary build. GRCh37 (hg19) files are accepted and automatically lifted over to GRCh38 using CrossMap. Earlier builds are not supported.',
  },
  {
    q: 'How long does analysis take?',
    a: 'Processing time depends on the input type: gene panels typically complete in 1-2 minutes, whole exome sequencing in 2-5 minutes, and whole genome sequencing in under 15 minutes. Screening and phenotype matching add less than one minute each.',
  },
  {
    q: 'Where is patient data stored?',
    a: 'All data is processed and stored on EU-based infrastructure in Helsinki, Finland (Hetzner AX162R dedicated server). No patient data is transmitted to external services, cloud providers, or AI APIs.',
  },
  {
    q: 'Is patient data deleted after analysis?',
    a: 'Yes. VCF files and analysis results are retained only for the duration needed for clinical review. Data deletion policies comply with GDPR requirements.',
  },
  {
    q: 'Which ACMG criteria are automated?',
    a: 'Helix Insight automates 19 of 28 ACMG criteria: PVS1, PS1, PM1, PM2, PM4, PM5, PP2, PP3, PP4, PP5, BA1, BS1, BS2, BP1, BP3, BP4, BP5, BP6, and BP7. The remaining 9 require clinical judgment, functional studies, or family segregation data.',
  },
  {
    q: 'What computational predictor is used for PP3/BP4?',
    a: 'BayesDel_noAF with ClinGen SVI-calibrated thresholds (Pejaver et al. 2022). The "_noAF" variant excludes allele frequency from its model to avoid circular reasoning with PM2, BA1, and BS1. SpliceAI is used independently for splice impact (PP3_splice).',
  },
  {
    q: 'Can Helix Insight detect structural variants or CNVs?',
    a: 'No. The platform currently analyzes single nucleotide variants (SNVs) and small insertions/deletions (indels). Structural variants, copy number variants, repeat expansions, and mitochondrial variants require specialized pipelines.',
  },
  {
    q: 'Does the platform support somatic variant interpretation?',
    a: 'No. Helix Insight is designed for germline variant interpretation in Mendelian disease contexts. Somatic variant analysis requires tumor-normal paired analysis with different classification frameworks (AMP/ASCO/CAP).',
  },
  {
    q: 'What databases are used for annotation?',
    a: 'gnomAD v4.1 (population frequencies), ClinVar 2025-01 (clinical significance), dbNSFP 4.9c (functional predictions), SpliceAI (splice impact), HPO (gene-phenotype associations), ClinGen (dosage sensitivity), and Ensembl VEP Release 113 (consequence annotation). All databases are stored locally.',
  },
  {
    q: 'How does phenotype matching work?',
    a: 'Patient HPO terms are compared against gene-phenotype associations using Lin semantic similarity within the HPO ontology graph. Genes are ranked by the strength of phenotype correlation and assigned clinical priority tiers. See the Phenotype Matching documentation for details.',
  },
  {
    q: 'What does the AI clinical assistant use for its model?',
    a: 'A large language model hosted on dedicated GPU infrastructure within the EU. All inference happens on-premise through a secure internal connection. No patient data is sent to external AI services.',
  },
  {
    q: 'Can the AI assistant modify variant classifications?',
    a: 'No. ACMG classifications are determined by the automated pipeline. The AI assistant can explain why criteria were triggered and discuss the evidence, but it cannot change classifications. Only the reviewing geneticist can override classifications.',
  },
  {
    q: 'Is the clinical interpretation a medical diagnosis?',
    a: 'No. The AI-generated clinical interpretation is a decision support tool. All findings must be independently validated by a qualified clinical geneticist before being used in patient care. Reports include a standard disclaimer stating this requirement.',
  },
  {
    q: 'How often are reference databases updated?',
    a: 'ClinVar is updated quarterly or more frequently for clinically significant changes. gnomAD major releases are adopted within 3 months of publication. All updates undergo validation testing with a reference cohort before deployment. See the Database Update Policy for the complete schedule.',
  },
  {
    q: 'Can I use Helix Insight for research purposes?',
    a: 'Yes. The platform is suitable for both clinical and research use. For research applications, the same analytical rigor applies but reporting requirements may differ from clinical diagnostic settings.',
  },
  {
    q: 'What happens if ClinVar and the automated classification disagree?',
    a: 'Helix Insight applies a transparent priority system: BA1 always overrides ClinVar, expert-panel ClinVar assertions can override the automated classification, and conflicting evidence is flagged for manual review. See the ClinVar Integration documentation for the complete decision logic.',
  },
]

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': faqs.map((faq) => ({
    '@type': 'Question',
    'name': faq.q,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': faq.a,
    },
  })),
}

export default function FaqPage() {
  return (
    <div className="py-10 space-y-6">
      <JsonLd data={faqStructuredData} />
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <span className="text-foreground">FAQ</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Frequently Asked Questions</h1>
      </div>

      <section className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-base font-semibold text-foreground">{faq.q}</p>
            <p className="text-md text-muted-foreground leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
