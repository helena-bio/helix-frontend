export interface NavItem {
  title: string
  href: string
  children?: NavItem[]
}

export const docsNavigation: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
    children: [
      { title: 'Uploading a VCF File', href: '/docs/getting-started/uploading-vcf' },
      { title: 'Setting HPO Terms', href: '/docs/getting-started/setting-hpo-terms' },
      { title: 'Understanding Results', href: '/docs/getting-started/understanding-results' },
      { title: 'Quality Presets', href: '/docs/getting-started/quality-presets' },
    ],
  },
  {
    title: 'Classification',
    href: '/docs/classification',
    children: [
      { title: 'ACMG Framework', href: '/docs/classification/acmg-framework' },
      { title: 'Criteria Reference', href: '/docs/classification/criteria-reference' },
      { title: 'Combining Rules', href: '/docs/classification/combining-rules' },
      { title: 'ClinVar Integration', href: '/docs/classification/clinvar-integration' },
      { title: 'Conflicting Evidence', href: '/docs/classification/conflicting-evidence' },
      { title: 'Confidence Scores', href: '/docs/classification/confidence-scores' },
    ],
  },
  {
    title: 'Computational Predictors',
    href: '/docs/predictors',
    children: [
      { title: 'SpliceAI', href: '/docs/predictors/spliceai' },
      { title: 'SIFT', href: '/docs/predictors/sift' },
      { title: 'AlphaMissense', href: '/docs/predictors/alphamissense' },
      { title: 'MetaSVM', href: '/docs/predictors/metasvm' },
      { title: 'DANN', href: '/docs/predictors/dann' },
      { title: 'Conservation Scores', href: '/docs/predictors/conservation-scores' },
      { title: 'Consensus Calculation', href: '/docs/predictors/consensus-calculation' },
    ],
  },
  {
    title: 'Reference Databases',
    href: '/docs/databases',
    children: [
      { title: 'gnomAD', href: '/docs/databases/gnomad' },
      { title: 'ClinVar', href: '/docs/databases/clinvar' },
      { title: 'dbNSFP', href: '/docs/databases/dbnsfp' },
      { title: 'HPO', href: '/docs/databases/hpo' },
      { title: 'ClinGen', href: '/docs/databases/clingen' },
      { title: 'Ensembl VEP', href: '/docs/databases/ensembl-vep' },
      { title: 'SpliceAI Precomputed', href: '/docs/databases/spliceai-precomputed' },
      { title: 'Update Policy', href: '/docs/databases/database-update-policy' },
    ],
  },
  {
    title: 'Phenotype Matching',
    href: '/docs/phenotype-matching',
    children: [
      { title: 'HPO Overview', href: '/docs/phenotype-matching/hpo-overview' },
      { title: 'Semantic Similarity', href: '/docs/phenotype-matching/semantic-similarity' },
      { title: 'Clinical Tiers', href: '/docs/phenotype-matching/clinical-tiers' },
      { title: 'Interpreting Scores', href: '/docs/phenotype-matching/interpreting-scores' },
      { title: 'HPO Term Selection Guide', href: '/docs/phenotype-matching/hpo-term-selection-guide' },
    ],
  },
  {
    title: 'Screening',
    href: '/docs/screening',
    children: [
      { title: 'Scoring Components', href: '/docs/screening/scoring-components' },
      { title: 'Tier System', href: '/docs/screening/tier-system' },
      { title: 'Screening Modes', href: '/docs/screening/screening-modes' },
      { title: 'Age-Aware Prioritization', href: '/docs/screening/age-aware-prioritization' },
    ],
  },
  {
    title: 'Literature Evidence',
    href: '/docs/literature',
    children: [
      { title: 'Literature Evidence', href: '/docs/literature/literature-evidence' },
      { title: 'Relevance Scoring', href: '/docs/literature/relevance-scoring' },
      { title: 'Evidence Strength', href: '/docs/literature/evidence-strength' },
      { title: 'PubMed Coverage', href: '/docs/literature/pubmed-coverage' },
    ],
  },
  {
    title: 'AI Clinical Assistant',
    href: '/docs/ai-assistant',
    children: [
      { title: 'Capabilities', href: '/docs/ai-assistant/capabilities' },
      { title: 'Asking Questions', href: '/docs/ai-assistant/asking-questions' },
      { title: 'Clinical Interpretation', href: '/docs/ai-assistant/clinical-interpretation' },
      { title: 'Database Queries', href: '/docs/ai-assistant/database-queries' },
    ],
  },
  {
    title: 'Data and Privacy',
    href: '/docs/data-and-privacy',
    children: [
      { title: 'Infrastructure', href: '/docs/data-and-privacy/infrastructure' },
      { title: 'GDPR Compliance', href: '/docs/data-and-privacy/gdpr-compliance' },
      { title: 'Data Retention', href: '/docs/data-and-privacy/data-retention' },
      { title: 'No External Calls', href: '/docs/data-and-privacy/no-external-calls' },
    ],
  },
  { title: 'Limitations', href: '/docs/limitations' },
  { title: 'Glossary', href: '/docs/glossary' },
  { title: 'FAQ', href: '/docs/faq' },
  { title: 'Changelog', href: '/docs/changelog' },
  { title: 'References', href: '/docs/references' },
]
