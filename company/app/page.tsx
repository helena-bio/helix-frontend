import { Header, Footer, HeroSection, MissionSection, ProductSection, TeamSection, ContactCTASection } from '@/components'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <MissionSection />
        <ProductSection />
        <TeamSection />
        <ContactCTASection />
      </main>
      <Footer />
    </div>
  )
}
