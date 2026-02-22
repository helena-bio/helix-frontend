import { Header, Footer } from '@/components'
import Link from 'next/link'
import { RequestDemoButton } from '@/components/marketing/RequestDemoButton'
import {
  FileText, Database, ClipboardCheck, Beaker,
  Dna, ShieldCheck, AlertTriangle, History,
  BookOpen, ChevronRight, ArrowRight, ExternalLink,
  Scale, FlaskConical, Activity, Layers,
  Filter, Binary, GitBranch
} from 'lucide-react'

export const metadata = {
  title: 'Classification Methodology | Helix Insight',
  description: 'Complete ACMG/AMP variant classification methodology. Transparent documentation of criteria, thresholds, databases, and combining rules used by Helix Insight.',
}

/* ---------------------------------------------------------------------------
   CONSTANTS -- Every value here is extracted from production code:
   acmg_classifier.py (SQLACMGClassifier, SQLClassificationConfig)
   Source of truth: git commit hash should be referenced in version history.
   --------------------------------------------------------------------------- */

const CLASSIFIER_VERSION = '3.5'
const LAST_UPDATED = 'February 2026'
const ACMG_REFERENCE = 'Richards et al., Genetics in Medicine, 2015'
const CLINGEN_SVI_REFERENCE = 'Walker et al., Am J Hum Genet. 2023;110(7):1046-1067. PMID: 37352859'
const TAVTIGIAN_REFERENCE = 'Tavtigian et al., Hum Mutat. 2018;39(11):1485-1492. PMID: 30311386'
const PEJAVER_REFERENCE = 'Pejaver et al., Am J Hum Genet. 2022;109(12):2163-2177. PMID: 36413997'

const tocSections = [
  { id: 'pipeline', label: 'Pipeline Overview' },
  { id: 'databases', label: 'Reference Databases' },
  { id: 'classification', label: 'ACMG Classification' },
  { id: 'automated-criteria', label: 'Automated Criteria' },
  { id: 'predictors', label: 'Computational Predictors' },
  { id: 'spliceai', label: 'SpliceAI Integration' },
  { id: 'classification-logic', label: 'Classification Logic' },
  { id: 'vcep', label: 'VCEP Gene-Specific Specifications' },
  { id: 'clinvar-override', label: 'ClinVar Override Logic' },
  { id: 'manual-criteria', label: 'Manual Review Criteria' },
  { id: 'quality-filtering', label: 'Quality Filtering' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'changelog', label: 'Version History' },
  { id: 'references', label: 'References' },
]

const pipelineStages = [
  { stage: 1, name: 'VCF Parsing', duration: '~60s', description: 'Standard VCF file parsed into columnar in-memory database. Multi-allelic handling, genome build detection (GRCh38 required).' },
  { stage: 2, name: 'Quality Filtering', duration: '~5s', description: 'Configurable quality, depth, and genotype quality thresholds. ClinVar-listed pathogenic variants are protected from filtering.' },
  { stage: 3, name: 'VEP Annotation', duration: '~3-4 min', description: 'Ensembl Variant Effect Predictor for consequence, impact, transcript, and protein annotations. Parallel processing across chromosomes.' },
  { stage: 4, name: 'Reference DB Annotation', duration: '~5-10s', description: 'Population frequencies, clinical significance, functional predictions, gene constraint, phenotype associations, and dosage sensitivity loaded from 7 reference databases.' },
  { stage: 5, name: 'ACMG Classification', duration: '<1s', description: 'SQL-based ACMG/AMP 2015 classification using Bayesian point framework (Tavtigian et al. 2018). 19 automated criteria evaluated with calibrated evidence strength, point-based classification thresholds applied, continuous confidence scores assigned. Optional VCEP gene-specific overlay for ~50-60 genes.' },
  { stage: 6, name: 'Export', duration: '~5s', description: 'Gene-level summaries exported for streaming. Classified variants persisted to analytical database for downstream services.' },
]

const referenceDatabases = [
  {
    name: 'gnomAD',
    version: 'v4.1.0',
    scale: '~759M variants',
    source: 'gnomad.broadinstitute.org',
    sourceUrl: 'https://gnomad.broadinstitute.org',
    provides: 'Population allele frequencies (global and population-specific), allele counts, homozygote counts',
    usedBy: 'BA1 (allele frequency > 5%), BS1 (elevated frequency), PM2 (absent in controls), BS2 (homozygote count)',
    columns: 'global_af, global_ac, global_an, global_hom, af_grpmax, popmax',
  },
  {
    name: 'ClinVar',
    version: '2025-01',
    scale: '~4.1M variants',
    source: 'ncbi.nlm.nih.gov/clinvar',
    sourceUrl: 'https://www.ncbi.nlm.nih.gov/clinvar/',
    provides: 'Clinical significance assertions, review star levels, disease associations, submitter information',
    usedBy: 'PS1 (known pathogenic), PP5 (reputable source pathogenic), BP6 (reputable source benign), ClinVar override logic, quality filter rescue',
    columns: 'clinical_significance, review_stars, clinvar_variation_id, disease_name, hgvsp',
  },
  {
    name: 'dbNSFP',
    version: '4.9c',
    scale: '~80.6M variant sites',
    source: 'sites.google.com/site/jpopgen/dbNSFP',
    sourceUrl: 'https://sites.google.com/site/jpopgen/dbNSFP',
    provides: 'Functional impact predictions from multiple algorithms, conservation scores',
    usedBy: 'PP3/BP4 primary tool: BayesDel_noAF with ClinGen SVI calibrated thresholds (Pejaver et al. 2022). Display predictors: SIFT, AlphaMissense, MetaSVM, DANN, PhyloP, GERP (available for clinical review, not used in classification logic)',
    columns: 'bayesdel_noaf_score, bayesdel_addaf_score, sift_pred, sift_score, alphamissense_pred, alphamissense_score, metasvm_pred, metasvm_score, dann_score, phylop100way_vertebrate, gerp_rs',
  },
  {
    name: 'SpliceAI',
    version: 'Ensembl MANE (Release 113)',
    scale: 'Precomputed for all coding variants',
    source: 'Illumina / Ensembl',
    sourceUrl: 'https://github.com/Illumina/SpliceAI',
    provides: 'Splice impact predictions (4 delta scores: acceptor gain, acceptor loss, donor gain, donor loss)',
    usedBy: 'PP3_splice (max score >= 0.2), BP4 guard (max score < 0.1), BP7 (synonymous splice check)',
    columns: 'spliceai_max_score (maximum of DS_AG, DS_AL, DS_DG, DS_DL)',
  },
  {
    name: 'gnomAD Constraint',
    version: 'v4.1.0',
    scale: '~18.2K genes',
    source: 'gnomad.broadinstitute.org',
    sourceUrl: 'https://gnomad.broadinstitute.org',
    provides: 'Gene-level constraint metrics indicating tolerance to loss-of-function and missense variation',
    usedBy: 'PVS1 (LoF intolerance), PP2 (missense constraint), BP1 (LoF tolerance)',
    columns: 'pli, oe_lof_upper (LOEUF), oe_lof, mis_z',
  },
  {
    name: 'HPO',
    version: 'Latest release',
    scale: '~320K gene-phenotype associations',
    source: 'hpo.jax.org',
    sourceUrl: 'https://hpo.jax.org',
    provides: 'Gene-to-phenotype associations using Human Phenotype Ontology terms',
    usedBy: 'PP4 (patient phenotype matching)',
    columns: 'hpo_ids, hpo_names, hpo_count, hpo_frequency_data, hpo_disease_ids',
  },
  {
    name: 'ClinGen',
    version: 'Latest release',
    scale: '~1.6K genes',
    source: 'clinicalgenome.org',
    sourceUrl: 'https://clinicalgenome.org',
    provides: 'Dosage sensitivity scores (haploinsufficiency, triplosensitivity)',
    usedBy: 'BS1 (inheritance-aware frequency threshold proxy), BP2 (trans with pathogenic in recessive)',
    columns: 'haploinsufficiency_score, triplosensitivity_score',
  },
  {
    name: 'Ensembl VEP',
    version: 'Release 113',
    scale: 'All coding/non-coding consequences',
    source: 'ensembl.org',
    sourceUrl: 'https://www.ensembl.org/info/docs/tools/vep/index.html',
    provides: 'Variant consequence prediction, protein impact, transcript annotation, functional domain mapping',
    usedBy: 'PVS1 (consequence type), PM1 (Pfam domains), PM4 (in-frame indels), BP3 (non-critical regions), BP7 (synonymous), all impact-based criteria',
    columns: 'consequence, impact, biotype, exon_number, domains, gene_symbol, transcript_id, hgvs_cdna, hgvs_protein',
  },
]

