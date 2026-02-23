"use client"

import Link from 'next/link'
import { Shield, Lock, Zap, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDemoModal } from '@/contexts'

const trustBadges = [
  { icon: Shield, text: 'GDPR Compliant' },
  { icon: Lock, text: 'HIPAA Ready' },
  { icon: Zap, text: 'No Credit Card Required' },
]

const useCases = [
  { href: '/use-cases/rare-disease', label: 'Rare Disease' },
  { href: '/use-cases/newborn-screening', label: 'Newborn Screening' },
  { href: '/use-cases/carrier-screening', label: 'Carrier Screening' },
]

export function FinalCTASection() {
  const { openModal } = useDemoModal()
  const router = useRouter()

  const handleContactClick = () => {
    router.push("/contact")
  }

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-primary">
              Ready to Transform Your Variant Analysis?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join laboratories worldwide reducing analysis time from days to minutes with AI-powered genomic interpretation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={openModal}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors shadow-md w-full sm:w-auto"
            >
              Request a Demo
            </button>
            <button
              onClick={handleContactClick}
              className="px-8 py-3 bg-card border-2 border-border text-foreground rounded-lg text-lg font-medium hover:bg-muted transition-colors w-full sm:w-auto"
            >
              Contact
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            {trustBadges.map((badge) => {
              const Icon = badge.icon
              return (
                <div key={badge.text} className="flex items-center gap-2 text-md text-muted-foreground">
                  <Icon className="w-4 h-4" />
                  <span>{badge.text}</span>
                </div>
              )
            })}
          </div>

          {/* Use case links */}
          <div className="pt-4 border-t border-border">
            <p className="text-md text-muted-foreground mb-3">Explore by clinical application:</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {useCases.map((uc) => (
                <Link
                  key={uc.href}
                  href={uc.href}
                  className="inline-flex items-center gap-1 text-md text-primary hover:underline"
                >
                  {uc.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
