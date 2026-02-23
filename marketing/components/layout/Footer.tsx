import Link from 'next/link'

const platformLinks = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/for-geneticists', label: 'For Geneticists' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/docs', label: 'Documentation' },
]

const useCaseLinks = [
  { href: '/use-cases/rare-disease', label: 'Rare Disease' },
  { href: '/use-cases/newborn-screening', label: 'Newborn Screening' },
  { href: '/use-cases/carrier-screening', label: 'Carrier Screening' },
]

const resourceLinks = [
  { href: '/docs/classification/acmg-framework', label: 'ACMG Framework' },
  { href: '/docs/predictors/consensus-calculation', label: 'BayesDel Calibration' },
  { href: '/docs/phenotype-matching', label: 'Phenotype Matching' },
  { href: '/docs/data-and-privacy', label: 'Data and Privacy' },
]

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/dpa', label: 'DPA' },
  { href: '/dpia', label: 'DPIA' },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Platform */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Platform</p>
            <div className="flex flex-col space-y-2">
              {platformLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-md text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Use Cases */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Use Cases</p>
            <div className="flex flex-col space-y-2">
              {useCaseLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-md text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Resources</p>
            <div className="flex flex-col space-y-2">
              {resourceLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-md text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Legal</p>
            <div className="flex flex-col space-y-2">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-md text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-md text-muted-foreground">
            <a href="https://helena.bio" target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Helena Bioinformatics</a>{' '}
            &copy; 2026. All rights reserved.
          </p>
          <p className="text-md text-muted-foreground">
            EU-hosted infrastructure. Helsinki, Finland.
          </p>
        </div>
      </div>
    </footer>
  )
}
