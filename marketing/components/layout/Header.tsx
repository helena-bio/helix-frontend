"use client"
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { useDemoModal, useLoginModal } from '@/contexts'

export function Header() {
  const { openModal } = useDemoModal()
  const { openModal: openLoginModal } = useLoginModal()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card">
      <div className="h-full flex items-center gap-6 overflow-hidden">
        {/* Logo */}
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

        {/* Desktop navigation */}
        <nav className="hidden md:flex flex-1 items-center justify-end gap-8 mr-6">
          <Link href="/about" className="text-base text-foreground hover:text-primary transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-base text-foreground hover:text-primary transition-colors">
            Contact
          </Link>
          <button
            onClick={openLoginModal}
            className="text-base text-foreground hover:text-primary transition-colors"
          >
            Partner Login
          </button>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors"
          >
            Request Demo
          </button>
        </nav>

        {/* Mobile hamburger button */}
        <div className="flex md:hidden flex-1 justify-end mr-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-foreground hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border shadow-lg">
          <nav className="flex flex-col px-6 py-4 space-y-4">
            <Link
              href="/about"
              className="text-base text-foreground hover:text-primary transition-colors py-2"
              onClick={closeMobileMenu}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-base text-foreground hover:text-primary transition-colors py-2"
              onClick={closeMobileMenu}
            >
              Contact
            </Link>
            <button
              onClick={() => { closeMobileMenu(); openModal() }}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors text-center"
            >
              Request Demo
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