/* Pathogenic criteria -- automated */
const pathogenicCriteria = [
  {
    code: 'PVS1',
    name: 'Null variant in gene where loss-of-function is a known disease mechanism',
    strength: 'Very Strong',
    conditions: [
      'Impact = HIGH',
      'Consequence: frameshift, stop_gained, splice_acceptor, or splice_donor variant',
      'Gene constraint: pLI > 0.9 OR LOEUF < 0.35',
    ],
    exclusions: [
      'NMD-rescued transcripts (consequence contains NMD_transcript)',
      'Stop-retained and stop-lost variants',
      'HLA gene family (HLA-A, HLA-B, HLA-C, HLA-DRA, HLA-DRB1, HLA-DRB5, HLA-DQA1, HLA-DQB1, HLA-DPA1, HLA-DPB1, HLA-E, HLA-F, HLA-G, HLA-DMA, HLA-DMB, HLA-DOA, HLA-DOB)',
    ],
    databases: 'VEP (consequence, impact), gnomAD Constraint (pLI, LOEUF)',
    limitations: [
      'Does not evaluate reading frame rescue via downstream in-frame reinitiation',
      'Does not assess alternative transcript usage or tissue-specific expression',
      'Last-exon truncation logic not implemented (all qualifying exons treated equally)',
      'VCEP gene-specific PVS1 applicability gate available for ~50-60 genes (e.g., PVS1 disabled for gain-of-function genes like MYOC). Generic thresholds used for all other genes.',
    ],
  },
  {
    code: 'PS1',
    name: 'Same amino acid change as an established pathogenic variant',
    strength: 'Strong',
    conditions: [
      'ClinVar clinical significance: Pathogenic, Pathogenic/Likely_pathogenic, or Likely_pathogenic',
      'ClinVar review stars >= 2',
    ],
    exclusions: [],
    databases: 'ClinVar (clinical_significance, review_stars)',
    limitations: [
      'Matches on exact variant position and allele, not amino acid position (PM5 amino acid-level matching is disabled)',
      'ClinVar assertions may lag behind current evidence for recently reclassified variants',
    ],
  },
  {
    code: 'PM1',
    name: 'Located in a mutational hot spot or well-established functional domain',
    strength: 'Moderate',
    conditions: [
      'Variant overlaps a Pfam protein domain (VEP domains annotation contains "Pfam")',
    ],
    exclusions: [],
    databases: 'VEP (domains)',
    limitations: [
      'All Pfam domains treated equally regardless of functional importance',
      'Does not distinguish between domain core residues and peripheral positions',
      'Non-Pfam functional domains (e.g., UniProt annotated regions) not considered',
    ],
  },
  {
    code: 'PM2',
    name: 'Absent from controls or at extremely low frequency in population databases',
    strength: 'Moderate',
    conditions: [
      'gnomAD global allele frequency < 0.0001 (0.01%)',
      'Frequency data must be present (non-NULL) -- variants without gnomAD data do not qualify',
    ],
    exclusions: [],
    databases: 'gnomAD v4.1 (global_af)',
    limitations: [
      'Requires gnomAD frequency data to be available for the variant position',
      'Does not apply population-specific frequency adjustments',
      'ClinGen SVI PM2_Supporting downgrade not implemented (full Moderate strength used)',
      'When VCEP gene-specific specifications are enabled, PM2 threshold may differ from the generic 0.01% (e.g., 0% for RASopathy genes where any population frequency argues against pathogenicity)',
    ],
  },
  {
    code: 'PM3',
    name: 'Detected in trans with a pathogenic variant for recessive disorders',
    strength: 'Moderate',
    conditions: [
      'Variant flagged as compound heterozygote candidate (compound_het_candidate = true)',
    ],
    exclusions: [],
    databases: 'Pipeline-internal (compound heterozygote detection)',
    limitations: [
      'Compound heterozygote status inferred from genotype data without formal phasing',
      'Does not confirm that the trans variant is pathogenic',
      'Trio data or long-read phasing would provide definitive confirmation',
    ],
  },
  {
    code: 'PM4',
    name: 'Protein length change in a non-repetitive region',
    strength: 'Moderate',
    conditions: [
      'Consequence: in-frame insertion or in-frame deletion',
      'Located within a Pfam functional domain',
      'Not in a repetitive or low-complexity region (domains not containing "tandem", "repeat", "lowcomplexity", or "Seg")',
    ],
    exclusions: [
      'HLA gene family (same exclusion list as PVS1)',
    ],
    databases: 'VEP (consequence, domains)',
    limitations: [
      'Repetitive region detection based on VEP domain annotations only',
      'Does not evaluate whether the in-frame change disrupts a critical functional residue',
    ],
  },
  {
    code: 'PP2',
    name: 'Missense variant in a gene with low rate of benign missense variation',
    strength: 'Supporting',
    conditions: [
      'Consequence: missense variant',
      'Gene constraint: pLI > 0.5',
    ],
    exclusions: [],
    databases: 'VEP (consequence), gnomAD Constraint (pLI)',
    limitations: [
      'pLI measures loss-of-function constraint, not missense constraint specifically',
      'mis_z (missense Z-score) available but not used for this criterion',
    ],
  },
  {
    code: 'PP3',
    name: 'Computational evidence supports a deleterious effect (two independent paths)',
    strength: 'Supporting / Moderate / Strong',
    conditions: [
      'Path A (Missense -- BayesDel): BayesDel_noAF score evaluated with ClinGen SVI calibrated thresholds (Pejaver et al. 2022). Three strength levels: PP3_Strong (>= 0.518, +4 points), PP3_Moderate (0.290-0.517, +2 points), PP3_Supporting (0.130-0.289, +1 point). Scores below 0.130 are indeterminate.',
      'PM1 + PP3 double-counting guard: When PM1 (functional domain) applies alongside PP3_Strong, PP3 is downgraded to PP3_Moderate. Combined PM1 + PP3 capped at Strong equivalent (4 points) per ClinGen SVI.',
      'Path B (Splice evidence): SpliceAI max_score >= 0.2 AND PVS1 does not apply (ClinGen SVI 2023 double-counting guard). Always Supporting strength (+1 point).',
      'Paths A and B are independent. A variant can trigger both if it has a BayesDel score and a splice prediction.',
    ],
    exclusions: [
      'PP3_splice not applied when PVS1 is triggered (prevents double-counting loss-of-function and splice evidence per ClinGen SVI 2023)',
      'BayesDel indeterminate range (-0.180 to 0.129): no PP3 or BP4 applied',
    ],
    databases: 'dbNSFP 4.9c (bayesdel_noaf_score), SpliceAI (max_score)',
    limitations: [
      'BayesDel_noAF used to avoid circular reasoning with PM2/BA1/BS1 frequency criteria (Pejaver et al. 2022)',
      'PM1 + PP3 cap assumes PM1 = Moderate (2 points). Extensible if future VCEP upgrades PM1 strength.',
      'BayesDel does not reach PP3_Very_Strong per Pejaver calibration data',
    ],
  },
  {
    code: 'PP4',
    name: 'Patient phenotype is highly specific for a disease with a single genetic etiology',
    strength: 'Supporting',
    conditions: [
      'Requires patient HPO terms to be provided for the analysis session',
      'Trigger condition A: >= 3 patient HPO terms match the gene HPO profile',
      'Trigger condition B: >= 2 patient HPO terms match AND gene has <= 5 total HPO associations (highly specific gene-phenotype relationship)',
    ],
    exclusions: [
      'Not evaluated when no patient HPO terms are provided',
    ],
    databases: 'HPO (gene-phenotype associations)',
    limitations: [
      'HPO matching is exact term overlap, not semantic similarity (ontology hierarchy not used at this stage)',
      'Semantic similarity-based matching is performed by the downstream Phenotype Matching Service',
    ],
  },
  {
    code: 'PP5',
    name: 'Reputable source reports variant as pathogenic',
    strength: 'Supporting',
    conditions: [
      'ClinVar clinical significance: Pathogenic, Pathogenic/Likely_pathogenic, or Likely_pathogenic',
      'ClinVar review stars >= 1 AND < 2 (lower confidence than PS1)',
    ],
    exclusions: [
      'Does not apply when PS1 already applies (prevents double-counting ClinVar evidence at different strength levels)',
    ],
    databases: 'ClinVar (clinical_significance, review_stars)',
    limitations: [
      'ClinGen SVI has recommended retiring PP5 as a standalone criterion; retained for maximum sensitivity',
    ],
  },
]

