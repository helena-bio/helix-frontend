'use client'

import { Streamdown } from 'streamdown'

interface MarkdownMessageProps {
  content: string
  isUser?: boolean
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  const textColor = isUser ? 'text-gray-900' : 'text-gray-800'

  return (
    <div className={`text-base leading-relaxed select-text ${textColor}`}>
      <Streamdown parseIncompleteMarkdown={true} className="prose prose-sm max-w-none">
        {content}
      </Streamdown>
    </div>
  )
}
