'use client'
import { useDemoModal } from '@/contexts'

export function RequestDemoButton({ variant = 'primary' }: { variant?: 'primary' | 'outline' }) {
  const { openModal } = useDemoModal()

  if (variant === 'outline') {
    return (
      <button
        onClick={openModal}
        className="px-6 py-3 border border-border text-foreground rounded-md text-base font-medium hover:bg-muted transition-colors"
      >
        Request a Demo
      </button>
    )
  }

  return (
    <button
      onClick={openModal}
      className="px-6 py-3 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors"
    >
      Request a Demo
    </button>
  )
}