/* Benign criteria -- automated */
const benignCriteria = [
  {
    code: 'BA1',
    name: 'Allele frequency is above 5% in population databases',
    strength: 'Stand-alone',
    conditions: [
      'gnomAD global allele frequency > 0.05 (5%)',
    ],
    exclusions: [],
    databases: 'gnomAD v4.1 (global_af)',
    limitations: [
      'Uses global allele frequency only; population-specific BA1 thresholds not implemented',
    ],
    note: 'BA1 is the only stand-alone ACMG criterion. A variant meeting BA1 is classified as Benign regardless of any other evidence, including ClinVar assertions. When VCEP gene-specific specifications are enabled, the BA1 threshold may be lower than 5% for specific genes (e.g., 0.1% for Cardiomyopathy genes).',
  },
  {
    code: 'BS1',
    name: 'Allele frequency is greater than expected for the disorder',
    strength: 'Strong',
    conditions: [
      'Autosomal dominant proxy (ClinGen haploinsufficiency score = 3): allele frequency >= 0.001 (0.1%) AND <= 5%',
      'Default / autosomal recessive proxy (haploinsufficiency score < 3 or NULL): allele frequency >= 0.05 (5%) AND <= 5%',
    ],
    exclusions: [
      'Does not apply when BA1 applies (BA1 takes precedence)',
    ],
    databases: 'gnomAD v4.1 (global_af), ClinGen (haploinsufficiency_score as inheritance proxy)',
    limitations: [
      'ClinGen haploinsufficiency score is a proxy for inheritance mode, not a direct determination',
      'When VCEP gene-specific specifications are enabled, BS1 uses VCEP-defined thresholds that are already mode-of-inheritance-aware, overriding the generic AD/AR proxy logic',
    ],
  },
  {
    code: 'BS2',
    name: 'Observed in a healthy adult individual for a fully penetrant early-onset disorder',
    strength: 'Strong',
    conditions: [
      'gnomAD homozygote count > 15',
    ],
    exclusions: [],
    databases: 'gnomAD v4.1 (global_hom)',
    limitations: [
      'Does not distinguish between early-onset and late-onset conditions',
      'Fixed threshold; not adjusted for disease penetrance or frequency',
    ],
  },
  {
    code: 'BP1',
    name: 'Missense variant in a gene for which primarily truncating variants are known to cause disease',
    strength: 'Supporting',
    conditions: [
      'Consequence: missense variant',
      'Impact: MODERATE',
      'Gene constraint: pLI < 0.1 (gene is tolerant to loss-of-function)',
      'pLI value must be present (non-NULL)',
    ],
    exclusions: [],
    databases: 'VEP (consequence, impact), gnomAD Constraint (pLI)',
    limitations: [
      'Low pLI used as proxy for "primarily truncating variants cause disease"',
      'Does not directly assess whether missense variants are a known disease mechanism for the gene',
    ],
  },
  {
    code: 'BP2',
    name: 'Observed in trans with a pathogenic variant for a fully penetrant dominant disorder',
    strength: 'Supporting',
    conditions: [
      'Compound heterozygote candidate (compound_het_candidate = true)',
      'ClinGen haploinsufficiency score = 30 (dosage sensitivity unlikely)',
    ],
    exclusions: [],
    databases: 'Pipeline-internal (compound heterozygote detection), ClinGen (haploinsufficiency_score)',
    limitations: [
      'Trans observation inferred without formal phasing',
      'Haploinsufficiency score of 30 is a specific ClinGen code for "dosage sensitivity unlikely"',
    ],
  },
  {
    code: 'BP3',
    name: 'In-frame insertion or deletion in a repetitive region without a known function',
    strength: 'Supporting',
    conditions: [
      'Consequence: in-frame insertion or in-frame deletion',
      'Located in a repetitive/low-complexity region (domains contain "tandem", "repeat", "lowcomplexity", or "Seg"), OR not in any Pfam domain, OR no domain annotation available',
    ],
    exclusions: [],
    databases: 'VEP (consequence, domains)',
    limitations: [
      'Complementary to PM4 (PM4 requires Pfam domain; BP3 requires absence of critical domain)',
    ],
  },
  {
    code: 'BP4',
    name: 'Computational evidence suggests no impact on gene or gene product',
    strength: 'Supporting / Moderate',
    conditions: [
      'BayesDel_noAF score evaluated with ClinGen SVI calibrated thresholds (Pejaver et al. 2022). Two strength levels: BP4_Moderate (<= -0.361, -2 points), BP4_Supporting (-0.360 to -0.181, -1 point).',
      'SpliceAI max_score must be < 0.1 or absent (no predicted splice impact)',
    ],
    exclusions: [
      'BayesDel indeterminate range (-0.180 to 0.129): no BP4 applied',
    ],
    databases: 'dbNSFP 4.9c (bayesdel_noaf_score), SpliceAI (max_score)',
    limitations: [
      'BayesDel_noAF does not reach BP4_Strong per Pejaver calibration data',
      'SpliceAI guard prevents BP4 for variants with any predicted splice impact',
    ],
  },
  {
    code: 'BP6',
    name: 'Reputable source reports variant as benign',
    strength: 'Supporting',
    conditions: [
      'ClinVar clinical significance: Benign, Benign/Likely_benign, or Likely_benign',
      'ClinVar review stars >= 1',
    ],
    exclusions: [],
    databases: 'ClinVar (clinical_significance, review_stars)',
    limitations: [
      'ClinGen SVI has recommended retiring BP6 as a standalone criterion; retained for maximum sensitivity',
    ],
  },
  {
    code: 'BP7',
    name: 'Synonymous variant with no predicted impact on splicing',
    strength: 'Supporting',
    conditions: [
      'Consequence: synonymous variant',
      'Not in a splice region (consequence does not contain "splice_region")',
      'SpliceAI max_score <= 0.1 or absent',
    ],
    exclusions: [],
    databases: 'VEP (consequence), SpliceAI (max_score)',
    limitations: [
      'Conservation filter intentionally omitted per Walker et al. 2023 Table S13 recommendation ("no improvement in negative predictive value" with conservation filter)',
    ],
    note: 'Aligned with ClinGen SVI 2023 (Walker et al.) Figure 4 decision tree for synonymous variant classification.',
  },
]

/* Criteria requiring manual review */
const manualCriteria = [
  {
    code: 'PS2',
    name: 'De novo variant (confirmed paternity and maternity)',
    reason: 'Requires trio sequencing data and confirmed parental relationships. Cannot be determined from single-sample VCF analysis.',
  },
  {
    code: 'PS3',
    name: 'Well-established in vitro or in vivo functional studies show a deleterious effect',
    reason: 'Requires curation of published functional assay data. Automated literature extraction of functional evidence is not yet implemented.',
  },
  {
    code: 'PS4',
    name: 'Prevalence of the variant in affected individuals is significantly increased compared with controls',
    reason: 'Requires case-control study data or odds ratios not available in standard annotation databases.',
  },
  {
    code: 'PM5',
    name: 'Novel missense change at an amino acid residue where a different pathogenic missense has been observed',
    reason: 'Currently disabled. Requires normalized HGVSp matching against ClinVar at the amino acid position level. Will be enabled when ClinVar preprocessing provides standardized protein-level coordinates.',
    status: 'Disabled (pending implementation)',
  },
  {
    code: 'PM6',
    name: 'Assumed de novo without confirmation of paternity and maternity',
    reason: 'Requires family structure information not available in single-sample analysis.',
  },
  {
    code: 'PP1',
    name: 'Cosegregation with disease in multiple affected family members',
    reason: 'Requires multi-generational pedigree data and segregation analysis.',
  },
  {
    code: 'BS3',
    name: 'Well-established in vitro or in vivo functional studies show no deleterious effect',
    reason: 'Requires curation of published functional assay data (benign counterpart of PS3).',
  },
  {
    code: 'BS4',
    name: 'Lack of segregation in affected members of a family',
    reason: 'Requires family segregation data not available in single-sample analysis.',
  },
  {
    code: 'BP5',
    name: 'Variant found in a case with an alternate molecular basis for disease',
    reason: 'Requires clinical case-level information about alternative diagnoses.',
  },
]

/* Computational predictor configuration (legacy -- display only since v3.4) */
const predictors = [
  {
    name: 'SIFT',
    weight: 1.0,
    damagingCondition: 'Prediction contains "D" (Deleterious)',
    benignCondition: 'Prediction contains "T" (Tolerated)',
    ambiguous: 'Prediction absent or does not match D/T',
    source: 'dbNSFP 4.9c',
  },
  {
    name: 'AlphaMissense',
    weight: 1.3,
    damagingCondition: 'Prediction contains "P" (Pathogenic)',
    benignCondition: 'Prediction contains "B" (Benign)',
    ambiguous: 'Prediction absent or does not match P/B (e.g., "A" for Ambiguous)',
    source: 'dbNSFP 4.9c',
  },
  {
    name: 'MetaSVM',
    weight: 1.0,
    damagingCondition: 'Prediction contains "D" (Deleterious)',
    benignCondition: 'Prediction contains "T" (Tolerated)',
    ambiguous: 'Prediction absent or does not match D/T',
    source: 'dbNSFP 4.9c',
  },
  {
    name: 'DANN',
    weight: 1.0,
    damagingCondition: 'Score >= 0.95',
    benignCondition: 'Score < 0.5',
    ambiguous: 'Score between 0.5 and 0.95, or absent',
    source: 'dbNSFP 4.9c',
  },
  {
    name: 'PhyloP (100-way vertebrate)',
    weight: 0.8,
    damagingCondition: 'Score > 2.0 (conserved)',
    benignCondition: 'Score <= 0.0 (not conserved)',
    ambiguous: 'Score between 0.0 and 2.0, or absent',
    source: 'dbNSFP 4.9c',
    note: 'Conservation metric, not a direct functional predictor',
  },
  {
    name: 'GERP++',
    weight: 0.8,
    damagingCondition: 'Score > 4.0 (constrained)',
    benignCondition: 'Score <= 0.0 (unconstrained)',
    ambiguous: 'Score between 0.0 and 4.0, or absent',
    source: 'dbNSFP 4.9c',
    note: 'Conservation metric, not a direct functional predictor',
  },
]

