"use client"

import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'

interface MarkdownMessageProps {
  content: string
  isUser?: boolean
}

marked.setOptions({
  breaks: true,
  gfm: true,
})

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState('')

  useEffect(() => {
    const rawHtml = marked.parse(content, { async: false }) as string
    const clean = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'hr'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    })
    setSanitizedHtml(clean)
  }, [content])

  return (
    <div
      className={`text-base leading-relaxed select-text markdown-content ${
        isUser ? 'markdown-user' : 'markdown-assistant'
      }`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
