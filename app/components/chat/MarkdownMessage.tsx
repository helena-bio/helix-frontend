"use client"

import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

interface MarkdownMessageProps {
  content: string
  isUser?: boolean
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  return (
    <div className={`prose prose-sm max-w-none select-text ${
      isUser ? 'prose-invert' : ''
    }`}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks, remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-base leading-relaxed mb-2">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-3">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-base">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted-foreground">{children}</em>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-muted border border-border text-sm font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => {
            const getTextContent = (node: any): string => {
              if (typeof node === 'string') return node
              if (Array.isArray(node)) return node.map(getTextContent).join('')
              if (node?.props?.children) return getTextContent(node.props.children)
              return ''
            }
            
            const textContent = getTextContent(children).trim()
            if (!textContent || textContent.length === 0) {
              return null
            }
            
            return (
              <pre className="p-3 rounded-lg bg-muted border border-border overflow-x-auto mb-3">
                {children}
              </pre>
            )
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-3">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-4 border-t border-border" />
          ),
          a: ({ href, children }) => (
            
              href={href}
              className="text-primary hover:text-primary/80 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