/* Combining rules */
const pathogenicRules = [
  { code: 'P1', rule: '1 Very Strong (PVS) + >= 1 Strong (PS)' },
  { code: 'P2', rule: '1 Very Strong (PVS) + >= 2 Moderate (PM)' },
  { code: 'P3', rule: '1 Very Strong (PVS) + 1 Moderate (PM) + 1 Supporting (PP)' },
  { code: 'P4', rule: '1 Very Strong (PVS) + >= 2 Supporting (PP)' },
  { code: 'P5', rule: '>= 2 Strong (PS)' },
  { code: 'P6', rule: '1 Strong (PS) + >= 3 Moderate (PM)' },
  { code: 'P7', rule: '1 Strong (PS) + 2 Moderate (PM) + >= 2 Supporting (PP)' },
  { code: 'P8', rule: '1 Strong (PS) + >= 4 Moderate (PM)' },
]

const likelyPathogenicRules = [
  { code: 'LP1', rule: '1 Very Strong (PVS) + 1 Moderate (PM)' },
  { code: 'LP2', rule: '1 Strong (PS) + 1-2 Moderate (PM)' },
  { code: 'LP3', rule: '1 Strong (PS) + >= 2 Supporting (PP)' },
  { code: 'LP4', rule: '>= 3 Moderate (PM)' },
  { code: 'LP5', rule: '2 Moderate (PM) + >= 2 Supporting (PP)' },
  { code: 'LP6', rule: '1 Moderate (PM) + >= 4 Supporting (PP)' },
]

const benignRules = [
  { code: 'B1', rule: '1 Stand-alone (BA1) -- frequency > 5%' },
  { code: 'B2', rule: '>= 2 Strong benign (BS)' },
]

const likelyBenignRules = [
  { code: 'LB1', rule: '1 Strong benign (BS) + 1 Supporting benign (BP)' },
  { code: 'LB2', rule: '>= 2 Supporting benign (BP)' },
]

/* Quality filter presets */
const qualityPresets = [
  { name: 'Strict', quality: '>= 30', depth: '>= 20', genotypeQuality: '>= 30', use: 'High-confidence clinical reporting' },
  { name: 'Balanced', quality: '>= 20', depth: '>= 15', genotypeQuality: '>= 20', use: 'Standard clinical analysis (default)' },
  { name: 'Permissive', quality: '>= 10', depth: '>= 10', genotypeQuality: '>= 10', use: 'Maximum sensitivity / research' },
]

/* Version history */
const versionHistory = [
  {
    version: 'v3.5',
    date: 'February 2026',
    changes: [
      'ClinGen VCEP gene-specific specification overlay (optional, enabled by default)',
      'BA1, BS1, PM2: gene-specific frequency thresholds from published VCEP specifications (~50-60 genes)',
      'PVS1: gene-specific applicability gate (disabled for gain-of-function genes)',
      'VCEP audit trail: criteria string includes [VCEP:Panel vX.Y] marker when gene-specific thresholds applied',
      'VCEP toggle: can be enabled/disabled per case in case settings',
      'Source: ClinGen Criteria Specification Registry (CSpec)',
    ],
  },
  {
    version: 'v3.4',
    date: 'February 2026',
    changes: [
      'Bayesian point-based classification framework (Tavtigian et al. 2018, 2020) replaces sequential 18-rule evaluation',
      'All 18 original ACMG combining rules produce identical results under the point system (backward compatible)',
      'Point system fills gaps: evidence combinations not covered by original 18 rules now classified properly',
      'PP3/BP4: BayesDel_noAF single-tool replaces weighted 6-predictor consensus (ClinGen SVI calibration, Pejaver et al. 2022)',
      'PP3 evidence strength modulation: Strong (>= 0.518), Moderate (0.290-0.517), Supporting (0.130-0.289)',
      'BP4 evidence strength modulation: Moderate (<= -0.361), Supporting (-0.360 to -0.181)',
      'PM1 + PP3 double-counting guard: combined evidence capped at Strong equivalent (4 points)',
      'Continuous confidence scores derived from point distance to classification threshold boundary',
      'Conflicting evidence handled by point summation (more nuanced than binary VUS default)',
      'High-confidence conflict safety check: Strong/Very Strong pathogenic vs. Strong benign flagged for manual review',
      'Legacy predictors (SIFT, AlphaMissense, MetaSVM, DANN, PhyloP, GERP) retained as display data only',
    ],
  },
  {
    version: 'v3.3',
    date: 'February 2026',
    changes: [
      'SpliceAI PP3 threshold aligned to ClinGen SVI 2023 recommendation (lowered from 0.5 to 0.2)',
      'PP3_splice excluded when PVS1 applies (ClinGen SVI double-counting guard)',
      'BP7 upgraded: synonymous + not splice_region + SpliceAI <= 0.1 (Walker et al. Figure 4)',
      'BP7 conservation filter intentionally omitted per Walker et al. Table S13',
      'Evidence strength modulation (PP3_Moderate for high SpliceAI) deferred pending VCEP specifications',
    ],
  },
  {
    version: 'v3.2',
    date: 'February 2026',
    changes: [
      'SpliceAI integration: PP3_splice path for splice evidence',
      'BP4 SpliceAI guard: requires max_score < 0.1 for benign consensus',
      'Criteria string distinguishes PP3 (missense) from PP3_splice (splice)',
    ],
  },
  {
    version: 'v3.1',
    date: 'January 2026',
    changes: [
      'Maximum sensitivity approach: removed all frequency and impact pre-filtering',
      'All quality-passing variants proceed through classification',
      'Clinicians decide clinical relevance using classification + annotations',
    ],
  },
  {
    version: 'v3.0',
    date: 'January 2026',
    changes: [
      'Conflicting evidence priority: pathogenic + benign evidence produces VUS',
      'BA1 stand-alone override: allele frequency > 5% always classified Benign',
      'ClinVar override restricted to non-conflicting evidence only',
      'SQL-based classification engine (100x performance improvement)',
      'PM2 fix: requires non-NULL frequency data',
    ],
  },
]

/* Limitations */
const limitations = [
  'Helix Insight is a clinical decision support tool, not a diagnostic device. All classifications require review and confirmation by a qualified clinical geneticist.',
  '9 of 28 ACMG criteria require information not available from single-sample VCF analysis (segregation, functional studies, de novo confirmation). These criteria must be evaluated manually by the reviewing geneticist.',
  'SpliceAI predictions are computational. RNA splicing studies remain the gold standard for confirming splice-altering effects.',
  'Population frequency data from gnomAD may underrepresent certain ethnic groups and geographic populations. Allele frequency thresholds should be interpreted in the context of the patient\'s ancestry.',
  'ClinVar assertions vary in quality and currency. Review star levels are displayed alongside all ClinVar-derived evidence to enable informed interpretation.',
  'Structural variants (SVs), copy number variants (CNVs), and repeat expansions are not currently classified by this pipeline.',
  'Mitochondrial variants are processed through the same pipeline using nuclear ACMG rules as an approximation. Dedicated mitochondrial classification guidelines (e.g., MitoMap criteria) are not yet implemented.',
  'VCEP gene-specific specifications are implemented as a threshold overlay for BA1, BS1, PM2, and PVS1 applicability. The overlay does not implement VCEP-specific functional assay interpretation (PS3/BS3) or gene-specific segregation logic (PP1/BS4), which require manual curation. Coverage is limited to approximately 50-60 genes with published ClinGen CSpec specifications; all other genes use generic ACMG 2015 thresholds.',
  'PM5 (novel missense at known pathogenic amino acid position) is currently disabled pending standardized protein-level coordinate matching in the ClinVar preprocessing pipeline.',
  'Compound heterozygote detection is inferred from genotype data without long-read phasing or trio analysis. Formal phasing should be performed for clinical confirmation.',
  'Results should always be interpreted in the context of the patient\'s clinical presentation, family history, and other available clinical information.',
]

