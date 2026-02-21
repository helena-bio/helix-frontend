import { Header, Footer, VideoHero, BenefitsSection, FeaturesSection, HowItWorksSection, DatabaseIntegrationsSection, SecurityComplianceSection, FinalCTASection } from '@/components'
export default function MarketingPage() {
  return (
    <div className="h-full flex flex-col">
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
      </main>
      <Footer />
    </div>
  )
}
