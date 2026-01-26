/**
 * Clinical Interpretation Hook
 * Generates AI-powered clinical interpretation with streaming
 */
import { useMutation } from '@tanstack/react-query'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { usePhenotypeResults } from '@/contexts/PhenotypeResultsContext'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import { useLiteratureResults } from '@/contexts/LiteratureResultsContext'

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:9007'

interface ClinicalInterpretationParams {
  sessionId: string
  onStreamToken?: (token: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: Error) => void
}

export function useClinicalInterpretation() {
  const { getCompleteProfile } = useClinicalProfileContext()
  const phenotypeResults = usePhenotypeResults()
  const { screeningResponse } = useScreeningResults()
  const literatureResults = useLiteratureResults()

  return useMutation({
    mutationFn: async (params: ClinicalInterpretationParams) => {
      const { sessionId, onStreamToken, onComplete, onError } = params

      // Aggregate all contexts for AI
      const clinicalProfile = getCompleteProfile()
      
      // Phenotype matching context
      const matchedPhenotypeContext = phenotypeResults.aggregatedResults ? {
        total_genes: phenotypeResults.totalGenes,
        tier_1_count: phenotypeResults.tier1Count,
        tier_2_count: phenotypeResults.tier2Count,
        tier_3_count: phenotypeResults.tier3Count,
        tier_4_count: phenotypeResults.tier4Count,
        variants_analyzed: phenotypeResults.variantsAnalyzed,
        top_matched_genes: phenotypeResults.aggregatedResults.slice(0, 20).map(g => ({
          gene_symbol: g.gene_symbol,
          tier: g.best_tier,
          clinical_score: g.best_clinical_score,
          phenotype_score: g.best_phenotype_score,
          variant_count: g.variant_count,
          matched_hpo_terms: g.matched_hpo_terms,
        })),
      } : null

      // Screening results context
      const screeningResultsContext = screeningResponse ? {
        summary: {
          tier1_count: screeningResponse.summary.tier1_count,
          tier2_count: screeningResponse.summary.tier2_count,
          tier3_count: screeningResponse.summary.tier3_count,
          tier4_count: screeningResponse.summary.tier4_count,
          total_variants: screeningResponse.summary.total_variants,
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
      } : null

      // Literature context (summary only to save tokens)
      const literatureContext = literatureResults.results.length > 0 ? {
        total_publications: literatureResults.totalResults,
        top_genes: literatureResults.groupedByGene.slice(0, 10).map(g => ({
          gene_symbol: g.gene,
          publication_count: g.publications.length,
          strong_evidence: g.strongCount,
          moderate_evidence: g.moderateCount,
          combined_score: g.combinedScore,
        })),
      } : null

      console.log('='.repeat(80))
      console.log('CLINICAL INTERPRETATION - Sending to AI')
      console.log('='.repeat(80))
      console.log('Clinical Profile:', clinicalProfile ? 'Present' : 'Missing')
      console.log('Phenotype Context:', matchedPhenotypeContext ? `${matchedPhenotypeContext.total_genes} genes` : 'Missing')
      console.log('Screening Context:', screeningResultsContext ? `${screeningResultsContext.summary.total_variants} variants` : 'Missing')
      console.log('Literature Context:', literatureContext ? `${literatureContext.total_publications} publications` : 'Missing')
      console.log('='.repeat(80))

      // Call AI service with SSE streaming
      const url = `${AI_SERVICE_URL}/api/v1/analysis/interpret/stream`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          clinical_profile: clinicalProfile,
          matched_phenotype_context: matchedPhenotypeContext,
          screening_results_context: screeningResultsContext,
          literature_context: literatureContext,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }))
        throw new Error(error.detail || `Interpretation failed: ${response.status}`)
      }

      // Stream response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              onComplete?.(fullText)
              return fullText
            }

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === 'token') {
                fullText += parsed.content
                onStreamToken?.(parsed.content)
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      onComplete?.(fullText)
      return fullText
    },
  })
}