/* References */
const references = [
  {
    authors: 'Tavtigian SV, Greenblatt MS, Harrison SM, et al.',
    title: 'Modeling the ACMG/AMP variant classification guidelines as a Bayesian classification framework.',
    journal: 'Human Mutation. 2018;39(11):1485-1492.',
    id: 'PMID: 30311386',
  },
  {
    authors: 'Tavtigian SV, Harrison SM, Boucher KM, Biesecker LG.',
    title: 'Fitting a naturally scaled point system to the ACMG/AMP variant classification guidelines.',
    journal: 'Human Genetics. 2020;139(8):1057-1067.',
    id: 'PMID: 32666219',
  },
  {
    authors: 'Pejaver V, Byrne AB, Feng BJ, et al.',
    title: 'Calibration of computational tools for missense variant pathogenicity classification and ClinGen recommendations for PP3/BP4 criteria.',
    journal: 'American Journal of Human Genetics. 2022;109(12):2163-2177.',
    id: 'PMID: 36413997',
  },
  {
    authors: 'Richards S, Aziz N, Bale S, et al.',
    title: 'Standards and guidelines for the interpretation of sequence variants: a joint consensus recommendation of the American College of Medical Genetics and Genomics and the Association for Molecular Pathology.',
    journal: 'Genetics in Medicine. 2015;17(5):405-424.',
    id: 'PMID: 25741868',
  },
  {
    authors: 'Walker LC, Hoya M, Wiggins GAR, et al.',
    title: 'Using the ACMG/AMP framework to capture evidence related to predicted and observed impact on splicing: Recommendations from the ClinGen SVI Splicing Subgroup.',
    journal: 'American Journal of Human Genetics. 2023;110(7):1046-1067.',
    id: 'PMID: 37352859',
  },
  {
    authors: 'Jaganathan K, Kyriazopoulou Panagiotopoulou S, McRae JF, et al.',
    title: 'Predicting Splicing from Primary Sequence with Deep Learning.',
    journal: 'Cell. 2019;176(3):535-548.e24.',
    id: 'PMID: 30661751',
  },
  {
    authors: 'Karczewski KJ, Francioli LC, Tiao G, et al.',
    title: 'The mutational constraint spectrum quantified from variation in 141,456 humans.',
    journal: 'Nature. 2020;581(7809):434-443.',
    id: 'PMID: 32461654',
  },
  {
    authors: 'Cheng J, Novati G, Pan J, et al.',
    title: 'Accurate proteome-wide missense variant effect prediction with AlphaMissense.',
    journal: 'Science. 2023;381(6664):eadg7492.',
    id: 'PMID: 37733863',
  },
  {
    authors: 'McLaren W, Gil L, Hunt SE, et al.',
    title: 'The Ensembl Variant Effect Predictor.',
    journal: 'Genome Biology. 2016;17(1):122.',
    id: 'PMID: 27268795',
  },
  {
    authors: 'Landrum MJ, Lee JM, Benson M, et al.',
    title: 'ClinVar: improving access to variant interpretations and supporting evidence.',
    journal: 'Nucleic Acids Research. 2018;46(D1):D1062-D1067.',
    id: 'PMID: 29165669',
  },
]


/* ===========================================================================
   PAGE COMPONENT
   =========================================================================== */

