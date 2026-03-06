import { Header, Footer } from '@/components'
import Link from 'next/link'
import { RequestDemoButton } from '@/components/marketing/RequestDemoButton'

export const metadata = {
  title: 'Screening Methodology -- Multi-Dimensional Variant Prioritization | Helena',
  description: 'How Helena prioritizes classified variants for clinical review using seven scoring dimensions, age-aware weights, clinical profile boosts, and four-tier ranking.',
}

const SCREENING_VERSION = '2.0'
const LAST_UPDATED = 'March 2026'

const tocSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'pipeline', label: 'Screening Pipeline' },
  { id: 'scoring-components', label: 'Scoring Components' },
  { id: 'deleteriousness', label: 'Deleteriousness Ensemble' },
  { id: 'weight-system', label: 'Weight System' },
  { id: 'clinical-boosts', label: 'Clinical Profile Boosts' },
  { id: 'tier-system', label: 'Tier System' },
  { id: 'gene-lists', label: 'Gene Lists' },
  { id: 'screening-modes', label: 'Screening Modes' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'references', label: 'References' },
]

const scoringComponents = [
  {
    name: 'Gene Constraint',
    field: 'constraint',
    description: 'Measures the gene\'s intolerance to variation using gnomAD constraint metrics. Strategy varies by consequence type: loss-of-function variants are scored using pLI and LOEUF jointly, missense variants use mis_z combined with pLI, and non-coding variants receive a heavily discounted score regardless of gene constraint.',
    sources: 'gnomAD v4.1.0 (pLI, LOEUF, mis_z)',
    details: [
      'Loss-of-function variants in genes with high pLI and low LOEUF receive the maximum score',
      'Missense variants in genes with high missense constraint (mis_z) and high pLI receive elevated scores',
      'Non-coding consequences (intron, upstream, downstream, synonymous) receive minimal scores -- gene constraint is clinically irrelevant for variants that do not affect protein function',
    ],
  },
  {
    name: 'Deleteriousness',
    field: 'deleteriousness',
    description: 'Weighted aggregate of eight computational predictors assessing variant deleteriousness. BayesDel_noAF serves as the primary predictor with ClinGen SVI calibrated signal, supplemented by SpliceAI for orthogonal splice impact and six additional predictors for coverage gaps.',
    sources: 'dbNSFP 4.9c (BayesDel_noAF, DANN, SIFT, AlphaMissense, MetaSVM, PhyloP, GERP), Ensembl (SpliceAI)',
    details: [
      'BayesDel_noAF is the primary signal, normalized from its native range to [0, 1]',
      'SpliceAI provides orthogonal splice impact prediction independent of missense predictors',
      'AlphaMissense contributes independent protein structure signal derived from AlphaFold',
      'When BayesDel is unavailable, its weight is redistributed proportionally among remaining predictors',
      'Conservation scores (PhyloP, GERP) are normalized from their native ranges to [0, 1]',
    ],
  },
  {
    name: 'Phenotype Relevance',
    field: 'phenotype',
    description: 'Evaluates how well the variant\'s gene matches the patient\'s clinical presentation. Operates in two modes depending on whether patient HPO terms are available.',
    sources: 'HPO gene-phenotype associations',
    details: [
      'Diagnostic mode (HPO terms provided): computes overlap between patient HPO terms and gene HPO associations',
      'Screening mode (no phenotype): uses gene-disease burden as proxy -- genes associated with more phenotypes receive higher scores',
    ],
  },
  {
    name: 'Dosage Sensitivity',
    field: 'dosage',
    description: 'Based on ClinGen haploinsufficiency evidence, applied only to loss-of-function variants.',
    sources: 'ClinGen dosage sensitivity (haploinsufficiency_score)',
    details: [
      'Only evaluated for loss-of-function consequences (frameshift, stop_gained, splice_donor, splice_acceptor)',
      'Three-tier scoring based on ClinGen evidence level: sufficient, emerging, or limited evidence',
      'Non-LoF variants and genes without dosage data receive zero',
    ],
  },
  {
    name: 'Consequence Severity',
    field: 'consequence',
    description: 'Hierarchical severity ranking based on VEP consequence type and transcript biotype.',
    sources: 'Ensembl VEP (consequence, biotype)',
    details: [
      'Non-protein-coding biotypes receive minimal scores regardless of consequence',
      'Hierarchy: frameshift/stop_gained/splice_donor/splice_acceptor > start_lost/stop_lost > inframe > missense > splice_region > UTR > synonymous > intron',
    ],
  },
  {
    name: 'Compound Heterozygote',
    field: 'compound_het',
    description: 'Detects potential compound heterozygotes for autosomal recessive conditions by identifying multiple heterozygous coding variants in the same gene.',
    sources: 'Pipeline-internal genotype analysis',
    details: [
      'Only coding/splicing consequences qualify -- intronic and synonymous variants are excluded',
      'Variants pre-flagged by the upstream classification pipeline receive the maximum score',
      'Same-gene heterozygous coding variant pairs are detected via efficient pre-grouped gene lookup',
    ],
  },
  {
    name: 'Age Relevance',
    field: 'age_relevance',
    description: 'Prioritizes age-appropriate disease genes using curated gene lists. Different gene categories are emphasized depending on the patient\'s age group.',
    sources: 'ACMG Secondary Findings v3.2, curated pediatric and adult gene lists',
    details: [
      'Neonatal: early-onset disease genes and treatable metabolic conditions receive highest priority',
      'Pediatric: childhood-onset genes receive highest priority, early-onset genes slightly lower',
      'Adult: cancer predisposition and cardiac genes receive highest priority',
      'Elderly: cardiac genes receive highest priority; cancer gene priority is reduced',
      'ACMG Secondary Findings genes receive elevated priority across all age groups',
    ],
  },
]

