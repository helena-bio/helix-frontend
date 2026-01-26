"use client"

import { useMutation } from '@tanstack/react-query'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { usePhenotypeResults } from '@/contexts/PhenotypeResultsContext'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import { useLiteratureResults } from '@/contexts/LiteratureResultsContext'
import { useSession } from '@/contexts/SessionContext'

interface ClinicalInterpretationParams {
  sessionId: string
  onStreamToken?: (token: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: Error) => void
}

const AI_API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:9007'

export function useClinicalInterpretation() {
  const { currentSessionId } = useSession()
  const { getCompleteProfile } = useClinicalProfileContext()
  const { aggregatedResults, tier1Count, tier2Count, tier3Count, tier4Count, variantsAnalyzed, totalGenes } = usePhenotypeResults()
  const { screeningResponse } = useScreeningResults()
  const { groupedByGene, totalResults } = useLiteratureResults()

  return useMutation({
    mutationFn: async (params: ClinicalInterpretationParams) => {
      const {
        sessionId = currentSessionId,
        onStreamToken,
        onComplete,
        onError: onErrorCallback,
      } = params

      if (!sessionId) {
        throw new Error('Session ID is required')
      }

      // Build complete payload with all 4 contexts
      const payload = {
        session_id: sessionId,
        clinical_profile: getCompleteProfile(),
        matched_phenotype_context: aggregatedResults && aggregatedResults.length > 0 ? {
          total_genes: totalGenes,
          tier_1_count: tier1Count,
          tier_2_count: tier2Count,
          tier_3_count: tier3Count,
          tier_4_count: tier4Count,
          variants_analyzed: variantsAnalyzed,
          top_matched_genes: aggregatedResults.slice(0, 20).map(g => ({
            gene_symbol: g.gene_symbol,
            tier: g.best_tier,
            clinical_score: g.best_clinical_score,
            phenotype_score: g.best_phenotype_score,
            variant_count: g.variant_count,
            matched_hpo_terms: g.matched_hpo_terms,
          })),
        } : null,
        screening_results_context: screeningResponse ? {
          summary: {
            tier1_count: screeningResponse.summary.tier1_count,
            tier2_count: screeningResponse.summary.tier2_count,
            tier3_count: screeningResponse.summary.tier3_count,
            tier4_count: screeningResponse.summary.tier4_count,
            total_variants: screeningResponse.summary.total_variants_analyzed,
          },
          top_tier1_variants: screeningResponse.tier1_results.slice(0, 10).map(v => ({
            gene_symbol: v.gene_symbol,
            hgvs_protein: v.hgvs_protein,
            acmg_class: v.acmg_class,
            total_score: v.total_score,
            clinical_actionability: v.clinical_actionability,
          })),
          top_tier2_variants: screeningResponse.tier2_results.slice(0, 10).map(v => ({
            gene_symbol: v.gene_symbol,
            hgvs_protein: v.hgvs_protein,
            acmg_class: v.acmg_class,
            total_score: v.total_score,
            clinical_actionability: v.clinical_actionability,
          })),
        } : null,
        literature_context: groupedByGene && groupedByGene.length > 0 ? {
          total_publications: totalResults,
          top_genes: groupedByGene.slice(0, 10).map(g => ({
            gene_symbol: g.gene,
            publication_count: g.publications.length,
            strong_evidence: g.strongCount,
            moderate_evidence: g.moderateCount,
            combined_score: g.combinedScore,
          })),
        } : null,
      }

      // Call AI service with SSE streaming
      const response = await fetch(`${AI_API_URL}/api/v1/analysis/interpret/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Clinical interpretation failed: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue

            const data = line.slice(6) // Remove 'data: ' prefix
            if (data === '[DONE]') continue

            try {
              const event = JSON.parse(data)

              if (event.type === 'token' && event.content) {
                fullText += event.content
                onStreamToken?.(event.content)
              } else if (event.type === 'complete') {
                onComplete?.(fullText)
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Streaming error')
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE event:', parseError)
            }
          }
        }
      } catch (error) {
        onErrorCallback?.(error as Error)
        throw error
      }

      return fullText
    },
  })
}
