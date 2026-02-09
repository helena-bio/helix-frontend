import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-md text-muted-foreground">
            <span className="text-lg font-semibold text-foreground">Helena Bioinformatics</span>{' '}
            &copy; 2026. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-md">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors py-2">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors py-2">
              Terms of Service
            </Link>
            <a href="mailto:contact@helena.bio" className="text-muted-foreground hover:text-foreground transition-colors py-2">
              contact@helena.bio
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
