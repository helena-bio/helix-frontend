"use client"

import { useMutation } from '@tanstack/react-query'
import { useSession } from '@/contexts/SessionContext'

interface ClinicalInterpretationParams {
  sessionId?: string
  onStreamToken?: (token: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: Error) => void
}

const AI_API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:9007'

export function useClinicalInterpretation() {
  const { currentSessionId } = useSession()

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

      // Backend loads all context server-side -- send only session_id
      const response = await fetch(`${AI_API_URL}/api/v1/analysis/interpret/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
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

            const data = line.slice(6)
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
