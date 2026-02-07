/**
 * Clinical Tier System
 *
 * Centralized tier definitions matching backend format.
 *
 * 5-tier phenotype-aware system:
 * - Tier 1: P/LP with phenotype match (confirmed relevant)
 * - Tier 2: VUS with strong evidence
 * - IF: Incidental Finding - P/LP without phenotype match (secondary finding)
 * - Tier 3: Uncertain
 * - Tier 4: Unlikely
 */

export enum ClinicalTier {
  TIER_1 = 'Tier 1 - Actionable',
  TIER_2 = 'Tier 2 - Potentially Actionable',
  TIER_IF = 'IF - Incidental Finding',
  TIER_3 = 'Tier 3 - Uncertain',
  TIER_4 = 'Tier 4 - Unlikely',
}

// Display labels for UI
export const TIER_LABELS: Record<ClinicalTier, string> = {
  [ClinicalTier.TIER_1]: 'Tier 1',
  [ClinicalTier.TIER_2]: 'Tier 2',
  [ClinicalTier.TIER_IF]: 'IF',
  [ClinicalTier.TIER_3]: 'Tier 3',
  [ClinicalTier.TIER_4]: 'Tier 4',
}

// Short labels for badges
export const TIER_BADGES: Record<ClinicalTier, string> = {
  [ClinicalTier.TIER_1]: 'T1',
  [ClinicalTier.TIER_2]: 'T2',
  [ClinicalTier.TIER_IF]: 'IF',
  [ClinicalTier.TIER_3]: 'T3',
  [ClinicalTier.TIER_4]: 'T4',
}

// Helper functions to check tier
export function isTier1(tier: string): boolean {
  return tier === ClinicalTier.TIER_1
}

export function isTier2(tier: string): boolean {
  return tier === ClinicalTier.TIER_2
}

export function isTierIF(tier: string): boolean {
  return tier === ClinicalTier.TIER_IF || tier.startsWith('IF')
}

export function isTier1or2(tier: string): boolean {
  return tier === ClinicalTier.TIER_1 || tier === ClinicalTier.TIER_2
}

// Parse tier number from full string
export function getTierNumber(tier: string): number {
  if (tier.startsWith('Tier 1')) return 1
  if (tier.startsWith('Tier 2')) return 2
  if (tier.startsWith('IF')) return 5
  if (tier.startsWith('Tier 3')) return 3
  if (tier.startsWith('Tier 4')) return 4
  return 0
}
