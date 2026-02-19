import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['tiny', 'md', 'ml'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/** Format large numbers: 2277557 → "2.28M", 121455 → "121K", 947 → "947" */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`
  if (n >= 1_000) return n.toLocaleString()
  return String(n)
}
// Rarity classification from gnomAD allele frequency
export function getRarityBadge(af: number | null | undefined): { label: string; color: string } {
  if (af === null || af === undefined || af === 0) return { label: 'Novel', color: 'bg-purple-100 text-purple-900 border-purple-300' }
  if (af < 0.0001) return { label: 'Ultra rare', color: 'bg-red-100 text-red-900 border-red-300' }
  if (af < 0.001) return { label: 'Very rare', color: 'bg-orange-100 text-orange-900 border-orange-300' }
  if (af < 0.01) return { label: 'Rare', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' }
  if (af < 0.05) return { label: 'Low freq', color: 'bg-blue-100 text-blue-900 border-blue-300' }
  return { label: 'Common', color: 'bg-blue-100 text-blue-900 border-blue-300' }
}
