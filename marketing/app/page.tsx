import type { Metadata } from 'next'
import { Header, Footer, VideoHero, BenefitsSection, FeaturesSection, HowItWorksSection, DatabaseIntegrationsSection, SecurityComplianceSection, FinalCTASection } from '@/components'
import { JsonLd } from '@/components/seo'

export const metadata: Metadata = {
  title: 'Helix Insight -- AI-Powered Variant Interpretation for Clinical Genetics Laboratories',
  description: 'Automated ACMG classification, phenotype matching, and clinical reporting. From VCF upload to diagnostic insight in minutes. EU-hosted, GDPR-compliant. Free to start.',
  alternates: {
    canonical: 'https://helixinsight.bio',
  },
}

const softwareApplicationData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  'name': 'Helix Insight',
  'applicationCategory': 'HealthApplication',
  'applicationSubCategory': 'Clinical Genetics Software',
  'operatingSystem': 'Web',
  'url': 'https://helixinsight.bio',
  'description': 'AI-powered variant interpretation platform for clinical genetics laboratories. Automated ACMG/AMP classification, HPO phenotype matching, biomedical literature mining, and clinical report generation.',
  'featureList': [
    'Automated ACMG/AMP variant classification',
    'BayesDel_noAF with ClinGen SVI-calibrated thresholds',
    'HPO phenotype matching with semantic similarity',
    'AI clinical assistant with natural language database queries',
    'Clinical interpretation report generation (PDF/DOCX)',
    'Age-aware variant screening and prioritization',
    'Biomedical literature search (1M+ publications)',
    'VCF 4.1/4.2 support (gene panels, WES, WGS)',
  ],
  'offers': {
    '@type': 'Offer',
    'price': '0',
    'priceCurrency': 'EUR',
    'description': 'Freemium -- 3 free cases per month',
  },
  'provider': {
    '@type': 'Organization',
    'name': 'Helena Bioinformatics',
    'url': 'https://helena.bio',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Sofia',
      'addressCountry': 'BG',
    },
  },
  'softwareRequirements': 'Modern web browser',
  'memoryRequirements': 'None (cloud-based)',
  'storageRequirements': 'None (cloud-based)',
  'processorRequirements': 'None (cloud-based)',
}

export default function MarketingPage() {
  return (
    <div className="h-full flex flex-col">
      <JsonLd data={softwareApplicationData} />
      <Header />
      <main className="flex-1 overflow-y-auto">
        <section className="flex items-center justify-center px-6 pt-20 pb-8">
          <VideoHero />
        </section>
        <BenefitsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <DatabaseIntegrationsSection />
        <SecurityComplianceSection />
        <FinalCTASection />
      <Footer />
      </main>
    </div>
  )
}
