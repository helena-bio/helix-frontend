/**
 * Literature Mining Service API Client
 *
 * Functions for clinical literature search from Literature Mining Service.
 * Endpoint: POST /api/v1/clinical/search
 */

import type {
  ClinicalSearchRequest,
  ClinicalSearchResponse,
  LiteratureHPOTerm,
  LiteratureVariant,
} from '@/types/literature.types'

const LITERATURE_API_URL = process.env.NEXT_PUBLIC_LITERATURE_API_URL || 'http://localhost:9004'

/**
 * Search clinical literature for genes and phenotypes
 */
export async function searchClinicalLiterature(
  request: ClinicalSearchRequest
): Promise<ClinicalSearchResponse> {
  const url = `${LITERATURE_API_URL}/api/v1/clinical/search`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patient_hpo_terms: request.patient_hpo_terms,
      genes: request.genes,
      variants: request.variants || [],
      limit: request.limit || 20,
      min_year: request.min_year,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `Literature search failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Build search request from variant analysis data
 */
export function buildLiteratureSearchRequest(
  genes: string[],
  hpoTerms: Array<{ hpo_id: string; name: string }>,
  variants?: Array<{ gene_symbol: string; hgvs_protein?: string; hgvs_cdna?: string }>
): ClinicalSearchRequest {
  const patient_hpo_terms: LiteratureHPOTerm[] = hpoTerms.map(t => ({
    id: t.hpo_id,
    name: t.name,
  }))

  const literatureVariants: LiteratureVariant[] | undefined = variants?.map(v => ({
    gene: v.gene_symbol,
    hgvs_protein: v.hgvs_protein,
    hgvs_cdna: v.hgvs_cdna,
  }))

  return {
    patient_hpo_terms,
    genes,
    variants: literatureVariants,
    limit: 50,
  }
}

/**
 * Get PubMed URL for a publication
 */
export function getPubMedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
}

/**
 * Get PMC full text URL
 */
export function getPMCUrl(pmcId: string | null): string | null {
  if (!pmcId) return null
  return `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/`
}

/**
 * Get DOI URL
 */
export function getDOIUrl(doi: string | null): string | null {
  if (!doi) return null
  return `https://doi.org/${doi}`
}

/**
 * Format authors for display
 */
export function formatAuthors(authors: string | null, maxDisplay: number = 3): string {
  if (!authors) return 'Unknown authors'

  const authorList = authors.split('|')
  if (authorList.length <= maxDisplay) {
    return authorList.join(', ')
  }

  return `${authorList.slice(0, maxDisplay).join(', ')} et al.`
}
