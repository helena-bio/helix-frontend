"use client"

/**
 * Screening Report Mutation Hook
 *
 * Two-phase flow:
 * 1. POST /screening-report/generate -- AI generates report, saves .md to disk
 * 2. GET  /screening-report/{session_id} -- Read saved report content
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { useSession } from '@/contexts/SessionContext'
import { useAuth } from '@/contexts/AuthContext'

const AI_API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:9007'

export interface ScreeningReportMetadata {
  status: string
  session_id: string
  content_length: number
  tier1_count: number
  tier2_count: number
  genes_reported: number
  has_panel_data: boolean
}

export interface ScreeningReportContent {
  session_id: string
  content: string
  content_length: number
}

/**
 * Generate screening findings report (saves to disk on backend).
 * Returns metadata about the generated report.
 */
export function useGenerateScreeningReport() {
  const { currentSessionId } = useSession()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (sessionId?: string): Promise<ScreeningReportMetadata> => {
      const id = sessionId || currentSessionId
      if (!id) {
        throw new Error('Session ID is required')
      }

      const response = await fetch(`${AI_API_URL}/api/v1/analysis/screening-report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: id, language: (user as any)?.preferred_language || 'en' }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || `Screening report failed: ${response.statusText}`)
      }

      return response.json()
    },
  })
}

/**
 * Fetch saved screening report content from disk.
 * Returns null if no report exists yet (404).
 */
async function fetchScreeningReport(sessionId: string): Promise<ScreeningReportContent | null> {
  const response = await fetch(`${AI_API_URL}/api/v1/analysis/screening-report/${sessionId}`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch screening report: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Query hook for fetching existing screening report.
 * Polls every 3s while report does not exist yet.
 * Stops polling automatically once report is found.
 */
export function useScreeningReport(sessionId: string | null) {
  return useQuery({
    queryKey: ['screening-report', sessionId],
    queryFn: () => fetchScreeningReport(sessionId!),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      if (query.state.data !== null && query.state.data !== undefined) {
        return false
      }
      return 3000
    },
  })
}