const weightProfiles = [
  {
    mode: 'Diagnostic',
    condition: 'Patient has HPO phenotype terms (any age)',
    distribution: [
      { component: 'Constraint', level: 'Standard' },
      { component: 'Deleteriousness', level: 'Standard' },
      { component: 'Phenotype', level: 'Dominant' },
      { component: 'Dosage', level: 'Low' },
      { component: 'Consequence', level: 'Minimal' },
      { component: 'Compound Het', level: 'Minimal' },
      { component: 'Age Relevance', level: 'None' },
    ],
    rationale: 'Phenotype matching drives prioritization when clinical presentation is available. Age relevance is unnecessary because the phenotype itself guides variant selection.',
  },
  {
    mode: 'Neonatal / Pediatric',
    condition: '0-18 years, no phenotype',
    distribution: [
      { component: 'Constraint', level: 'High' },
      { component: 'Deleteriousness', level: 'Standard' },
      { component: 'Phenotype', level: 'Low' },
      { component: 'Dosage', level: 'Elevated' },
      { component: 'Consequence', level: 'Low' },
      { component: 'Compound Het', level: 'Minimal' },
      { component: 'Age Relevance', level: 'Elevated' },
    ],
    rationale: 'Gene constraint is critical in neonates and children. Dosage sensitivity is elevated because LoF in haploinsufficient genes is urgent. Age relevance captures actionable early-onset conditions.',
  },
  {
    mode: 'Adult Proactive',
    condition: '18-65 years, no phenotype',
    distribution: [
      { component: 'Constraint', level: 'Standard' },
      { component: 'Deleteriousness', level: 'Elevated' },
      { component: 'Phenotype', level: 'Low' },
      { component: 'Dosage', level: 'Low' },
      { component: 'Consequence', level: 'Low' },
      { component: 'Compound Het', level: 'Minimal' },
      { component: 'Age Relevance', level: 'Elevated' },
    ],
    rationale: 'Deleteriousness predictions are elevated because missense predictions are critical for cancer and cardiac risk. Age relevance captures adult-actionable conditions.',
  },
  {
    mode: 'Elderly',
    condition: '65+ years, no phenotype',
    distribution: [
      { component: 'Constraint', level: 'Reduced' },
      { component: 'Deleteriousness', level: 'Standard' },
      { component: 'Phenotype', level: 'Low' },
      { component: 'Dosage', level: 'Low' },
      { component: 'Consequence', level: 'Low' },
      { component: 'Compound Het', level: 'Minimal' },
      { component: 'Age Relevance', level: 'Highest' },
    ],
    rationale: 'Age relevance receives the highest weight because older patients benefit most from narrowly actionable findings. Constraint is reduced because many genes have already been expressed without clinical phenotype.',
  },
]

