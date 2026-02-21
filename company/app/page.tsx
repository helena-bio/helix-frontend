import { Header, Footer, HeroSection, MissionSection, ProductSection, ContactCTASection } from '@/components'

export default function HomePage() {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <HeroSection />
        <MissionSection />
        <ProductSection />
        <ContactCTASection />
      </main>
      <Footer />
    </div>
  )
}
