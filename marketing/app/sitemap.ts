import type { MetadataRoute } from 'next'

const BASE_URL = 'https://helena.bio'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  // High-priority marketing pages
  const marketingPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/for-geneticists`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/methodology`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/dpa`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/dpia`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Documentation section pages (high SEO value)
  const docsSectionPages = [
    '/docs',
    '/docs/getting-started',
    '/docs/getting-started/uploading-vcf',
    '/docs/getting-started/setting-hpo-terms',
    '/docs/getting-started/understanding-results',
    '/docs/getting-started/quality-presets',
    '/docs/classification',
    '/docs/classification/acmg-framework',
    '/docs/classification/criteria-reference',
    '/docs/classification/combining-rules',
    '/docs/classification/clinvar-integration',
    '/docs/classification/conflicting-evidence',
    '/docs/classification/confidence-scores',
    '/docs/predictors',
    '/docs/predictors/spliceai',
    '/docs/predictors/sift',
    '/docs/predictors/alphamissense',
    '/docs/predictors/metasvm',
    '/docs/predictors/dann',
    '/docs/predictors/conservation-scores',
    '/docs/predictors/consensus-calculation',
    '/docs/databases',
    '/docs/databases/gnomad',
    '/docs/databases/clinvar',
    '/docs/databases/dbnsfp',
    '/docs/databases/hpo',
    '/docs/databases/clingen',
    '/docs/databases/ensembl-vep',
    '/docs/databases/spliceai-precomputed',
    '/docs/databases/database-update-policy',
    '/docs/phenotype-matching',
    '/docs/phenotype-matching/hpo-overview',
    '/docs/phenotype-matching/semantic-similarity',
    '/docs/phenotype-matching/clinical-tiers',
    '/docs/phenotype-matching/interpreting-scores',
    '/docs/phenotype-matching/hpo-term-selection-guide',
    '/docs/screening',
    '/docs/screening/scoring-components',
    '/docs/screening/tier-system',
    '/docs/screening/screening-modes',
    '/docs/screening/age-aware-prioritization',
    '/docs/literature',
    '/docs/literature/literature-evidence',
    '/docs/literature/relevance-scoring',
    '/docs/literature/evidence-strength',
    '/docs/literature/pubmed-coverage',
    '/docs/ai-assistant',
    '/docs/ai-assistant/capabilities',
    '/docs/ai-assistant/asking-questions',
    '/docs/ai-assistant/clinical-interpretation',
    '/docs/ai-assistant/database-queries',
    '/docs/data-and-privacy',
    '/docs/data-and-privacy/infrastructure',
    '/docs/data-and-privacy/gdpr-compliance',
    '/docs/data-and-privacy/data-retention',
    '/docs/data-and-privacy/no-external-calls',
    '/docs/limitations',
    '/docs/glossary',
    '/docs/faq',
    '/docs/changelog',
    '/docs/references',
  ]

  const docsPages: MetadataRoute.Sitemap = docsSectionPages.map((path) => {
    // Section index pages get higher priority
    const depth = path.split('/').length - 2 // /docs = 1, /docs/x = 2, /docs/x/y = 3
    const priority = depth <= 1 ? 0.8 : depth === 2 ? 0.7 : 0.6

    return {
      url: `${BASE_URL}${path}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority,
    }
  })

  return [...marketingPages, ...docsPages]
}
