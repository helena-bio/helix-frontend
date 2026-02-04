/**
 * Literature Mining Service API Client
 *
 * Session-based clinical literature search with streaming support.
 * Follows phenotype matching pattern: session-based computation + streaming results.
 */
import type {
  ClinicalSearchRequest,
  ClinicalSearchResponse,
  LiteratureHPOTerm,
  LiteratureVariant,
  Publication,
} from '@/types/literature.types'

const LITERATURE_API_URL = process.env.NEXT_PUBLIC_LITERATURE_API_URL || 'http://localhost:9004'
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:9007'

/**
 * Search clinical literature for a session.
 * Triggers backend computation and saves results to DuckDB + exports to NDJSON.gz.
 * Session ID is path parameter, not in body.
 */
export async function searchClinicalLiterature(
  sessionId: string,
  request: ClinicalSearchRequest
): Promise<ClinicalSearchResponse> {
  const url = `${LITERATURE_API_URL}/api/v1/sessions/${sessionId}/search`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patient_hpo_terms: request.patient_hpo_terms,
      genes: request.genes,
      variants: request.variants || [],
      limit: request.limit || 50,
      min_year: request.min_year,
      include_evidence_details: request.include_evidence_details ?? true,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `Literature search failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Get publication details by PMID
 */
export async function getPublication(pmid: string): Promise<Publication> {
  const url = `${AI_SERVICE_URL}/api/v1/literature/publication/${pmid}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `Failed to get publication: ${response.status}`)
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
