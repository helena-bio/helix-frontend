"use client"
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ExternalLink } from 'lucide-react'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header className="shrink-0 z-50 h-14 border-b border-border bg-card">
      <div className="h-full flex items-center gap-6 overflow-hidden">
        <Link href="/" className="flex items-center shrink-0 pl-6">
          <Image
            src="/images/logos/logo_helena.svg"
            alt="Helena Bioinformatics"
            width={200}
            height={48}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex flex-1 items-center justify-end gap-8 mr-6">
          <Link href="/about" className="text-base text-foreground hover:text-primary transition-colors">
            About
          </Link>
          <Link href="/partners" className="text-base text-foreground hover:text-primary transition-colors">
            Partners
          </Link>
          <Link href="/contact" className="text-base text-foreground hover:text-primary transition-colors">
            Contact
          </Link>
          <a href="https://helixinsight.bio" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors">
            Helix Insight
            <ExternalLink className="w-4 h-4" />
          </a>
        </nav>

        <div className="flex md:hidden flex-1 justify-end mr-4">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-foreground hover:text-primary transition-colors" aria-label="Toggle menu">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border shadow-lg">
          <nav className="flex flex-col px-6 py-4 space-y-4">
            <Link href="/about" className="text-base text-foreground hover:text-primary transition-colors py-2" onClick={closeMobileMenu}>About</Link>
            <Link href="/partners" className="text-base text-foreground hover:text-primary transition-colors py-2" onClick={closeMobileMenu}>Partners</Link>
            <Link href="/contact" className="text-base text-foreground hover:text-primary transition-colors py-2" onClick={closeMobileMenu}>Contact</Link>
            <a href="https://helixinsight.bio" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-3 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors text-center" onClick={closeMobileMenu}>
              Helix Insight
              <ExternalLink className="w-4 h-4" />
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
