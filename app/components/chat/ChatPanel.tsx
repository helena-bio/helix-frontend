"use client"

/**
 * ChatPanel - AI Assistant Chat Interface
 * Shows toggle button when sidebar is hidden
 */

import { useState, useRef, useEffect } from 'react'
import { Send, Square, Sparkles, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnalysis } from '@/contexts/AnalysisContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { currentSessionId, selectedModule, isSidebarOpen, toggleSidebar } = useAnalysis()

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Welcome message when chat opens
  useEffect(() => {
    if (messages.length === 0 && currentSessionId) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI assistant for variant analysis. I can help you understand the results, filter variants, and provide clinical insights. What would you like to know?",
        timestamp: new Date(),
      }])
    }
  }, [currentSessionId])

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsSending(true)

    // TODO: Replace with actual API call
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about: "${userMessage.content}". This is a placeholder response. The actual AI integration will be implemented next.`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsSending(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with toggle button when sidebar is hidden */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <p className="text-sm text-muted-foreground truncate">
              {selectedModule === 'vus'
                ? 'VUS Prioritization Assistant'
                : 'Variant Analysis Assistant'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6 max-w-2xl">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? '' : 'w-full'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-primary/20'
                  }`}
                >
                  <p className="text-base leading-relaxed whitespace-pre-line">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="px-4 py-3">
                <p className="text-base text-muted-foreground">Thinking...</p>
              </div>
            </div>
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
            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-base"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
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