const clinicalBoosts = [
  { name: 'ACMG Classification', description: 'Pathogenic and Likely Pathogenic variants receive priority boosts. VUS variants with strong null variant evidence (PVS1 criterion) also receive an elevated boost.', condition: 'ACMG class is P, LP, or VUS with PVS1' },
  { name: 'Phenotype Match Tier', description: 'Variants in genes with strong phenotype correlation receive priority boosts proportional to the phenotype matching tier.', condition: 'Phenotype Matching Service has been executed' },
  { name: 'Ethnicity', description: 'Population-specific founder mutations receive elevated priority. Supports Ashkenazi Jewish, African, East/South Asian, and European founder variant lists.', condition: 'Patient ethnicity is provided' },
  { name: 'Family History', description: 'Cancer and cardiac predisposition genes receive priority boosts when family history is reported. Additional boost when indication specifically references family history.', condition: 'Family history flag is set' },
  { name: 'Sex-Linked Inheritance', description: 'X-linked disease genes receive priority boosts based on patient sex. Males receive a larger boost due to hemizygous expression.', condition: 'Variant on chromosome X in a recognized X-linked gene' },
  { name: 'Consanguinity', description: 'Homozygous variants receive elevated priority in consanguineous families, reflecting increased likelihood of identical-by-descent inheritance.', condition: 'Consanguinity flag is set' },
  { name: 'De Novo Proxy', description: 'Variants in highly constrained genes receive a proxy de novo boost when trio/duo data is available. This is a prioritization heuristic, not confirmed de novo status.', condition: 'Sample type is trio or duo' },
  { name: 'Pregnancy / Family Planning', description: 'Prenatal actionable genes receive elevated priority for pregnant patients. Carrier screening genes receive priority for family planning.', condition: 'Pregnancy or family planning flag is set' },
  { name: 'Gene Panel', description: 'Panel genes receive priority boosts modulated by ClinGen gene-disease validity level and age-group relevance matching.', condition: 'A gene panel is selected' },
]

const limitations = [
  'Screening is a prioritization tool, not a diagnostic tool. It determines review order, not variant pathogenicity. ACMG classification determines pathogenicity.',
  'Compound heterozygote detection is inferred from genotype data without formal phasing. Trio data or long-read sequencing provides definitive confirmation.',
  'De novo boost is a proxy based on gene constraint, not confirmed de novo status. Parental genotype comparison is required for confirmation.',
  'Ethnicity-based boosts use curated founder mutation lists. Population-specific variants outside these lists do not receive ethnicity boosts.',
  'Phenotype scoring without HPO terms uses gene-disease burden as a proxy, which favors well-characterized genes over recently described disease associations.',
  'Age relevance gene lists are curated and may not include all relevant disease genes for each age group. Lists are updated periodically.',
  'Carrier screening and pharmacogenomics modes are not yet weight-differentiated from adult screening. Dedicated weight profiles are planned.',
  'Gene panel boosts are modulated by ClinGen gene-disease validity, which may not be available for all panel genes.',
  'All scores are normalized to [0.0, 1.0]. Raw metric magnitudes are compressed into a relative scale.',
  'Screening results should always be interpreted by a qualified clinical geneticist in the context of the patient\'s clinical presentation and family history.',
]

const references = [
  { authors: 'Richards S, Aziz N, Bale S, et al.', title: 'Standards and guidelines for the interpretation of sequence variants.', journal: 'Genetics in Medicine. 2015;17(5):405-424.', id: 'PMID: 25741868' },
  { authors: 'Pejaver V, Byrne AB, Feng BJ, et al.', title: 'Calibration of computational tools for missense variant pathogenicity classification and ClinGen recommendations for PP3/BP4 criteria.', journal: 'Am J Hum Genet. 2022;109(12):2163-2177.', id: 'PMID: 36413997' },
  { authors: 'Karczewski KJ, Francioli LC, Tiao G, et al.', title: 'The mutational constraint spectrum quantified from variation in 141,456 humans.', journal: 'Nature. 2020;581(7809):434-443.', id: 'PMID: 32461654' },
  { authors: 'Cheng J, Novati G, Pan J, et al.', title: 'Accurate proteome-wide missense variant effect prediction with AlphaMissense.', journal: 'Science. 2023;381(6664):eadg7492.', id: 'PMID: 37733863' },
  { authors: 'Jaganathan K, Kyriazopoulou Panagiotopoulou S, McRae JF, et al.', title: 'Predicting Splicing from Primary Sequence with Deep Learning.', journal: 'Cell. 2019;176(3):535-548.e24.', id: 'PMID: 30661751' },
  { authors: 'Miller DT, Lee K, Abul-Husn NS, et al.', title: 'ACMG SF v3.2: Reducing noise and improving clinical actionability.', journal: 'Genet Med. 2023;25(1):100726.', id: 'PMID: 36344267' },
  { authors: 'Kohler S, Gargano M, Matentzoglu N, et al.', title: 'The Human Phenotype Ontology in 2021.', journal: 'Nucleic Acids Research. 2021;49(D1):D1207-D1217.', id: 'PMID: 33264411' },
]

