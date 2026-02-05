import { Header, Footer, VideoHero } from '@/components'

export default function MarketingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <VideoHero />
      </main>
      
      <Footer />
    </div>
  )
}
