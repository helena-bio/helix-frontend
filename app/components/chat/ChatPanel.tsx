"use client"

import { useState, useRef, useEffect, memo } from 'react'
import { Send, Square, Sparkles, Database, BookOpen, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/contexts/SessionContext'
import { useClinicalProfileContext } from '@/contexts/ClinicalProfileContext'
import { usePhenotypeResults } from '@/contexts/PhenotypeResultsContext'
import { useScreeningResults } from '@/contexts/ScreeningResultsContext'
import { useLiteratureResults } from '@/contexts/LiteratureResultsContext'
import { useClinicalInterpretation as useClinicalInterpretationContext } from '@/contexts/ClinicalInterpretationContext'
import { useVariantStatistics } from '@/hooks/queries'
import { useAIChatStream } from '@/hooks/mutations/use-ai-chat'
import { useClinicalInterpretation } from '@/hooks/mutations/use-clinical-interpretation'
import { QueryVisualization } from './QueryVisualization'
import { MarkdownMessage } from './MarkdownMessage'
import type { Message } from '@/types/ai.types'
import type { QueryResultEvent, LiteratureResultEvent } from '@/lib/api/ai'

// ============================================================================
// MESSAGE COMPONENTS
// ============================================================================

interface MessageBubbleProps {
  message: Message
  onPublicationClick?: (pmid: string) => void
}

const MessageBubble = memo(function MessageBubble({ message, onPublicationClick }: MessageBubbleProps) {
  // Skip empty text messages (continuation placeholders)
  if (message.type === 'text' && !message.content && !message.isStreaming) {
    return null
  }

  if (message.type === 'text' && (message.content || message.isStreaming)) {
    return (
      <div
        className={`rounded-2xl px-4 py-3 ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-primary/20'
        }`}
      >
        <MarkdownMessage
          content={message.content}
          isUser={message.role === 'user'}
        />
      </div>
    )
  }

  if (message.type === 'query_result' && message.queryData) {
    return (
      <div className="p-4 bg-card border border-border rounded-lg">
        <details className="mb-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            View SQL Query
          </summary>
          <div className="mt-2 p-3 bg-muted rounded overflow-x-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              <code>{message.queryData.sql}</code>
            </pre>
          </div>
        </details>

        {message.queryData.visualization && (
          <QueryVisualization
            data={message.queryData.results}
            config={message.queryData.visualization}
          />
        )}

        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <span>{message.queryData.rows_returned} rows</span>
          <span>-</span>
          <span>{message.queryData.execution_time_ms}ms</span>
        </div>
      </div>
    )
  }

  // Literature search results
  if (message.type === 'literature_result' && message.literatureData) {
    const publications = message.literatureData.results || []

    return (
      <div className="p-4 bg-card border border-border rounded-lg">
        <details className="mb-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            View SQL Query
          </summary>
          <div className="mt-2 p-3 bg-muted rounded overflow-x-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              <code>{message.literatureData.sql}</code>
            </pre>
          </div>
        </details>

        {/* Publications List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-base font-medium text-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Publications ({publications.length})</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {publications.map((pub: any, idx: number) => (
              <div
                key={pub.pmid || idx}
                className="p-3 bg-muted/50 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/70 transition-colors cursor-pointer"
                onClick={() => pub.pmid && onPublicationClick?.(pub.pmid)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-foreground line-clamp-2">
                      {pub.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      {pub.journal && <span className="truncate max-w-[200px]">{pub.journal}</span>}
                      {pub.publication_date && (
                        <>
                          <span>-</span>
                          <span>{pub.publication_date}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {pub.pmid && (
                    <span className="flex items-center gap-1 text-sm text-primary shrink-0">
                      <span>PMID:{pub.pmid}</span>
                      <ExternalLink className="h-3 w-4" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <span>{message.literatureData.rows_returned} publications</span>
          <span>-</span>
          <span>{message.literatureData.execution_time_ms}ms</span>
        </div>
      </div>
    )
  }

  return null
}, (prevProps, nextProps) => {
  const prev = prevProps.message
  const next = nextProps.message
  return (
    prev.id === next.id &&
    prev.content === next.content &&
    prev.isStreaming === next.isStreaming &&
    prev.type === next.type
  )
})

const ThinkingIndicator = memo(function ThinkingIndicator({
  mode = 'thinking'
}: {
  mode?: 'thinking' | 'querying' | 'literature' | 'interpreting'
}) {
  const config = {
    thinking: {
      icon: Sparkles,
      text: 'Thinking...',
    },
    querying: {
      icon: Database,
      text: 'Querying database...',
    },
    literature: {
      icon: BookOpen,
      text: 'Searching literature...',
    },
    interpreting: {
      icon: Sparkles,
      text: 'Generating clinical interpretation...',
    },
  }

  const { icon: Icon, text } = config[mode]

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0">
        <Icon className="h-4 w-4 text-primary animate-pulse" />
      </div>
      <div className="px-4 py-3">
        <p className="text-base text-muted-foreground">{text}</p>
      </div>
    </div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isQuerying, setIsQuerying] = useState(false)
  const [isSearchingLiterature, setIsSearchingLiterature] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [isInterpretationStarted, setIsInterpretationStarted] = useState(false)
  const [isGeneratingInterpretation, setIsGeneratingInterpretation] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Track current streaming message ID for multi-round support
  const currentStreamingIdRef = useRef<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    currentSessionId,
    setSelectedPublicationId,
    openDetails,
  } = useSession()

  // Get complete clinical profile
  const { getCompleteProfile } = useClinicalProfileContext()

  // Safe context access - these providers are only available in analysis mode
  const phenotypeResults = usePhenotypeResults()
  const screeningResults = useScreeningResults()
  const literatureResults = useLiteratureResults()

  // Get clinical interpretation context with setIsGenerating
  const { setInterpretation, setIsGenerating, hasInterpretation } = useClinicalInterpretationContext()

  // Get variant statistics for analysis context
  const { data: statistics } = useVariantStatistics(currentSessionId || '', undefined, {
    enabled: !!currentSessionId,
  })

  const { streamMessage } = useAIChatStream()
  const clinicalInterpretationMutation = useClinicalInterpretation()

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Smart auto-scroll: only scroll if user is at bottom
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isAtBottom])

  // Track if user is at bottom
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      
      // Consider "at bottom" if within 100px
      const atBottom = distanceFromBottom < 100
      setIsAtBottom(atBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-start clinical interpretation when ChatPanel mounts
  useEffect(() => {
    if (isInterpretationStarted || !currentSessionId) return
    if (hasInterpretation()) return // Already have interpretation

    console.log('[ChatPanel] Auto-starting clinical interpretation')
    setIsInterpretationStarted(true)
    setIsGeneratingInterpretation(true)
    setIsGenerating(true) // Track in context

    // Track streaming message ID
    const interpretationMessageId = 'interpretation-initial'
    currentStreamingIdRef.current = interpretationMessageId

    // Start clinical interpretation streaming
    clinicalInterpretationMutation.mutateAsync({
      sessionId: currentSessionId,
      onStreamToken: (token) => {
        const currentId = currentStreamingIdRef.current
        if (!currentId) return

        // Update or create streaming message
        setMessages(prev => {
          const existingMessage = prev.find(m => m.id === currentId)
          
          if (existingMessage) {
            // Update existing message
            return prev.map(msg =>
              msg.id === currentId && msg.isStreaming
                ? { ...msg, content: msg.content + token }
                : msg
            )
          } else {
            // Create streaming message with first token
            return [
              ...prev,
              {
                id: currentId,
                role: 'assistant' as const,
                content: token,
                timestamp: new Date(),
                isStreaming: true,
                type: 'text' as const,
              }
            ]
          }
        })

        // Also update context
        setInterpretation((prev) => (prev || '') + token)
      },
      onComplete: (fullText) => {
        console.log('[ChatPanel] Clinical interpretation complete')
        // Finalize streaming message
        setMessages(prev =>
          prev.map(msg =>
            msg.id === interpretationMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        )
        setInterpretation(fullText)
        setIsGeneratingInterpretation(false)
        setIsGenerating(false) // Done generating
        currentStreamingIdRef.current = null
      },
      onError: (error) => {
        console.error('[ChatPanel] Clinical interpretation failed:', error)
        setMessages(prev => {
          const existingMessage = prev.find(m => m.id === interpretationMessageId)
          
          const errorMessage: Message = {
            id: interpretationMessageId,
            role: 'assistant',
            content: `Error generating clinical interpretation: ${error.message}. You can still ask questions about the variants.`,
            timestamp: new Date(),
            isStreaming: false,
            type: 'text',
          }

          if (existingMessage) {
            return prev.map(msg => msg.id === interpretationMessageId ? errorMessage : msg)
          } else {
            return [...prev, errorMessage]
          }
        })
        setIsGeneratingInterpretation(false)
        setIsGenerating(false) // Done generating (with error)
        currentStreamingIdRef.current = null
      },
    })
  }, [currentSessionId, isInterpretationStarted, hasInterpretation, clinicalInterpretationMutation, setInterpretation, setIsGenerating])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePublicationClick = (pmid: string) => {
    setSelectedPublicationId(pmid)
    openDetails()
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isSending || isGeneratingInterpretation) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      type: 'text',
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsSending(true)

    // Track streaming message ID (will be created on first token)
    const streamingMessageId = (Date.now() + 1).toString()
    currentStreamingIdRef.current = streamingMessageId

    try {
      // Build metadata with ALL available contexts
      const metadata: Record<string, any> = {}

      // 1. Complete Clinical Profile (demographics, ethnicity, clinical context, etc.)
      const clinicalProfile = getCompleteProfile()
      metadata.clinical_profile = {
        demographics: clinicalProfile.demographics,
        ethnicity: clinicalProfile.ethnicity,
        clinical_context: clinicalProfile.clinical_context,
        phenotype: clinicalProfile.phenotype,
        reproductive: clinicalProfile.reproductive,
        sample_info: clinicalProfile.sample_info,
        consent: clinicalProfile.consent,
      }

      // 2. Matched Phenotype Results Context (from DuckDB)
      if (phenotypeResults?.aggregatedResults && phenotypeResults.aggregatedResults.length > 0) {
        metadata.matched_phenotype_context = {
          total_genes: phenotypeResults.totalGenes,
          variants_analyzed: phenotypeResults.variantsAnalyzed,
          tier_1_count: phenotypeResults.tier1Count,
          tier_2_count: phenotypeResults.tier2Count,
          incidental_findings_count: phenotypeResults.incidentalFindingsCount,
          tier_3_count: phenotypeResults.tier3Count,
          tier_4_count: phenotypeResults.tier4Count,
          top_matched_genes: phenotypeResults.aggregatedResults.slice(0, 20).map(g => ({
            gene_symbol: g.gene_symbol,
            rank: g.rank,
            clinical_score: g.best_clinical_score,
            phenotype_score: g.best_phenotype_score,
            tier: g.best_tier,
            variant_count: g.variant_count,
            matched_hpo_terms: g.matched_hpo_terms,
          })),
        }
      }

      // 3. Screening Results Context
      if (screeningResults?.screeningResponse) {
        metadata.screening_context = {
          summary: screeningResults.screeningResponse.summary,
          tier1_count: screeningResults.screeningResponse.summary.tier1_count,
          tier2_count: screeningResults.screeningResponse.summary.tier2_count,
          tier3_count: screeningResults.screeningResponse.summary.tier3_count,
          tier4_count: screeningResults.screeningResponse.summary.tier4_count,
          top_tier1_variants: screeningResults.screeningResponse.tier1_results.slice(0, 5).map(v => ({
            gene_symbol: v.gene_symbol,
            tier: v.tier,
            total_score: v.total_score,
            clinical_actionability: v.clinical_actionability,
          })),
          top_tier2_variants: screeningResults.screeningResponse.tier2_results.slice(0, 5).map(v => ({
            gene_symbol: v.gene_symbol,
            tier: v.tier,
            total_score: v.total_score,
            clinical_actionability: v.clinical_actionability,
          })),
        }
      }

      // 4. Analysis Summary Context (variant statistics)
      if (statistics) {
        metadata.analysis_summary = {
          total_variants: statistics.total_variants,
          classification_breakdown: statistics.classification_breakdown,
          impact_breakdown: statistics.impact_breakdown,
          top_genes: statistics.top_genes.slice(0, 10),
        }
      }

      await streamMessage({
        message: userMessage.content,
        conversation_id: conversationId,
        session_id: currentSessionId || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,

        onConversationStarted: (id: string) => {
          setConversationId(id)
        },

        onToken: (token: string) => {
          const currentId = currentStreamingIdRef.current
          if (!currentId) return

          setMessages(prev => {
            // Check if streaming message exists
            const existingMessage = prev.find(m => m.id === currentId)
            
            if (existingMessage) {
              // Update existing message
              return prev.map(msg =>
                msg.id === currentId && msg.isStreaming
                  ? { ...msg, content: msg.content + token }
                  : msg
              )
            } else {
              // Create streaming message with first token
              return [
                ...prev,
                {
                  id: currentId,
                  role: 'assistant' as const,
                  content: token,
                  timestamp: new Date(),
                  isStreaming: true,
                  type: 'text' as const,
                }
              ]
            }
          })
        },

        onQueryingStarted: () => {
          // Show querying indicator
          setIsQuerying(true)

          // Finalize current streaming message (text before query)
          const currentId = currentStreamingIdRef.current
          if (currentId) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === currentId && msg.isStreaming
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            )
          }
        },

        onQueryResult: (result: QueryResultEvent) => {
          // Hide querying indicator
          setIsQuerying(false)

          // Add query result message
          const queryResultMessageId = `query-${Date.now()}`
          const queryResultMessage: Message = {
            id: queryResultMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            type: 'query_result',
            queryData: {
              sql: result.sql,
              results: result.results,
              rows_returned: result.rows_returned,
              execution_time_ms: result.execution_time_ms,
              visualization: result.visualization,
            },
          }

          setMessages(prev => [...prev, queryResultMessage])
        },

        onLiteratureSearching: () => {
          // Show literature searching indicator
          setIsSearchingLiterature(true)

          // Finalize current streaming message (text before search)
          const currentId = currentStreamingIdRef.current
          if (currentId) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === currentId && msg.isStreaming
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            )
          }
        },

        onLiteratureResult: (result: LiteratureResultEvent) => {
          // Hide literature searching indicator
          setIsSearchingLiterature(false)

          // Add literature result message
          const literatureResultMessageId = `literature-${Date.now()}`
          const literatureResultMessage: Message = {
            id: literatureResultMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            type: 'literature_result',
            literatureData: {
              sql: result.sql,
              results: result.results,
              rows_returned: result.rows_returned,
              execution_time_ms: result.execution_time_ms,
              visualization: result.visualization,
            },
          }

          setMessages(prev => [...prev, literatureResultMessage])
        },

        onRoundComplete: () => {
          // Hide all indicators
          setIsQuerying(false)
          setIsSearchingLiterature(false)

          // Create new streaming message ID for next round (will create on first token)
          const newStreamingId = `continuation-${Date.now()}`
          currentStreamingIdRef.current = newStreamingId
        },

        onComplete: () => {
          // Finalize all streaming messages
          setMessages(prev =>
            prev.map(msg => ({ ...msg, isStreaming: false }))
          )
          setIsSending(false)
          setIsQuerying(false)
          setIsSearchingLiterature(false)
          currentStreamingIdRef.current = null
        },

        onError: (error: Error) => {
          console.error('[CHAT ERROR]', error)

          const currentId = currentStreamingIdRef.current
          if (currentId) {
            setMessages(prev => {
              const existingMessage = prev.find(m => m.id === currentId)
              const errorMessage: Message = {
                id: currentId,
                role: 'assistant',
                content: `Error: ${error.message}. Please try again.`,
                timestamp: new Date(),
                isStreaming: false,
                type: 'text',
              }

              if (existingMessage) {
                return prev.map(msg => msg.id === currentId ? errorMessage : msg)
              } else {
                return [...prev, errorMessage]
              }
            })
          }
          setIsSending(false)
          setIsQuerying(false)
          setIsSearchingLiterature(false)
          currentStreamingIdRef.current = null
        },
      })
    } catch (error) {
      console.error('[STREAM INIT ERROR]', error)
      setIsSending(false)
      setIsQuerying(false)
      setIsSearchingLiterature(false)
      currentStreamingIdRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  // Filter out empty messages for display
  const displayMessages = messages.filter(msg =>
    msg.type === 'query_result' || msg.type === 'literature_result' || msg.content || msg.isStreaming
  )

  // Show thinking indicator when sending but no message with content yet
  const lastMessage = displayMessages[displayMessages.length - 1]
  const shouldShowThinking = isSending && !isQuerying && !isSearchingLiterature && 
    (!lastMessage || lastMessage.role === 'user')

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <p className="text-sm text-muted-foreground truncate">
              {isGeneratingInterpretation ? 'Generating clinical interpretation...' : 'Clinical Interpretation'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4" ref={messagesContainerRef}>
        <div className="space-y-6 max-w-4xl">
          {displayMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`${message.role === 'user' ? 'max-w-[80%]' : 'w-full'}`}>
                <MessageBubble
                  message={message}
                  onPublicationClick={handlePublicationClick}
                />
              </div>
            </div>
          ))}

          {/* Generating interpretation indicator */}
          {isGeneratingInterpretation && displayMessages.length === 0 && (
            <ThinkingIndicator mode="interpreting" />
          )}

          {/* Thinking Indicator - shown when sending but no assistant message yet */}
          {shouldShowThinking && (
            <ThinkingIndicator mode="thinking" />
          )}

          {/* Querying Indicator - shown during database query */}
          {isQuerying && (
            <ThinkingIndicator mode="querying" />
          )}

          {/* Literature Searching Indicator */}
          {isSearchingLiterature && (
            <ThinkingIndicator mode="literature" />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-6 py-4 shrink-0 bg-background">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGeneratingInterpretation ? "Generating interpretation..." : "Ask about variants, genes, or phenotypes..."}
            rows={3}
            disabled={isSending || isGeneratingInterpretation}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || isGeneratingInterpretation}
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg"
          >
            {isSending ? (
              <Square className="h-4 w-4" fill="currentColor" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  )
}
