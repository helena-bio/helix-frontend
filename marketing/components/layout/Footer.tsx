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

const companyLinks = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/docs/faq', label: 'FAQ' },
  { href: '/docs/changelog', label: 'Changelog' },
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
      <div className="px-6 py-6 relative">
        {/* Columns -- centered */}
        <div className="flex justify-center">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-x-14 gap-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Platform</p>
              {platformLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-md text-muted-foreground hover:text-foreground transition-colors leading-relaxed">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Use Cases</p>
              {useCaseLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-md text-muted-foreground hover:text-foreground transition-colors leading-relaxed">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Resources</p>
              {resourceLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-md text-muted-foreground hover:text-foreground transition-colors leading-relaxed">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Company</p>
              {companyLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-md text-muted-foreground hover:text-foreground transition-colors leading-relaxed">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Legal</p>
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-md text-muted-foreground hover:text-foreground transition-colors leading-relaxed">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Helena -- absolute bottom-left */}
        <p className="hidden md:block absolute bottom-6 left-6 text-md text-muted-foreground">
          <a href="https://helena.bio" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">Helena Bioinformatics</a>
          {' '}&copy; 2026
        </p>

        {/* Mobile only copyright */}
        <p className="md:hidden text-md text-muted-foreground mt-4">
          <a href="https://helena.bio" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">Helena Bioinformatics</a>
          {' '}&copy; 2026
        </p>
      </div>
    </footer>
  )
}
