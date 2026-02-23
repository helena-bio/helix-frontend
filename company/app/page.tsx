import type { Metadata } from 'next'
import { Header, Footer, HeroSection, MissionSection, ProductSection, ContactCTASection } from '@/components'
import { JsonLd } from '@/components/seo'

export const metadata: Metadata = {
  title: 'Helena Bioinformatics -- AI-Powered Clinical Genomics Software',
  description: 'Bulgarian deep-tech company developing Helix Insight -- an AI platform for automated clinical genomic variant interpretation at whole-genome scale. EU-hosted, GDPR-native.',
  alternates: {
    canonical: 'https://helena.bio',
  },
}

const organizationData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Helena Bioinformatics',
  'legalName': 'Helena Bioinformatics EOOD',
  'url': 'https://helena.bio',
  'description': 'Bulgarian deep-tech company specialising in AI-powered clinical genomic variant interpretation. Developer of Helix Insight platform.',
  'foundingDate': '2024',
  'address': {
    '@type': 'PostalAddress',
    'streetAddress': 'Tsar Ivan Asen II 14, fl. 1, ap. 1',
    'addressLocality': 'Sofia',
    'postalCode': '1142',
    'addressCountry': 'BG',
  },
  'sameAs': [
    'https://helixinsight.bio',
  ],
  'knowsAbout': [
    'Clinical genomics',
    'Variant interpretation',
    'ACMG classification',
    'Bioinformatics',
    'AI in healthcare',
    'Phenotype matching',
    'Genomic data analysis',
  ],
  'makesOffer': {
    '@type': 'Offer',
    'itemOffered': {
      '@type': 'SoftwareApplication',
      'name': 'Helix Insight',
      'url': 'https://helixinsight.bio',
      'applicationCategory': 'HealthApplication',
      'description': 'AI-powered variant interpretation platform for clinical genetics laboratories.',
    },
  },
}

export default function HomePage() {
  return (
    <div className="h-full flex flex-col">
      <JsonLd data={organizationData} />
      <Header />
      <main className="flex-1 overflow-y-auto">
        <HeroSection />
        <MissionSection />
        <ProductSection />
        <ContactCTASection />
      <Footer />
      </main>
    </div>
  )
}
