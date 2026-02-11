"use client"

/**
 * Clinical Interpretation Mutation Hook
 *
 * Two-phase flow:
 * 1. POST /interpret/generate -- AI generates interpretation, saves .md to disk
 * 2. GET  /interpret/{session_id} -- Read saved interpretation content
 *
 * Backend adapts interpretation depth based on available data:
 * Level 1: Variants only
 * Level 2: Variants + Screening
 * Level 3: Variants + Phenotype (+/- Literature)
 * Level 4: Full analysis (all modules)
 */

import { useMutation } from '@tanstack/react-query'
import { useSession } from '@/contexts/SessionContext'

const AI_API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:9007'

export interface InterpretationMetadata {
  status: string
  session_id: string
  level: number
  level_label: string
  content_length: number
  modules_used: string[]
}

export interface InterpretationContent {
  session_id: string
  content: string
  content_length: number
}

/**
 * Generate clinical interpretation (saves to disk on backend).
 * Returns metadata about the generated interpretation.
 */
export function useGenerateInterpretation() {
  const { currentSessionId } = useSession()

  return useMutation({
    mutationFn: async (sessionId?: string): Promise<InterpretationMetadata> => {
      const id = sessionId || currentSessionId
      if (!id) {
        throw new Error('Session ID is required')
      }

      const response = await fetch(`${AI_API_URL}/api/v1/analysis/interpret/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: id }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || `Interpretation failed: ${response.statusText}`)
      }

      return response.json()
    },
  })
}

/**
 * Fetch saved clinical interpretation content from disk.
 * Returns null if no interpretation exists yet.
 */
export async function fetchInterpretation(sessionId: string): Promise<InterpretationContent | null> {
  const response = await fetch(`${AI_API_URL}/api/v1/analysis/interpret/${sessionId}`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch interpretation: ${response.statusText}`)
  }

  return response.json()
}
