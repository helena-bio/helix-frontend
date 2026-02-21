import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="px-6 py-2">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-md text-muted-foreground">
            <a href="https://helena.bio" target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Helena Bioinformatics</a>{' '}
            &copy; 2026. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-md">
            <Link href="/methodology" className="text-muted-foreground hover:text-foreground transition-colors py-2">
              Methodology
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors py-2">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors py-2">
              Terms of Service
            </Link>
            <Link href="/dpa" className="text-muted-foreground hover:text-foreground transition-colors py-2">
              DPA
            </Link>
            <Link href="/dpia" className="text-muted-foreground hover:text-foreground transition-colors py-2">
              DPIA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
