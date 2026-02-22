/**
 * Docs search index.
 * Each entry has: href, title, section (parent), and content (searchable text).
 * Content includes headings, key terms, and representative sentences.
 * Extend this file when adding new docs pages.
 */

export interface SearchEntry {
  href: string
  title: string
  section: string
  content: string
}

export const docsSearchIndex: SearchEntry[] = [
  // Getting Started
  {
    href: '/docs/getting-started',
    title: 'Getting Started',
    section: 'Getting Started',
    content: 'VCF file upload pipeline six stages parsing quality filtering annotation reference database enrichment ACMG classification export gene panels WES WGS processing time maximum sensitivity no pre-filtering',
  },
  {
    href: '/docs/getting-started/uploading-vcf',
    title: 'Uploading a VCF File',
    section: 'Getting Started',
    content: 'VCF 4.1 4.2 plain text bgzipped vcf.gz whole genome sequencing GRCh38 hg38 GRCh37 hg19 automatic liftover single sample bcftools trio analysis chromosomes chr1 chr22 chrX chrY chrM decoys contigs data handling EU infrastructure Helsinki Finland deleted after processing',
  },
  {
    href: '/docs/getting-started/setting-hpo-terms',
    title: 'Setting HPO Terms',
    section: 'Getting Started',
    content: 'Human Phenotype Ontology HPO standardized clinical vocabulary phenotypic abnormalities PP4 criterion phenotype matching screening prioritization seizure neurodevelopmental cardiology nephrology metabolic neonatal autocomplete free-text clinical description negation detection five to fifteen terms',
  },
  {
    href: '/docs/getting-started/understanding-results',
    title: 'Understanding Results',
    section: 'Getting Started',
    content: 'gene-centric view variant annotations ACMG classification criteria confidence score consequence impact HGVS notation genotype heterozygous homozygous population frequency gnomAD ClinVar significance computational predictors SpliceAI gene constraint pLI LOEUF phenotype match score screening tier literature evidence Tier 1 shortlist',
  },
  {
    href: '/docs/getting-started/quality-presets',
    title: 'Quality Presets',
    section: 'Getting Started',
    content: 'quality filtering strict balanced permissive QUAL depth DP genotype quality GQ thresholds 30 20 10 ClinVar rescue mechanism pathogenic likely pathogenic rescued variants Sanger sequencing confirmation low coverage',
  },
  // Classification
  {
    href: '/docs/classification',
    title: 'Classification',
    section: 'Classification',
    content: 'ACMG AMP 2015 guidelines Bayesian point-based framework Tavtigian ClinGen SVI Pejaver Walker evidence-based classification priority order BA1 stand-alone conflict check ClinVar override Bayesian point system pathogenic likely pathogenic VUS likely benign benign',
  },
  {
    href: '/docs/classification/acmg-framework',
    title: 'ACMG Framework',
    section: 'Classification',
    content: 'ACMG AMP 2015 Richards Genetics in Medicine international standard 28 evidence criteria strength levels very strong strong moderate supporting stand-alone pathogenic benign 19 automated 9 manual Bayesian Tavtigian BayesDel ClinGen SVI computational predictor PP3 BP4 VCEP gene-specific specifications expert panel',
  },
  {
    href: '/docs/classification/criteria-reference',
    title: 'Criteria Reference',
    section: 'Classification',
    content: 'PVS1 null variant loss-of-function frameshift stop_gained splice pLI LOEUF PS1 same amino acid ClinVar pathogenic PS2 de novo PS3 functional studies PS4 prevalence PM1 functional domain Pfam PM2 absent controls gnomAD frequency 0.0001 PM3 trans compound heterozygote PM4 protein length PM5 disabled PM6 de novo PP1 cosegregation PP2 missense constraint PP3 BayesDel SpliceAI PP4 phenotype HPO PP5 reputable source BA1 frequency 5% BS1 BS2 homozygote BS3 BS4 BP1 missense truncating BP2 trans dominant BP3 in-frame repetitive BP4 BayesDel BP5 alternate BP6 benign BP7 synonymous splice',
  },
  {
    href: '/docs/classification/combining-rules',
    title: 'Combining Rules',
    section: 'Classification',
    content: 'Bayesian point system Tavtigian 2018 2020 very strong +8 strong +4 moderate +2 supporting +1 benign strong -4 supporting -1 BA1 override pathogenic 10 points likely pathogenic 6-9 VUS 0-5 likely benign -1 to -5 benign -6 original 18 ACMG combining rules mathematically equivalent',
  },
  {
    href: '/docs/classification/clinvar-integration',
    title: 'ClinVar Integration',
    section: 'Classification',
    content: 'ClinVar evidence criteria PS1 PP5 BP6 classification override quality filter rescue review stars 0 1 2 3 4 single submitter expert panel practice guideline conflicting computational evidence BA1 overrides ClinVar VUS does not override transparency criteria string version 2025-01',
  },
  {
    href: '/docs/classification/conflicting-evidence',
    title: 'Conflicting Evidence',
    section: 'Classification',
    content: 'conflicting evidence pathogenic benign criteria two-level approach high-confidence conflict safety check strong very strong manual review Bayesian point summation net total BA1 exception false positives clinical safety invasive procedures cascade testing',
  },
  {
    href: '/docs/classification/confidence-scores',
    title: 'Confidence Scores',
    section: 'Classification',
    content: 'confidence score continuous Bayesian point distance classification boundary 0.80-0.99 pathogenic 0.70-0.90 likely pathogenic 0.30-0.60 VUS reclassification additional evidence functional studies family segregation probability disease causation phenotype inheritance clinical context',
  },
]
