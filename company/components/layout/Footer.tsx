import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="px-6 py-3 md:py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
          <p className="text-md text-muted-foreground">
            <span className="text-base md:text-lg font-semibold text-foreground">Helena Bioinformatics</span>{' '}
            &copy; 2026. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 md:gap-x-6 gap-y-1 text-sm md:text-md">
            <Link href="/join-us" className="text-muted-foreground hover:text-foreground transition-colors py-1 md:py-2">
              Join Us
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors py-1 md:py-2">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors py-1 md:py-2">
              Terms of Service
            </Link>
            <a href="mailto:contact@helena.bio" className="text-muted-foreground hover:text-foreground transition-colors py-1 md:py-2">
              contact@helena.bio
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