export default function MethodologyPage() {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">

        {/* ---- HERO ---- */}
        <section className="pt-12 pb-8 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight text-primary">
              Classification Methodology
            </h1>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
              <span className="text-md text-muted-foreground">Classification Engine</span>
              <span className="text-md font-semibold text-foreground">v{CLASSIFIER_VERSION}</span>
              <span className="text-md text-muted-foreground">|</span>
              <span className="text-md text-muted-foreground">Updated {LAST_UPDATED}</span>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed">
              Complete documentation of how Helix Insight processes, annotates, and classifies genetic variants. Every threshold, database version, and classification rule used in production is documented on this page. This documentation is intended for clinical geneticists, laboratory directors, and accreditation auditors.
            </p>

            <p className="text-base text-muted-foreground leading-relaxed">
              Variant classification follows the ACMG/AMP 2015 framework ({ACMG_REFERENCE}) implemented through the Bayesian point-based system ({TAVTIGIAN_REFERENCE}) with BayesDel ClinGen SVI calibrated thresholds ({PEJAVER_REFERENCE}) and SpliceAI integration aligned to ClinGen SVI 2023 recommendations ({CLINGEN_SVI_REFERENCE}). Optional ClinGen VCEP gene-specific specification overlay is available for approximately 50-60 genes. Classification is strictly evidence-based. No machine learning model determines variant pathogenicity.
            </p>
          </div>
        </section>

        {/* ---- TABLE OF CONTENTS ---- */}
        <section className="pb-12 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-8">
              <p className="text-lg font-semibold text-foreground mb-4">Contents</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {tocSections.map((section, i) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-2 text-base text-muted-foreground hover:text-primary transition-colors py-1"
                  >
                    <span className="text-md text-muted-foreground/60 font-mono w-6">{(i + 1).toString().padStart(2, '0')}</span>
                    {section.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- 1. PIPELINE OVERVIEW ---- */}
        <section id="pipeline" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Pipeline Overview</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Six-stage processing pipeline transforms a raw VCF file into fully classified variants. Total execution time under 15 minutes for a whole genome (~4M variants) on dedicated hardware.
              </p>
            </div>

            <div className="space-y-3">
              {pipelineStages.map((s) => (
                <div key={s.stage} className="bg-card border border-border rounded-lg p-6 flex items-start gap-5">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary-foreground">{s.stage}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-3">
                      <p className="text-lg font-semibold text-foreground">{s.name}</p>
                      <span className="text-md font-mono text-muted-foreground">{s.duration}</span>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="text-lg font-semibold text-foreground">Maximum Sensitivity Approach</p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Helix Insight classifies all variants that pass quality filtering. There is no frequency-based or impact-based pre-filtering at any stage. A common variant (e.g., gnomAD allele frequency 40%) is still classified -- it will receive a Benign classification via BA1, but it is not silently discarded before classification. This design ensures that no variant is excluded from clinical review by an automated filter. The geneticist decides clinical relevance based on the complete classification and annotation data.
              </p>
            </div>
          </div>
        </section>

        {/* ---- 2. REFERENCE DATABASES ---- */}
        <section id="databases" className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Reference Databases</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                All reference data is stored locally on EU-based infrastructure. No variant data is sent to external APIs during processing. Database versions are fixed per deployment and documented here.
              </p>
            </div>

            <div className="space-y-4">
              {referenceDatabases.map((db) => (
                <div key={db.name} className="bg-card border border-border rounded-lg p-6 space-y-3">
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <p className="text-lg font-semibold text-foreground">{db.name}</p>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-primary/5 text-primary text-md rounded-full font-mono">{db.version}</span>
                      <span className="text-md text-muted-foreground">{db.scale}</span>
                    </div>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">{db.provides}</p>
                  <div className="pt-2 border-t border-border space-y-1">
                    <p className="text-md text-muted-foreground">
                      <span className="font-medium text-foreground">Used by: </span>
                      {db.usedBy}
                    </p>
                    <p className="text-md text-muted-foreground">
                      <span className="font-medium text-foreground">Source: </span>
                      <a href={db.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{db.source}</a>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- 3. ACMG CLASSIFICATION OVERVIEW ---- */}
        <section id="classification" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">ACMG/AMP Classification</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Variant classification follows the 2015 ACMG/AMP guidelines with 28 evidence criteria evaluated systematically. 19 criteria are fully automated; 9 require manual curation by the reviewing geneticist.
              </p>
            </div>

            {/* Classification priority */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-6">
              <p className="text-lg font-semibold text-foreground">Classification Priority Order</p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Classification logic is applied in strict priority order. Higher-priority rules are evaluated first, and the first matching rule determines the final classification:
              </p>
              <div className="space-y-3">
                {[
                  { priority: 1, label: 'BA1 Stand-alone', desc: 'Allele frequency > 5% is always classified Benign. BA1 is the only stand-alone criterion in the ACMG framework and cannot be overridden by any other evidence, including ClinVar assertions.' },
                  { priority: 2, label: 'Conflicting Evidence', desc: 'If a variant has pathogenic evidence at moderate strength or above (PVS, PS, or PM criteria triggered) AND strong benign evidence (BS criteria triggered), the variant is classified as VUS regardless of the individual evidence strength. This is a conservative approach that prioritizes clinical safety.' },
                  { priority: 3, label: 'ClinVar Override', desc: 'ClinVar classification is applied only when no conflicting computational evidence exists. Requires minimum review star level (default: 1 star). ClinVar VUS does not override computational classification.' },
                  { priority: 4, label: 'Bayesian Point System', desc: 'Each triggered criterion contributes points based on its evidence strength: Very Strong (+8), Strong (+4), Moderate (+2), Supporting (+1) for pathogenic; Strong (-4), Supporting (-1) for benign. Total points determine classification: >= 10 Pathogenic, 6-9 Likely Pathogenic, 0-5 VUS, -1 to -5 Likely Benign, <= -6 Benign. This system is mathematically equivalent to the original 18 ACMG combining rules while filling gaps for evidence combinations not explicitly covered.' },
                  { priority: 5, label: 'Default', desc: 'Variants that do not meet any of the above criteria are classified as Uncertain Significance (VUS).' },
                ].map((item) => (
                  <div key={item.priority} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-md font-semibold text-primary">{item.priority}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-medium text-foreground">{item.label}</p>
                      <p className="text-base text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Five-tier output */}
            <div className="mt-6 bg-card border border-border rounded-lg p-8 space-y-4">
              <p className="text-lg font-semibold text-foreground">Classification Output</p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Each variant receives one of five standard ACMG classifications, a list of all criteria that were triggered with evidence strength levels (e.g., "PVS1,PM2,PP3_Strong"), a Bayesian point total, and a continuous confidence score derived from the distance between the point total and the nearest classification boundary:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Pathogenic', points: '>= 10 pts', conf: '0.80-0.99' },
                  { label: 'Likely Pathogenic', points: '6-9 pts', conf: '0.70-0.90' },
                  { label: 'VUS', points: '0-5 pts', conf: '0.30-0.60' },
                  { label: 'Likely Benign', points: '-1 to -5 pts', conf: '0.70-0.90' },
                  { label: 'Benign', points: '<= -6 pts', conf: '0.80-0.99' },
                ].map((c) => (
                  <div key={c.label} className="bg-muted/50 rounded-lg p-3 text-center space-y-1">
                    <p className="text-md font-medium text-foreground">{c.label}</p>
                    <p className="text-sm font-mono text-muted-foreground">{c.points}</p>
                    <p className="text-sm font-mono text-muted-foreground">confidence: {c.conf}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- 4. AUTOMATED CRITERIA ---- */}
        <section id="automated-criteria" className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Automated Criteria (19 of 28)</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                These criteria are evaluated automatically for every quality-passing variant. Exact conditions and thresholds are documented below. Each criterion lists the databases it depends on and known limitations.
              </p>
            </div>

            {/* Pathogenic criteria */}
            <p className="text-lg font-semibold text-foreground mb-4">Pathogenic Evidence</p>
            <div className="space-y-4 mb-12">
              {pathogenicCriteria.map((criterion) => (
                <CriterionCard key={criterion.code} criterion={criterion} />
              ))}
            </div>

            {/* Benign criteria */}
            <p className="text-lg font-semibold text-foreground mb-4">Benign Evidence</p>
            <div className="space-y-4">
              {benignCriteria.map((criterion) => (
                <CriterionCard key={criterion.code} criterion={criterion} />
              ))}
            </div>
          </div>
        </section>

        {/* ---- 5. COMPUTATIONAL PREDICTORS ---- */}
        <section id="predictors" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Computational Predictors (PP3 / BP4)</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                PP3 and BP4 use BayesDel_noAF as the primary classification tool with ClinGen SVI calibrated thresholds (Pejaver et al. 2022). BayesDel is a Bayesian framework that integrates deleteriousness scores from multiple underlying predictors into a single calibrated score. The noAF variant (without allele frequency) is used to avoid circular reasoning with PM2, BA1, and BS1 frequency criteria.
              </p>
            </div>

            {/* BayesDel threshold table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-6 py-3 text-md font-semibold text-foreground">BayesDel_noAF Score</th>
                      <th className="text-left px-4 py-3 text-md font-semibold text-foreground">Evidence Strength</th>
                      <th className="text-left px-4 py-3 text-md font-semibold text-foreground">ACMG Code</th>
                      <th className="text-left px-4 py-3 text-md font-semibold text-foreground">Bayesian Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { score: '>= 0.518', strength: 'Strong pathogenic', code: 'PP3_Strong', points: '+4' },
                      { score: '0.290 to 0.517', strength: 'Moderate pathogenic', code: 'PP3_Moderate', points: '+2' },
                      { score: '0.130 to 0.289', strength: 'Supporting pathogenic', code: 'PP3_Supporting', points: '+1' },
                      { score: '-0.180 to 0.129', strength: 'Indeterminate', code: 'None', points: '0' },
                      { score: '-0.360 to -0.181', strength: 'Supporting benign', code: 'BP4_Supporting', points: '-1' },
                      { score: '<= -0.361', strength: 'Moderate benign', code: 'BP4_Moderate', points: '-2' },
                    ].map((row, i) => (
                      <tr key={row.code + i} className={i < 5 ? 'border-b border-border' : ''}>
                        <td className="px-6 py-3 font-mono text-base text-foreground">{row.score}</td>
                        <td className="px-4 py-3 text-md text-muted-foreground">{row.strength}</td>
                        <td className="px-4 py-3 font-mono text-md text-foreground">{row.code}</td>
                        <td className="px-4 py-3 font-mono text-md text-foreground">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PM1+PP3 cap */}
            <div className="mt-6 bg-card border border-border rounded-lg p-8 space-y-4">
              <p className="text-lg font-semibold text-foreground">PM1 + PP3 Double-Counting Guard</p>
              <p className="text-base text-muted-foreground leading-relaxed">
                When PM1 (functional domain, Moderate = 2 points) applies alongside PP3_Strong (4 points), the combined evidence would exceed the ClinGen SVI recommended cap of Strong equivalent (4 points). In this case, PP3_Strong is downgraded to PP3_Moderate (2 points), yielding a combined 2 + 2 = 4 points. PP3_Moderate and PP3_Supporting are not affected by this cap.
              </p>
            </div>

            {/* Why BayesDel */}
            <div className="mt-6 bg-card border border-border rounded-lg p-8 space-y-4">
              <p className="text-lg font-semibold text-foreground">Why BayesDel</p>
              <p className="text-base text-muted-foreground leading-relaxed">
                The ClinGen SVI Working Group calibrated four computational tools (BayesDel, MutPred2, REVEL, VEST4) and demonstrated that a single calibrated tool with evidence strength modulation provides more accurate classification than a fixed-threshold multi-predictor consensus. BayesDel_noAF was selected because it explicitly excludes allele frequency from its model (avoiding circular reasoning with PM2/BA1/BS1), is precomputed in dbNSFP 4.9c, and reaches both PP3_Strong and BP4_Moderate in the Pejaver calibration -- providing the widest evidence strength range among available tools.
              </p>
            </div>

            {/* Display predictors */}
            <div className="mt-6 bg-card border border-border rounded-lg p-8 space-y-4">
              <p className="text-lg font-semibold text-foreground">Display Predictors (Not Used in Classification)</p>
              <p className="text-base text-muted-foreground leading-relaxed">
                The following predictors are available alongside every variant for the reviewing geneticist to inspect, but they are not used in the PP3/BP4 classification logic. They were used in the weighted consensus approach prior to v3.4 and are retained for clinical reference:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {[
                  { name: 'SIFT', source: 'dbNSFP 4.9c' },
                  { name: 'AlphaMissense', source: 'dbNSFP 4.9c' },
                  { name: 'MetaSVM', source: 'dbNSFP 4.9c' },
                  { name: 'DANN', source: 'dbNSFP 4.9c' },
                  { name: 'PhyloP (100-way)', source: 'dbNSFP 4.9c' },
                  { name: 'GERP++', source: 'dbNSFP 4.9c' },
                ].map((p) => (
                  <div key={p.name} className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <p className="text-md font-medium text-foreground">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.source}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- 6. SPLICEAI INTEGRATION ---- */}
        <section id="spliceai" className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">SpliceAI Integration</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Splice impact predictions are integrated following ClinGen Sequence Variant Interpretation (SVI) Working Group recommendations (Walker et al., 2023).
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 space-y-6">
              <div className="space-y-3">
                <p className="text-base text-muted-foreground leading-relaxed">
                  SpliceAI predicts the impact of each variant on mRNA splicing through four delta scores: acceptor gain (DS_AG), acceptor loss (DS_AL), donor gain (DS_DG), and donor loss (DS_DL). The maximum of these four scores is used for classification thresholds.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Scores are sourced from Ensembl precomputed MANE transcript predictions, not computed at runtime. This ensures reproducibility and avoids runtime dependencies on external services.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-lg font-semibold text-foreground">Thresholds</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'PP3_splice', threshold: '>= 0.2', desc: 'Supporting evidence for spliceogenicity. Applied as independent PP3 path.' },
                    { label: 'BP4 guard', threshold: '< 0.1', desc: 'Required for BP4 to apply. Prevents benign classification when splice impact is predicted.' },
                    { label: 'BP7', threshold: '<= 0.1', desc: 'Required for synonymous variant BP7 classification. Confirms no splice impact.' },
                  ].map((t) => (
                    <div key={t.label} className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-md font-medium text-foreground">{t.label}</span>
                        <span className="font-mono text-md text-primary">{t.threshold}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-lg font-semibold text-foreground">PVS1 Double-Counting Guard</p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  When PVS1 (loss-of-function) is triggered for a variant, PP3_splice is not applied. This prevents double-counting the same biological mechanism (splice disruption leading to loss of function) as both PVS1 and PP3 evidence, per ClinGen SVI recommendation.
                </p>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-md text-muted-foreground">
                  <span className="font-medium text-foreground">Reference: </span>
                  Walker LC et al. Am J Hum Genet. 2023;110(7):1046-1067. PMID: 37352859
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---- 7. CLASSIFICATION LOGIC ---- */}
        <section id="classification-logic" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Classification Logic</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Classification uses the Bayesian point-based framework (Tavtigian et al. 2018, 2020) which is mathematically equivalent to the original 18 ACMG combining rules while providing proper classifications for evidence combinations not explicitly covered by the 2015 guidelines.
              </p>
            </div>

            {/* Bayesian Point System */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-6 mb-6">
              <p className="text-lg font-semibold text-foreground">Bayesian Point System (Primary)</p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Each evidence criterion contributes points based on its strength level. The total determines classification:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-md font-medium text-foreground">Pathogenic Evidence Points</p>
                  {[
                    { level: 'Very Strong (PVS)', points: '+8' },
                    { level: 'Strong (PS)', points: '+4' },
                    { level: 'Moderate (PM)', points: '+2' },
                    { level: 'Supporting (PP)', points: '+1' },
                  ].map((e) => (
                    <div key={e.level} className="flex justify-between items-center px-3 py-2 bg-muted/50 rounded">
                      <span className="text-md text-muted-foreground">{e.level}</span>
                      <span className="font-mono text-md text-foreground">{e.points}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-md font-medium text-foreground">Benign Evidence Points</p>
                  {[
                    { level: 'Stand-alone (BA1)', points: 'Override to Benign' },
                    { level: 'Strong (BS)', points: '-4' },
                    { level: 'Supporting (BP)', points: '-1' },
                  ].map((e) => (
                    <div key={e.level} className="flex justify-between items-center px-3 py-2 bg-muted/50 rounded">
                      <span className="text-md text-muted-foreground">{e.level}</span>
                      <span className="font-mono text-md text-foreground">{e.points}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-md font-medium text-foreground">Classification Thresholds</p>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {[
                    { label: 'Pathogenic', range: '>= 10' },
                    { label: 'Likely Path.', range: '6 to 9' },
                    { label: 'VUS', range: '0 to 5' },
                    { label: 'Likely Benign', range: '-1 to -5' },
                    { label: 'Benign', range: '<= -6' },
                  ].map((t) => (
                    <div key={t.label} className="bg-muted/50 rounded-lg p-3 text-center space-y-1">
                      <p className="text-md font-medium text-foreground">{t.label}</p>
                      <p className="text-sm font-mono text-muted-foreground">{t.range} pts</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Safety check */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-3 mb-6">
              <p className="text-lg font-semibold text-foreground">High-Confidence Conflict Safety Check</p>
              <p className="text-base text-muted-foreground leading-relaxed">
                When pathogenic evidence at Strong or Very Strong level conflicts with Strong benign evidence (BS), the variant is flagged for manual review regardless of the point total. This prevents automated resolution of genuinely conflicting high-quality evidence.
              </p>
            </div>

            {/* Legacy rules header */}
            <div className="mb-6">
              <p className="text-lg font-semibold text-foreground mb-2">ACMG 2015 Combining Rules (Reference)</p>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                The original 18 ACMG 2015 combining rules are a special case of the Bayesian point system -- every rule produces the same classification under both approaches. They are retained here as a reference.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pathogenic */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <p className="text-lg font-semibold text-foreground">Pathogenic (8 rules)</p>
                <div className="space-y-2">
                  {pathogenicRules.map((r) => (
                    <div key={r.code} className="flex items-start gap-3">
                      <span className="font-mono text-md text-primary shrink-0 w-8">{r.code}</span>
                      <span className="text-md text-muted-foreground">{r.rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Likely Pathogenic */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <p className="text-lg font-semibold text-foreground">Likely Pathogenic (6 rules)</p>
                <div className="space-y-2">
                  {likelyPathogenicRules.map((r) => (
                    <div key={r.code} className="flex items-start gap-3">
                      <span className="font-mono text-md text-primary shrink-0 w-8">{r.code}</span>
                      <span className="text-md text-muted-foreground">{r.rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benign */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <p className="text-lg font-semibold text-foreground">Benign (2 rules)</p>
                <div className="space-y-2">
                  {benignRules.map((r) => (
                    <div key={r.code} className="flex items-start gap-3">
                      <span className="font-mono text-md text-primary shrink-0 w-8">{r.code}</span>
                      <span className="text-md text-muted-foreground">{r.rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Likely Benign */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <p className="text-lg font-semibold text-foreground">Likely Benign (2 rules)</p>
                <div className="space-y-2">
                  {likelyBenignRules.map((r) => (
                    <div key={r.code} className="flex items-start gap-3">
                      <span className="font-mono text-md text-primary shrink-0 w-8">{r.code}</span>
                      <span className="text-md text-muted-foreground">{r.rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conflicting evidence note */}
            <div className="mt-6 bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="text-lg font-semibold text-foreground">Conflicting Evidence Handling</p>
              <p className="text-base text-muted-foreground leading-relaxed">
                The Bayesian point system naturally handles most conflicting evidence through point summation. For example, PM2 (+2) and BS1 (-4) yield a net of -2 = Likely Benign. Under the previous v3.3 system, this combination would have been flagged as conflicting and defaulted to VUS. The point-based approach is more nuanced and clinically appropriate. However, when pathogenic evidence at Strong or Very Strong level directly conflicts with Strong benign evidence, the variant is flagged for manual review regardless of point total (see High-Confidence Conflict Safety Check above). BA1 remains a stand-alone override handled at a higher priority level.
              </p>
            </div>
          </div>
        </section>

        {/* ---- 8. VCEP GENE-SPECIFIC SPECIFICATIONS ---- */}
        <section id="vcep" className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">VCEP Gene-Specific Specifications</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                ClinGen Variant Curation Expert Panels (VCEPs) adapt generic ACMG/AMP 2015 criteria to specific genes or diseases. Helix Insight implements approved VCEP specifications as an optional overlay on top of the standard classification.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 space-y-6">
              <div className="space-y-3">
                <p className="text-lg font-semibold text-foreground">How It Works</p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  The standard classification pipeline runs first, producing a generic ACMG classification for all variants. For variants in genes with available VCEP specifications, gene-specific thresholds are applied via a lightweight overlay that modifies frequency cutoffs (BA1, BS1, PM2) and criterion applicability (PVS1) based on the published VCEP specification. The Bayesian point total is then recalculated with the modified criteria.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-lg font-semibold text-foreground">What VCEPs Modify</p>
                <div className="space-y-2">
                  {[
                    { criterion: 'BA1', desc: 'Gene-specific allele frequency threshold for stand-alone benign (e.g., 0.1% for Cardiomyopathy genes instead of generic 5%)' },
                    { criterion: 'BS1', desc: 'Gene-specific elevated frequency threshold, already mode-of-inheritance-aware' },
                    { criterion: 'PM2', desc: 'Gene-specific absent-in-controls threshold (e.g., 0% for RASopathy genes)' },
                    { criterion: 'PVS1', desc: 'Gene-specific applicability gate. Set to FALSE for gain-of-function genes (e.g., MYOC in glaucoma)' },
                  ].map((item) => (
                    <div key={item.criterion} className="flex items-start gap-3">
                      <span className="font-mono text-md text-primary shrink-0 w-12 pt-0.5">{item.criterion}</span>
                      <p className="text-md text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-lg font-semibold text-foreground">Toggle Behavior</p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  VCEP overlay is enabled by default and can be disabled per case in case settings. When enabled, variants in VCEP-covered genes display an audit trail marker (e.g., "[VCEP:Hearing Loss v1.0]") in the criteria string.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-lg font-semibold text-foreground">Coverage</p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Approved VCEP specifications are sourced from the ClinGen Criteria Specification Registry (CSpec). Approximately 50-60 genes have published specifications, including panels for Hearing Loss, Cardiomyopathy (MYH7, MYBPC3), RASopathy (PTPN11, BRAF, SOS1), PTEN, CDH1, TP53, PAH, and BRCA1/BRCA2 (ENIGMA). For all other genes, generic ACMG 2015 thresholds are used.
                </p>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-md text-muted-foreground">
                  <span className="font-medium text-foreground">Source: </span>
                  <a href="https://cspec.genome.network" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ClinGen Criteria Specification Registry (cspec.genome.network)</a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---- 9. CLINVAR OVERRIDE ---- */}
        <section id="clinvar-override" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">ClinVar Override Logic</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                ClinVar clinical significance assertions are used as classification evidence, but only under specific conditions that prevent overriding computational evidence when conflicts exist.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 space-y-6">
              <div className="space-y-4">
                {[
                  { condition: 'When ClinVar override IS applied', desc: 'ClinVar has a Pathogenic, Likely Pathogenic, Benign, or Likely Benign assertion with at least 1 review star, AND no conflicting computational evidence exists (no BA1, no conflicting pathogenic+benign criteria at moderate+ strength).' },
                  { condition: 'When ClinVar override is NOT applied', desc: 'BA1 applies (frequency > 5% always overrides ClinVar). OR conflicting evidence exists (pathogenic + benign criteria both triggered). OR ClinVar asserts VUS (VUS does not override computational classification). OR ClinVar review stars are below the minimum threshold.' },
                ].map((item) => (
                  <div key={item.condition} className="space-y-2">
                    <p className="text-base font-medium text-foreground">{item.condition}</p>
                    <p className="text-base text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-base text-muted-foreground leading-relaxed">
                  When ClinVar classification is used, the criteria string includes "ClinVar" as the first element (e.g., "ClinVar,PM2,PP3") to make the evidence source explicit. ClinVar review star level is available alongside every variant for the reviewing geneticist to assess assertion quality.
                </p>
                <p className="text-md text-muted-foreground">
                  <span className="font-medium text-foreground">Default minimum review stars for override: </span>
                  <span className="font-mono">1</span> (configurable per deployment)
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---- 10. MANUAL REVIEW CRITERIA ---- */}
        <section id="manual-criteria" className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Manual Review Criteria (9 of 28)</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                These criteria require information that cannot be determined from a single-sample VCF file -- family segregation data, functional study results, confirmed de novo status, or case-level clinical context. They must be evaluated by the reviewing geneticist.
              </p>
            </div>

            <div className="space-y-3">
              {manualCriteria.map((c) => (
                <div key={c.code} className="bg-card border border-border rounded-lg p-6 flex items-start gap-4">
                  <span className="font-mono text-md font-semibold text-primary shrink-0 w-12 pt-0.5">{c.code}</span>
                  <div className="space-y-1">
                    <p className="text-base font-medium text-foreground">{c.name}</p>
                    <p className="text-md text-muted-foreground">{c.reason}</p>
                    {c.status && (
                      <span className="inline-block px-2 py-0.5 bg-muted text-md text-muted-foreground rounded mt-1">{c.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- 11. QUALITY FILTERING ---- */}
        <section id="quality-filtering" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Quality Filtering</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Three configurable quality presets control the stringency of variant filtering. Quality filtering occurs before annotation and classification.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-6 py-3 text-md font-semibold text-foreground">Preset</th>
                      <th className="text-left px-4 py-3 text-md font-semibold text-foreground">Quality (QUAL)</th>
                      <th className="text-left px-4 py-3 text-md font-semibold text-foreground">Depth (DP)</th>
                      <th className="text-left px-4 py-3 text-md font-semibold text-foreground">Genotype Quality (GQ)</th>
                      <th className="text-left px-4 py-3 text-md font-semibold text-foreground">Recommended Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualityPresets.map((p, i) => (
                      <tr key={p.name} className={i < qualityPresets.length - 1 ? 'border-b border-border' : ''}>
                        <td className="px-6 py-3 text-base font-medium text-foreground">{p.name}</td>
                        <td className="px-4 py-3 font-mono text-md text-muted-foreground">{p.quality}</td>
                        <td className="px-4 py-3 font-mono text-md text-muted-foreground">{p.depth}</td>
                        <td className="px-4 py-3 font-mono text-md text-muted-foreground">{p.genotypeQuality}</td>
                        <td className="px-4 py-3 text-md text-muted-foreground">{p.use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="text-lg font-semibold text-foreground">ClinVar Rescue Mechanism</p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Variants with documented clinical significance in ClinVar (Pathogenic or Likely Pathogenic) that fail quality thresholds are not discarded. They are flagged as rescued variants and proceed through the classification pipeline. This prevents clinically significant findings from being silently excluded due to sequencing quality in low-coverage regions -- a deliberate design decision for clinical safety.
              </p>
            </div>
          </div>
        </section>

        {/* ---- 12. LIMITATIONS ---- */}
        <section id="limitations" className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Limitations and Disclaimers</h2>
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

        {/* ---- 13. VERSION HISTORY ---- */}
        <section id="changelog" className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Version History</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Every methodology change is versioned and documented. The version number corresponds to the classification engine version in production.
              </p>
            </div>

            <div className="space-y-4">
              {versionHistory.map((v, i) => (
                <div key={v.version} className={`bg-card border rounded-lg p-6 space-y-3 ${i === 0 ? 'border-primary/30 border-2' : 'border-border'}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-semibold text-foreground">{v.version}</span>
                    {i === 0 && <span className="px-2 py-0.5 bg-primary/10 text-primary text-sm rounded">Current</span>}
                    <span className="text-md text-muted-foreground">{v.date}</span>
                  </div>
                  <div className="space-y-2">
                    {v.changes.map((change, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full shrink-0 mt-2" />
                        <p className="text-md text-muted-foreground">{change}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- 14. REFERENCES ---- */}
        <section id="references" className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">References</h2>
            </div>

            <div className="space-y-4">
              {references.map((ref, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6 space-y-1">
                  <p className="text-base text-foreground leading-relaxed">
                    <span className="font-medium">{ref.authors}</span> {ref.title}
                  </p>
                  <p className="text-md text-muted-foreground">{ref.journal}</p>
                  <a href={`https://pubmed.ncbi.nlm.nih.gov/${ref.id.replace("PMID: ", "")}/`} target="_blank" rel="noopener noreferrer" className="text-md font-mono text-primary hover:underline">{ref.id}</a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- CTA ---- */}
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-semibold text-primary">
              Questions About Our Methodology?
            </h2>
            <p className="text-base text-muted-foreground">
              We welcome technical questions from clinical geneticists and laboratory directors. Transparency is foundational to clinical trust.
            </p>
            <div className="flex items-center justify-center gap-4">
              <RequestDemoButton />
              <Link
                href="/contact"
                className="px-6 py-3 border border-border text-foreground rounded-md text-base font-medium hover:bg-muted transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>

      <Footer />
      </main>
    </div>
  )
}


/* ===========================================================================
   CRITERION CARD COMPONENT
   =========================================================================== */

interface CriterionData {
  code: string
  name: string
  strength: string
  conditions: string[]
  exclusions: string[]
  databases: string
  limitations: string[]
  note?: string
}

function CriterionCard({ criterion }: { criterion: CriterionData }) {
  const strengthColors: Record<string, string> = {
    'Very Strong': 'bg-red-500/10 text-red-700 dark:text-red-400',
    'Strong': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    'Moderate': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    'Supporting': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    'Stand-alone': 'bg-green-500/10 text-green-700 dark:text-green-400',
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-semibold text-foreground">{criterion.code}</span>
            <span className={`px-2 py-0.5 text-sm rounded ${strengthColors[criterion.strength] || 'bg-muted text-muted-foreground'}`}>
              {criterion.strength}
            </span>
          </div>
          <p className="text-base text-muted-foreground">{criterion.name}</p>
        </div>
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        <p className="text-md font-medium text-foreground">Conditions</p>
        {criterion.conditions.map((cond, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full shrink-0 mt-2" />
            <p className="text-md text-muted-foreground">{cond}</p>
          </div>
        ))}
      </div>

      {/* Exclusions */}
      {criterion.exclusions.length > 0 && (
        <div className="space-y-2">
          <p className="text-md font-medium text-foreground">Exclusions</p>
          {criterion.exclusions.map((exc, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full shrink-0 mt-2" />
              <p className="text-md text-muted-foreground">{exc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Databases and Limitations */}
      <div className="pt-3 border-t border-border space-y-2">
        <p className="text-md text-muted-foreground">
          <span className="font-medium text-foreground">Databases: </span>
          {criterion.databases}
        </p>
        {criterion.limitations.length > 0 && (
          <div className="space-y-1">
            <p className="text-md font-medium text-foreground">Known limitations</p>
            {criterion.limitations.map((lim, i) => (
              <p key={i} className="text-sm text-muted-foreground">{lim}</p>
            ))}
          </div>
        )}
        {criterion.note && (
          <p className="text-sm text-primary/80 mt-2">{criterion.note}</p>
        )}
      </div>
    </div>
  )
}
