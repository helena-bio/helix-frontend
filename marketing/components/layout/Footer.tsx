import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 Helena Bioinformatics. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/dpa" className="text-muted-foreground hover:text-foreground transition-colors">
              DPA
            </Link>
            <Link href="/dpia" className="text-muted-foreground hover:text-foreground transition-colors">
              DPIA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
