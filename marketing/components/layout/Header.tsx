"use client"
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useDemoModal, useLoginModal } from '@/contexts'

const platformLinks = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/for-geneticists', label: 'For Geneticists' },
]

export function Header() {
  const { openModal } = useDemoModal()
  const { openModal: openLoginModal } = useLoginModal()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isPlatformOpen, setIsPlatformOpen] = useState(false)
  const [isMobilePlatformOpen, setIsMobilePlatformOpen] = useState(false)
  const platformRef = useRef<HTMLDivElement>(null)

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    setIsMobilePlatformOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (platformRef.current && !platformRef.current.contains(event.target as Node)) {
        setIsPlatformOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card">
      <div className="h-full flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 pl-6">
          <Image
            src="/images/logos/logo_bulb.svg"
            alt=""
            width={32}
            height={40}
            className="h-11 w-auto"
            priority
          />
          <Image
            src="/images/logos/logo_helix.svg"
            alt="Helix Insight"
            width={160}
            height={48}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex flex-1 items-center justify-end gap-8 mr-6">
          {/* Platform dropdown */}
          <div ref={platformRef} className="relative">
            <button
              onClick={() => setIsPlatformOpen(!isPlatformOpen)}
              className="flex items-center gap-1 text-base text-foreground hover:text-primary transition-colors"
            >
              Platform
              <ChevronDown className={`w-4 h-4 transition-transform ${isPlatformOpen ? 'rotate-180' : ''}`} />
            </button>
            {isPlatformOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                {platformLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 text-base text-foreground hover:text-primary hover:bg-muted/50 transition-colors"
                    onClick={() => setIsPlatformOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
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
            {/* Mobile platform section */}
            <button
              onClick={() => setIsMobilePlatformOpen(!isMobilePlatformOpen)}
              className="flex items-center gap-1 text-base text-foreground hover:text-primary transition-colors py-2"
            >
              Platform
              <ChevronDown className={`w-4 h-4 transition-transform ${isMobilePlatformOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMobilePlatformOpen && (
              <div className="flex flex-col pl-4 space-y-3">
                {platformLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-base text-muted-foreground hover:text-primary transition-colors py-1"
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
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