const levelColors: Record<string, string> = {
  'Dominant': 'bg-red-500/15 text-red-700 dark:text-red-400',
  'Highest': 'bg-red-500/15 text-red-700 dark:text-red-400',
  'High': 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  'Elevated': 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  'Standard': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'Low': 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  'Minimal': 'bg-slate-500/5 text-slate-500 dark:text-slate-500',
  'Reduced': 'bg-slate-500/5 text-slate-500 dark:text-slate-500',
  'None': 'bg-slate-500/5 text-slate-400 dark:text-slate-600',
}

export default function ScreeningMethodologyPage() {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">

        {/* HERO */}
        <section className="pt-12 pb-8 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight text-primary">Screening Methodology</h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
              <span className="text-md text-muted-foreground">Screening Engine</span>
              <span className="text-md font-semibold text-foreground">v{SCREENING_VERSION}</span>
              <span className="text-md text-muted-foreground">|</span>
              <span className="text-md text-muted-foreground">Updated {LAST_UPDATED}</span>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">Complete documentation of how Helena prioritizes classified variants for clinical review. After ACMG classification determines what each variant IS, screening determines which variants to REVIEW FIRST based on clinical relevance to the specific patient.</p>
            <p className="text-base text-muted-foreground leading-relaxed">The screening algorithm evaluates each variant across seven independent dimensions, applies patient-specific clinical profile boosts, and produces a four-tier priority ranking. Every score component is transparent and visible in the results. Screening completes in under one second for typical cases.</p>
          </div>
        </section>

        {/* TOC */}
        <section className="pb-12 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-8">
              <p className="text-lg font-semibold text-foreground mb-4">Contents</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {tocSections.map((section, i) => (
                  <a key={section.id} href={`#${section.id}`} className="flex items-center gap-2 text-base text-muted-foreground hover:text-primary transition-colors py-1">
                    <span className="text-md text-muted-foreground/60 font-mono w-6">{(i + 1).toString().padStart(2, '0')}</span>
                    {section.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 1. OVERVIEW */}
        <section id="overview" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Overview</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">Classification and screening solve different problems. Both are necessary for efficient clinical review.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-card border border-border rounded-lg p-6 space-y-3">
                <p className="text-lg font-semibold text-foreground">Classification</p>
                <p className="text-base text-muted-foreground leading-relaxed">Determines what a variant IS. Assigns one of five ACMG categories based on evidence criteria. Documented on the <a href="/methodology" className="text-primary hover:underline">Classification Methodology</a> page.</p>
              </div>
              <div className="bg-card border border-primary/30 border-2 rounded-lg p-6 space-y-3">
                <p className="text-lg font-semibold text-foreground">Screening</p>
                <p className="text-base text-muted-foreground leading-relaxed">Determines which variants to REVIEW FIRST. Ranks all classified variants by clinical relevance to this specific patient using a multi-dimensional scoring algorithm adapted to patient demographics and clinical context.</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="text-lg font-semibold text-foreground">Why Screening Is Necessary</p>
              <p className="text-base text-muted-foreground leading-relaxed">After classification, a clinician typically faces 50-200+ variants requiring review. Manual review of every variant is impractical. Screening reduces this to 3-20 high-priority candidates (Tier 1) by incorporating clinical context that classification alone does not consider: patient age, sex, ethnicity, family history, clinical phenotype, and the specific screening strategy.</p>
              <p className="text-base text-muted-foreground leading-relaxed">A VUS in a highly constrained gene with strong phenotype match and family history of genetic disease may be more clinically relevant than a Pathogenic variant in an unrelated gene. Screening captures these contextual relationships.</p>
            </div>
          </div>
        </section>

        {/* 2. PIPELINE */}
        <section id="pipeline" className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Screening Pipeline</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">Single-pass pipeline over classified variants. Total processing time under one second for typical cases (100-500 variants).</p>
            </div>
            <div className="space-y-3">
              {[
                { step: 1, name: 'Load Classified Variants', desc: 'Pre-classified variants (Pathogenic, Likely Pathogenic, VUS) are loaded with full annotation data. Phenotype tier data is joined when available. Gene panel filters are applied if selected.' },
                { step: 2, name: 'Calculate Base Component Scores', desc: 'Each variant is scored across seven independent dimensions (constraint, deleteriousness, phenotype, dosage, consequence, compound heterozygote, age relevance). Each score is normalized to [0.0, 1.0].' },
                { step: 3, name: 'Apply Scoring Weights', desc: 'Component scores are combined using weights appropriate to the patient\'s age group and screening mode. All weight sets sum to exactly 1.0 and are validated at runtime.' },
                { step: 4, name: 'Calculate Clinical Boosts', desc: 'Patient-specific context (ACMG class, phenotype match, ethnicity, family history, sex, consanguinity, pregnancy, gene panel) adds additional priority. Total score capped at 1.0.' },
                { step: 5, name: 'Assign Priority Tiers', desc: 'Each variant is assigned to one of four tiers based on boosted score and clinical context. All Pathogenic/Likely Pathogenic variants are guaranteed Tier 1 regardless of base scores.' },
                { step: 6, name: 'Export Results', desc: 'Tiered results are persisted for downstream consumption. Gene-level summaries are exported for summary-first clinical review.' },
              ].map((s) => (
                <div key={s.step} className="bg-card border border-border rounded-lg p-6 flex items-start gap-5">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary-foreground">{s.step}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-lg font-semibold text-foreground">{s.name}</p>
                    <p className="text-base text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. SCORING COMPONENTS */}
        <section id="scoring-components" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Scoring Components</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">Each variant is evaluated across seven independent dimensions. All scores are normalized to [0.0, 1.0] for direct comparability.</p>
            </div>
            <div className="space-y-4">
              {scoringComponents.map((c) => (
                <div key={c.field} className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">{c.name}</p>
                    <p className="text-base text-muted-foreground leading-relaxed">{c.description}</p>
                  </div>
                  <div className="space-y-2">
                    {c.details.map((d, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-primary/60 rounded-full shrink-0 mt-2" />
                        <p className="text-md text-muted-foreground">{d}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-border">
                    <p className="text-md text-muted-foreground"><span className="font-medium text-foreground">Data sources: </span>{c.sources}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. DELETERIOUSNESS ENSEMBLE */}
        <section id="deleteriousness" className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Deleteriousness Ensemble</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">Eight-predictor weighted ensemble with BayesDel_noAF as the primary signal. Approved via clinical review HELIX-CR-2026-002.</p>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-6 py-3 text-md font-semibold text-foreground">Predictor</th>
                      <th className="text-left px-4 py-3 text-md font-semibold text-foreground">Signal Type</th>
                      <th className="text-left px-4 py-3 text-md font-semibold text-foreground">Contribution</th>
                      <th className="text-left px-4 py-3 text-md font-semibold text-foreground">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'BayesDel_noAF', signal: 'ClinGen SVI calibrated missense', contribution: 'Primary', source: 'dbNSFP 4.9c' },
                      { name: 'SpliceAI', signal: 'Splice impact (4 delta scores)', contribution: 'Major (orthogonal)', source: 'Ensembl MANE' },
                      { name: 'AlphaMissense', signal: 'Protein structure (AlphaFold)', contribution: 'Significant', source: 'dbNSFP 4.9c' },
                      { name: 'DANN', signal: 'Deep learning pathogenicity', contribution: 'Supporting', source: 'dbNSFP 4.9c' },
                      { name: 'SIFT', signal: 'Sequence homology', contribution: 'Supporting', source: 'dbNSFP 4.9c' },
                      { name: 'MetaSVM', signal: 'Ensemble meta-predictor', contribution: 'Supporting', source: 'dbNSFP 4.9c' },
                      { name: 'PhyloP (100-way)', signal: 'Per-site conservation', contribution: 'Minor', source: 'dbNSFP 4.9c' },
                      { name: 'GERP++', signal: 'Per-element conservation', contribution: 'Minor', source: 'dbNSFP 4.9c' },
                    ].map((row, i) => (
                      <tr key={row.name} className={i < 7 ? 'border-b border-border' : ''}>
                        <td className="px-6 py-3 text-base font-medium text-foreground">{row.name}</td>
                        <td className="px-4 py-3 text-md text-muted-foreground">{row.signal}</td>
                        <td className="px-4 py-3 text-md text-muted-foreground">{row.contribution}</td>
                        <td className="px-4 py-3 text-md text-muted-foreground">{row.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-6 bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="text-lg font-semibold text-foreground">BayesDel_noAF Normalization</p>
              <p className="text-base text-muted-foreground leading-relaxed">BayesDel_noAF scores are linearly normalized from their observed range to [0, 1] before weighting. ClinGen SVI evidence tiers are used for justification text but do not directly determine the screening score -- the normalized continuous value is used instead for maximum discrimination.</p>
            </div>
            <div className="mt-4 bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="text-lg font-semibold text-foreground">NULL Handling</p>
              <p className="text-base text-muted-foreground leading-relaxed">When BayesDel_noAF is unavailable for a variant (NULL or NaN), its weight is redistributed proportionally among the remaining seven predictors. This ensures consistent scoring regardless of predictor coverage gaps. Each individual predictor uses safe type conversion with NaN detection.</p>
            </div>
          </div>
        </section>

        {/* 5. WEIGHT SYSTEM */}
        <section id="weight-system" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Weight System</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">Different clinical contexts require different scoring emphasis. The weight system selects appropriate component weights based on patient age group, screening mode, and phenotype availability. All weight sets sum to exactly 1.0.</p>
            </div>
            <div className="space-y-6">
              {weightProfiles.map((profile) => (
                <div key={profile.mode} className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">{profile.mode}</p>
                    <p className="text-md text-muted-foreground">{profile.condition}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {profile.distribution.map((d) => (
                      <div key={d.component} className="text-center space-y-1">
                        <p className="text-sm text-muted-foreground truncate">{d.component}</p>
                        <span className={`inline-block px-2 py-0.5 text-sm rounded ${levelColors[d.level] || 'bg-muted text-muted-foreground'}`}>{d.level}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-border">
                    <p className="text-md text-muted-foreground"><span className="font-medium text-foreground">Rationale: </span>{profile.rationale}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="text-lg font-semibold text-foreground">Design Principle</p>
              <p className="text-base text-muted-foreground leading-relaxed">Age relevance weight increases with patient age: Elevated for neonatal/pediatric, Elevated for adult, Highest for elderly. This reflects the clinical reality that older patients benefit most from narrowly actionable findings, while younger patients warrant broader screening.</p>
            </div>
          </div>
        </section>

        {/* 6. CLINICAL BOOSTS */}
        <section id="clinical-boosts" className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Clinical Profile Boosts</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">Nine boost categories leverage the complete clinical profile submitted with each screening request. Boosts are added to the base weighted score and can promote variants to higher tiers. Total score is always capped at 1.0.</p>
            </div>
            <div className="space-y-3">
              {clinicalBoosts.map((boost) => (
                <div key={boost.name} className="bg-card border border-border rounded-lg p-6 space-y-2">
                  <p className="text-lg font-semibold text-foreground">{boost.name}</p>
                  <p className="text-base text-muted-foreground leading-relaxed">{boost.description}</p>
                  <p className="text-md text-muted-foreground"><span className="font-medium text-foreground">Activated when: </span>{boost.condition}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="text-lg font-semibold text-foreground">Boost Interaction</p>
              <p className="text-base text-muted-foreground leading-relaxed">Multiple boosts can apply simultaneously. A variant in BRCA1 for an Ashkenazi Jewish patient with family history of cancer will receive ACMG classification boost, ethnicity boost, and family history boost concurrently. The total boosted score is capped at 1.0 to prevent score inflation.</p>
            </div>
          </div>
        </section>

        {/* 7. TIER SYSTEM */}
        <section id="tier-system" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Tier System</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">Four-tier priority ranking with two-stage assignment: base tier from component scores, then final tier after applying all clinical boosts.</p>
            </div>
            <div className="space-y-4">
              {[
                { tier: 'Tier 1', label: 'High Priority -- Immediate Review', description: 'Variants requiring immediate clinical attention. Includes all Pathogenic and Likely Pathogenic variants regardless of base score, strong phenotype matches, and variants exceeding the high-priority score threshold. Capped at a configurable maximum (default: 20 variants).', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
                { tier: 'Tier 2', label: 'Moderate Priority -- Monitor', description: 'Variants with moderate clinical relevance. Includes Tier 2 phenotype matches and variants with intermediate boosted scores. Warrant review but are less urgent than Tier 1.', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' },
                { tier: 'Tier 3', label: 'Low Priority -- Future Consideration', description: 'Variants with low but non-trivial clinical relevance. May become significant with additional clinical information or future variant reclassification.', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' },
                { tier: 'Tier 4', label: 'Very Low Priority -- Likely Benign', description: 'Variants with minimal clinical relevance under current evidence. Excluded from results by default; included only when explicitly requested.', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
              ].map((t) => (
                <div key={t.tier} className={`rounded-lg p-6 space-y-2 border ${t.color}`}>
                  <p className="text-lg font-semibold text-foreground">{t.tier}: {t.label}</p>
                  <p className="text-base text-muted-foreground leading-relaxed">{t.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="text-lg font-semibold text-foreground">Base Tier Assignment</p>
              <p className="text-base text-muted-foreground leading-relaxed">The base tier uses both the total weighted score and individual component peaks. A variant with an exceptional signal in a single component (e.g., a highly constrained gene or very high deleteriousness) can be promoted to Tier 1 even if other components are moderate. This prevents clinically significant variants from being buried by low scores in irrelevant dimensions.</p>
            </div>
            <div className="mt-4 bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="text-lg font-semibold text-foreground">Final Tier Determination (Post-Boost)</p>
              <p className="text-base text-muted-foreground leading-relaxed">After all clinical boosts are applied, the final tier may differ from the base tier. Key guarantee: all Pathogenic and Likely Pathogenic variants, all VUS with strong null variant evidence (PVS1), and all strong phenotype matches always appear in Tier 1 regardless of their base component scores. ACMG classification takes priority over component-level scoring.</p>
            </div>
          </div>
        </section>

        {/* 8. GENE LISTS */}
        <section id="gene-lists" className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Gene Lists</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">Curated gene lists drive age relevance scoring, clinical actionability assessment, and ethnicity-specific prioritization.</p>
            </div>
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-6 space-y-3">
                <p className="text-lg font-semibold text-foreground">ACMG Secondary Findings v3.2 (81 genes)</p>
                <p className="text-base text-muted-foreground leading-relaxed">Three categories: Cancer Predisposition (25 genes including APC, BRCA1, BRCA2, MLH1, MSH2, TP53, VHL), Cardiac (34 genes including KCNH2, KCNQ1, MYBPC3, MYH7, SCN5A, LMNA), and Metabolic (8 genes including LDLR, BTD, RPE65). These genes receive elevated age relevance scores across all age groups and are used for clinical actionability assessment.</p>
                <p className="text-md text-muted-foreground"><span className="font-medium text-foreground">Source: </span>Miller DT et al. Genet Med. 2023;25(1):100726</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 space-y-3">
                <p className="text-lg font-semibold text-foreground">Pediatric Gene Lists</p>
                <p className="text-base text-muted-foreground leading-relaxed">Three curated categories: Early-Onset Disease Genes (CFTR, SMN1, GAA, and other genes causing conditions diagnosable at birth), Treatable Metabolic Conditions (PAH, GALT, and other genes where early intervention changes outcomes), and Childhood-Onset Genes (NF1, PKD1, and other genes causing conditions typically presenting in childhood).</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 space-y-3">
                <p className="text-lg font-semibold text-foreground">Adult-Onset Gene Lists</p>
                <p className="text-base text-muted-foreground leading-relaxed">Two curated categories: Cancer High-Risk (BRCA1, BRCA2, MLH1, MSH2, TP53, PTEN, and other high-penetrance cancer predisposition genes) and Cardiac (KCNH2, MYBPC3, SCN5A, LMNA, and other genes associated with sudden cardiac death or cardiomyopathy).</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 space-y-3">
                <p className="text-lg font-semibold text-foreground">Population-Specific Founder Variants</p>
                <p className="text-base text-muted-foreground leading-relaxed">Curated founder mutation gene lists for ethnicity-aware prioritization: Ashkenazi Jewish (BRCA1/2, GBA, HEXA, FANCC, BLM, MSH2, MSH6), African ancestry (HBB, G6PD), East/South Asian (ALDH2, CYP2C19, HBA1, HBA2, HBB), and European (BRCA1/2, CFTR).</p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. SCREENING MODES */}
        <section id="screening-modes" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Screening Modes</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">Six screening modes determine the weight profile and prioritization strategy.</p>
            </div>
            <div className="space-y-3">
              {[
                { mode: 'Diagnostic', desc: 'Patient has HPO phenotype terms. Phenotype matching dominates scoring. Used when clinical presentation guides interpretation.' },
                { mode: 'Neonatal Screening', desc: 'Newborn screening (0-28 days). Prioritizes early-onset disease genes, treatable metabolic conditions, and haploinsufficient genes.' },
                { mode: 'Pediatric Screening', desc: 'Child and adolescent screening (1-18 years). Prioritizes childhood-onset conditions with emphasis on gene constraint and age-relevant genes.' },
                { mode: 'Proactive Adult', desc: 'Adult health screening (18-65 years). Emphasizes cancer predisposition, cardiac risk genes, and computational deleteriousness predictions.' },
                { mode: 'Carrier Screening', desc: 'Recessive carrier identification for reproductive risk assessment.' },
                { mode: 'Pharmacogenomics', desc: 'Drug response screening for medication safety and efficacy.' },
              ].map((m) => (
                <div key={m.mode} className="bg-card border border-border rounded-lg p-6 space-y-1">
                  <p className="text-lg font-semibold text-foreground">{m.mode}</p>
                  <p className="text-base text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="text-lg font-semibold text-foreground">Age Group Determination</p>
              <p className="text-base text-muted-foreground leading-relaxed">Patient age is converted to one of six age groups: Neonatal (0-28 days), Infant (29 days - 1 year), Child (1-12 years), Adolescent (12-18 years), Adult (18-65 years), Elderly (65+ years). Day-level precision is used for neonatal/infant boundary. Age can be provided in days, years, or both.</p>
            </div>
          </div>
        </section>

        {/* 10. LIMITATIONS */}
        <section id="limitations" className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Limitations</h2>
            </div>
            <div className="bg-card border border-border rounded-lg p-8 space-y-4">
              {limitations.map((limitation, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full shrink-0 mt-2.5" />
                  <p className="text-base text-muted-foreground leading-relaxed">{limitation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 11. REFERENCES */}
        <section id="references" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">References</h2>
            </div>
            <div className="space-y-4">
              {references.map((ref, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6 space-y-1">
                  <p className="text-base text-foreground leading-relaxed"><span className="font-medium">{ref.authors}</span> {ref.title}</p>
                  <p className="text-md text-muted-foreground">{ref.journal}</p>
                  <a href={`https://pubmed.ncbi.nlm.nih.gov/${ref.id.replace('PMID: ', '')}/`} target="_blank" rel="noopener noreferrer" className="text-md font-mono text-primary hover:underline">{ref.id}</a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-semibold text-primary">Questions About Our Screening Methodology?</h2>
            <p className="text-base text-muted-foreground">We welcome technical questions from clinical geneticists and laboratory directors. Transparency is foundational to clinical trust.</p>
            <div className="flex items-center justify-center gap-4">
              <RequestDemoButton />
              <Link href="/contact" className="px-6 py-3 border border-border text-foreground rounded-md text-base font-medium hover:bg-muted transition-colors">Contact Us</Link>
            </div>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link href="/methodology" className="text-md text-primary hover:underline">Classification Methodology</Link>
              <Link href="/docs/screening" className="text-md text-primary hover:underline">Screening Documentation</Link>
              <Link href="/docs/phenotype-matching" className="text-md text-primary hover:underline">Phenotype Matching</Link>
              <Link href="/use-cases/newborn-screening" className="text-md text-primary hover:underline">Newborn Screening</Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  )
}
