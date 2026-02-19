"use client"

import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react'
import { Send, Square, Sparkles, Database, BookOpen, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/contexts/SessionContext'
import { useAIChatStream } from '@/hooks/mutations/use-ai-chat'
import { QueryVisualization } from './QueryVisualization'
import { MarkdownMessage } from './MarkdownMessage'
import type { Message } from '@/types/ai.types'
import { getChatPrompt } from '@/lib/constants/chat-prompts'
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
  mode?: 'thinking' | 'querying' | 'literature'
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

  const { streamMessage } = useAIChatStream()

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
      setIsAtBottom(distanceFromBottom < 100)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePublicationClick = (pmid: string) => {
    setSelectedPublicationId(pmid)
    openDetails()
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return

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
      await streamMessage({
        message: userMessage.content,
        conversation_id: conversationId,
        session_id: currentSessionId || undefined,

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

  const isEmpty = displayMessages.length === 0 && !shouldShowThinking
  const chatPrompt = useMemo(() => getChatPrompt(), [])

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4" ref={messagesContainerRef}>
        <div className="space-y-6 max-w-4xl">
          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full gap-8 select-none px-2">
              <div className="flex flex-col items-center gap-4">
                <img src="/images/logos/logo_bulb.svg" alt="Helix" className="h-16 w-16 opacity-30" />
                <img src="/images/logos/logo_helix.svg" alt="Helix Insight" className="h-6 opacity-25" />
                <h2 className="text-2xl font-bold tracking-tight text-foreground/70">
                  {chatPrompt.title}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {[
                  "What does this variant mean clinically?",
                  "Which ACMG criteria support this classification?",
                  "Find literature on this gene",
                  "Explain the population frequency data",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputValue(suggestion)}
                    className="text-left px-3.5 py-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-md text-muted-foreground hover:text-foreground leading-snug"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

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
            placeholder="Ask about variants, genes, or phenotypes..."
            rows={3}
            disabled={isSending}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className="absolute right-2 bottom-4 h-8 w-8 rounded-lg"
          >
            {isSending ? (
              <Square className="h-4 w-4" fill="currentColor" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground text-center mt-2">
          AI can make mistakes. Please double-check responses.
        </p>
      </div>
    </div>
  )
}
