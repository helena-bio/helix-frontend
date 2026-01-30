"use client"

/**
 * ScreeningResultsContext - Store and provide screening analysis results
 *
 * NEW: Streaming support for progressive loading
 * - loadScreeningResults() streams from /sessions/{id}/screening/stream
 * - Progressive loading with progress tracking
 * - Auto-cleanup when session changes or becomes null
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { ScreeningResponse } from '@/lib/api/screening'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.helixinsight.bio'

type LoadingStatus = 'idle' | 'loading' | 'success' | 'error'

interface ScreeningResultsContextValue {
  screeningResponse: ScreeningResponse | null
  status: LoadingStatus
  loadProgress: number
  error: Error | null
  setScreeningResponse: (response: ScreeningResponse) => void
  loadScreeningResults: (sessionId: string) => Promise<void>
  clearScreeningResponse: () => void
}

const ScreeningResultsContext = createContext<ScreeningResultsContextValue | undefined>(undefined)

interface ScreeningResultsProviderProps {
  sessionId: string | null
  children: ReactNode
}

export function ScreeningResultsProvider({ sessionId, children }: ScreeningResultsProviderProps) {
  const [screeningResponse, setScreeningResponseState] = useState<ScreeningResponse | null>(null)
  const [status, setStatus] = useState<LoadingStatus>('idle')
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  // Auto-cleanup when session changes or becomes null
  useEffect(() => {
    if (sessionId === null) {
      console.log('[ScreeningResultsContext] Session cleared - resetting screening results')
      setScreeningResponseState(null)
      setStatus('idle')
      setLoadProgress(0)
      setError(null)
    }
  }, [sessionId])

  const setScreeningResponse = useCallback((response: ScreeningResponse) => {
    console.log('='.repeat(80))
    console.log('SCREENING RESULTS SAVED TO CONTEXT')
    console.log('='.repeat(80))
    console.log('Summary:', JSON.stringify(response.summary, null, 2))
    console.log('Tier 1 results:', response.tier1_results.length)
    console.log('Tier 2 results:', response.tier2_results.length)
    console.log('Tier 3 results:', response.tier3_results.length)
    console.log('Tier 4 results:', response.tier4_results.length)
    console.log('='.repeat(80))
    setScreeningResponseState(response)
  }, [])

  // Stream screening results from backend (with Redis cache optimization)
  const loadScreeningResults = useCallback(async (sessionId: string) => {
    setStatus('loading')
    setLoadProgress(0)
    setError(null)
    setScreeningResponseState(null)

    try {
      console.log('[ScreeningResultsContext] Starting screening results stream...')

      const response = await fetch(
        `${API_BASE_URL}/screening/sessions/${sessionId}/screening/stream`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      console.log('[ScreeningResultsContext] Response headers:', {
        contentType: response.headers.get('content-type'),
        contentEncoding: response.headers.get('content-encoding'),
      })

      // Browser automatically decompresses gzip based on Content-Encoding header
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader()

      let buffer = ''
      let summary: ScreeningResponse['summary'] | null = null
      const tier1Results: ScreeningResponse['tier1_results'] = []
      const tier2Results: ScreeningResponse['tier2_results'] = []
      const tier3Results: ScreeningResponse['tier3_results'] = []
      const tier4Results: ScreeningResponse['tier4_results'] = []
      let totalExpected = 0
      let totalLoaded = 0
      let cacheHit = false

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += value
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const parsed = JSON.parse(line)

            if (parsed.type === 'metadata') {
              summary = parsed.summary
              cacheHit = parsed.cache_hit || false
              totalExpected = summary.tier1_count + summary.tier2_count + summary.tier3_count + summary.tier4_count

              console.log('[ScreeningResultsContext] Metadata received:', {
                total: totalExpected,
                cacheHit,
                tier1: summary.tier1_count,
                tier2: summary.tier2_count,
                tier3: summary.tier3_count,
                tier4: summary.tier4_count,
              })
            } else if (parsed.type === 'tier1') {
              tier1Results.push(parsed.data)
              totalLoaded++
              if (totalExpected > 0) {
                setLoadProgress(Math.round((totalLoaded / totalExpected) * 100))
              }
            } else if (parsed.type === 'tier2') {
              tier2Results.push(parsed.data)
              totalLoaded++
              if (totalExpected > 0) {
                setLoadProgress(Math.round((totalLoaded / totalExpected) * 100))
              }
            } else if (parsed.type === 'tier3') {
              tier3Results.push(parsed.data)
              totalLoaded++
              if (totalExpected > 0) {
                setLoadProgress(Math.round((totalLoaded / totalExpected) * 100))
              }
            } else if (parsed.type === 'tier4') {
              tier4Results.push(parsed.data)
              totalLoaded++
              if (totalExpected > 0) {
                setLoadProgress(Math.round((totalLoaded / totalExpected) * 100))
              }
            } else if (parsed.type === 'complete') {
              console.log('[ScreeningResultsContext] Stream complete', {
                totalLoaded,
                cacheHit: parsed.cache_hit,
              })
            }
          } catch (err) {
            console.error('[ScreeningResultsContext] Failed to parse line:', line, err)
          }
        }
      }

      if (!summary) {
        throw new Error('No summary received from stream')
      }

      const fullResponse: ScreeningResponse = {
        summary,
        tier1_results: tier1Results,
        tier2_results: tier2Results,
        tier3_results: tier3Results,
        tier4_results: tier4Results,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }

      console.log('[ScreeningResultsContext] Stream complete - loaded results:', {
        tier1: tier1Results.length,
        tier2: tier2Results.length,
        tier3: tier3Results.length,
        tier4: tier4Results.length,
        cacheHit,
      })

      setScreeningResponseState(fullResponse)
      setStatus('success')
      setLoadProgress(100)
    } catch (err) {
      console.error('[ScreeningResultsContext] Streaming failed:', err)
      setError(err as Error)
      setStatus('error')
      throw err
    }
  }, [])

  const clearScreeningResponse = useCallback(() => {
    console.log('[ScreeningResultsContext] Clearing screening response')
    setScreeningResponseState(null)
    setStatus('idle')
    setLoadProgress(0)
    setError(null)
  }, [])

  return (
    <ScreeningResultsContext.Provider
      value={{
        screeningResponse,
        status,
        loadProgress,
        error,
        setScreeningResponse,
        loadScreeningResults,
        clearScreeningResponse,
      }}
    >
      {children}
    </ScreeningResultsContext.Provider>
  )
}

export function useScreeningResults() {
  const context = useContext(ScreeningResultsContext)
  if (!context) {
    throw new Error('useScreeningResults must be used within ScreeningResultsProvider')
  }
  return context
}
