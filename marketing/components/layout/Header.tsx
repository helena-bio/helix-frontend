"use client"

import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card">
      <div className="h-full flex items-center gap-6 overflow-hidden">
        <Link href="/" className="flex items-center gap-2 shrink-0 pl-6">
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

        <nav className="flex-1 flex items-center justify-end gap-8 mr-6">
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
