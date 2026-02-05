"use client"

import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-7xl">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/helix%20logo-W2SpmbzgUEDwJyPjRhIvWwSfESe6Aq.png"
            alt="Helix Insight"
            width={160}
            height={48}
            className="h-10 w-auto"
            priority
          />
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bulb-KpLU35CozLLzkwRErx9HXQNX4gHefR.png"
            alt=""
            width={32}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/about" className="text-base text-foreground hover:text-primary transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-base text-foreground hover:text-primary transition-colors">
            Contact
          </Link>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            Request Demo
          </button>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">EN</span>
            <span>/</span>
            <span>BG</span>
          </div>
        </nav>
      </div>
    </header>
  )
}
