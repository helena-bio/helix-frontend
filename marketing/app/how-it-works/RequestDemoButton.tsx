'use client'
import { useDemoModal } from '@/contexts'

export function RequestDemoButton() {
  const { openModal } = useDemoModal()
  return (
    <button
      onClick={openModal}
      className="px-6 py-3 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors"
    >
      Request a Demo
    </button>
  )
}
