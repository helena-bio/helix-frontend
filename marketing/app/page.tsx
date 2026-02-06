import { Header, Footer, VideoHero, BenefitsSection, FeaturesSection, HowItWorksSection, SecurityComplianceSection, FinalCTASection } from '@/components'
export default function MarketingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="flex items-center justify-center px-6 pt-20 pb-12">
          <VideoHero />
        </section>
        <BenefitsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SecurityComplianceSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  )
}
