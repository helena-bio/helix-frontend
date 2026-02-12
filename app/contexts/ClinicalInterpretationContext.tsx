"use client"

/**
 * Clinical Interpretation Context
 *
 * Manages AI-generated clinical interpretation lifecycle:
 * 1. generate(sessionId) - POST /interpret/generate (AI generates, saves .md to disk)
 * 2. loadInterpretation(sessionId) - GET /interpret/{session_id} (read saved content)
 *
 * Backend adapts interpretation depth based on available data:
 * Level 1: Variants only
 * Level 2: Variants + Screening
 * Level 3: Variants + Phenotype (+/- Literature)
 * Level 4: Full analysis (all modules)
 *
 * Cache layers:
 * Layer 1: Memory Map (instant switch between cases, max 3)
 * Layer 2: IndexedDB (survives page refresh, 7d TTL)
 * Layer 3: Backend GET /interpret/{session_id} (disk)
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react'
import { getCached, setCache } from '@/lib/cache/session-disk-cache'

const AI_API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:9007'
const MAX_CACHED_SESSIONS = 3

// ============================================================================
// Types
// ============================================================================

export type InterpretationStatus = 'idle' | 'generating' | 'loading' | 'success' | 'error'

export interface InterpretationMetadata {
  level: number
  level_label: string
  modules_used: string[]
  content_length: number
}

interface CacheEntry {
  content: string
  metadata: InterpretationMetadata
}

interface ClinicalInterpretationContextValue {
  // State
  status: InterpretationStatus
  content: string | null
  metadata: InterpretationMetadata | null
  error: Error | null

  // Derived
  hasInterpretation: boolean
  isGenerating: boolean

  // Actions
  generate: (sessionId: string) => Promise<void>
  loadInterpretation: (sessionId: string) => Promise<boolean>
  clearInterpretation: () => void
}

// ============================================================================
// Context
// ============================================================================

const ClinicalInterpretationContext = createContext<ClinicalInterpretationContextValue | undefined>(
  undefined
)

interface ProviderProps {
  sessionId: string | null
  children: React.ReactNode
}

export function ClinicalInterpretationProvider({ sessionId, children }: ProviderProps) {
  const [status, setStatus] = useState<InterpretationStatus>('idle')
  const [content, setContent] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<InterpretationMetadata | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const currentSessionId = useRef<string | null>(null)
  const sessionCache = useRef<Map<string, CacheEntry>>(new Map())

  // Refs for cache saves
  const contentRef = useRef<string | null>(null)
  const metadataRef = useRef<InterpretationMetadata | null>(null)
  useEffect(() => { contentRef.current = content }, [content])
  useEffect(() => { metadataRef.current = metadata }, [metadata])

  const saveToCache = useCallback((id: string, entry: CacheEntry) => {
    // Layer 1: Memory
    sessionCache.current.set(id, entry)
    if (sessionCache.current.size > MAX_CACHED_SESSIONS) {
      const oldest = sessionCache.current.keys().next().value
      if (oldest) sessionCache.current.delete(oldest)
    }
    // Layer 2: IndexedDB
    setCache('clinical-interpretations', id, entry).catch(() => {})
  }, [])

  const resetState = useCallback(() => {
    setContent(null)
    setMetadata(null)
    setStatus('idle')
    setError(null)
  }, [])

  // Restore from IndexedDB or backend
  const restoreInterpretation = useCallback(async (sid: string) => {
    // Layer 2: IndexedDB
    try {
      const diskCached = await getCached<CacheEntry>('clinical-interpretations', sid)
      if (diskCached) {
        console.log(`[ClinicalInterpretation] IndexedDB hit: ${sid}`)
        sessionCache.current.set(sid, diskCached)
        setContent(diskCached.content)
        setMetadata(diskCached.metadata)
        setStatus('success')
        setError(null)
        return
      }
    } catch {
      // IndexedDB unavailable, continue to backend
    }

    // Layer 3: Backend
    try {
      const response = await fetch(`${AI_API_URL}/api/v1/analysis/interpret/${sid}`)
      if (response.ok) {
        const result = await response.json()
        const meta: InterpretationMetadata = {
          level: result.level ?? 0,
          level_label: result.level_label ?? '',
          modules_used: result.modules_used ?? [],
          content_length: result.content_length ?? result.content?.length ?? 0,
        }
        const entry: CacheEntry = { content: result.content, metadata: meta }
        saveToCache(sid, entry)
        setContent(result.content)
        setMetadata(meta)
        setStatus('success')
        setError(null)
        console.log(`[ClinicalInterpretation] Restored from backend: ${sid} (${result.content_length} chars)`)
      }
    } catch {
      // No interpretation available -- stay idle
    }
  }, [saveToCache])

  // Session change: save current to cache, restore or reset
  useEffect(() => {
    const prevId = currentSessionId.current

    if (sessionId === null) {
      if (prevId && contentRef.current && metadataRef.current) {
        saveToCache(prevId, { content: contentRef.current, metadata: metadataRef.current })
      }
      currentSessionId.current = null
      resetState()
      return
    }

    if (sessionId === currentSessionId.current) return

    // Save previous
    if (prevId && contentRef.current && metadataRef.current) {
      saveToCache(prevId, { content: contentRef.current, metadata: metadataRef.current })
    }

    currentSessionId.current = sessionId

    // Layer 1: Memory cache
    const cached = sessionCache.current.get(sessionId)
    if (cached) {
      console.log(`[ClinicalInterpretation] Memory hit: ${sessionId}`)
      setContent(cached.content)
      setMetadata(cached.metadata)
      setStatus('success')
      setError(null)
      return
    }

    // Reset and try IndexedDB + backend async
    console.log(`[ClinicalInterpretation] Cache miss: ${sessionId}`)
    resetState()
    restoreInterpretation(sessionId)
  }, [sessionId, saveToCache, resetState, restoreInterpretation])

  // Generate interpretation (POST - AI generates + saves to disk)
  const generate = useCallback(async (sid: string) => {
    console.log(`[ClinicalInterpretation] Generating for session: ${sid}`)
    setStatus('generating')
    setError(null)
    setContent(null)
    setMetadata(null)

    try {
      const response = await fetch(`${AI_API_URL}/api/v1/analysis/interpret/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || `Generation failed: ${response.statusText}`)
      }

      const result = await response.json()

      console.log(`[ClinicalInterpretation] Generated: Level ${result.level} (${result.level_label}), ${result.content_length} chars`)

      const meta: InterpretationMetadata = {
        level: result.level,
        level_label: result.level_label,
        modules_used: result.modules_used,
        content_length: result.content_length,
      }
      setMetadata(meta)

      // Now load the content from disk
      await loadContent(sid, meta)
    } catch (err) {
      console.error('[ClinicalInterpretation] Generation failed:', err)
      setError(err as Error)
      setStatus('error')
      throw err
    }
  }, [])

  // Load saved interpretation content (GET)
  const loadContent = async (sid: string, meta: InterpretationMetadata) => {
    setStatus('loading')

    try {
      const response = await fetch(`${AI_API_URL}/api/v1/analysis/interpret/${sid}`)

      if (!response.ok) {
        throw new Error(`Failed to load interpretation: ${response.statusText}`)
      }

      const result = await response.json()

      setContent(result.content)
      setStatus('success')

      // Cache to both layers
      saveToCache(sid, { content: result.content, metadata: meta })

      console.log(`[ClinicalInterpretation] Loaded: ${result.content_length} chars`)
    } catch (err) {
      console.error('[ClinicalInterpretation] Load failed:', err)
      setError(err as Error)
      setStatus('error')
      throw err
    }
  }

  // Try to load existing interpretation (for case restore)
  const loadInterpretation = useCallback(async (sid: string): Promise<boolean> => {
    try {
      const response = await fetch(`${AI_API_URL}/api/v1/analysis/interpret/${sid}`)

      if (response.status === 404) {
        return false
      }

      if (!response.ok) {
        return false
      }

      const result = await response.json()
      const meta: InterpretationMetadata = {
        level: result.level ?? 0,
        level_label: result.level_label ?? '',
        modules_used: result.modules_used ?? [],
        content_length: result.content_length ?? result.content?.length ?? 0,
      }

      setContent(result.content)
      setMetadata(meta)
      setStatus('success')

      // Cache to both layers
      saveToCache(sid, { content: result.content, metadata: meta })

      console.log(`[ClinicalInterpretation] Restored from disk: ${result.content_length} chars`)
      return true
    } catch {
      return false
    }
  }, [saveToCache])

  const clearInterpretation = useCallback(() => {
    console.log('[ClinicalInterpretation] Clearing')
    resetState()
  }, [resetState])

  const value = useMemo<ClinicalInterpretationContextValue>(() => ({
    status,
    content,
    metadata,
    error,
    hasInterpretation: content !== null && content.length > 0,
    isGenerating: status === 'generating' || status === 'loading',
    generate,
    loadInterpretation,
    clearInterpretation,
  }), [status, content, metadata, error, generate, loadInterpretation, clearInterpretation])

  return (
    <ClinicalInterpretationContext.Provider value={value}>
      {children}
    </ClinicalInterpretationContext.Provider>
  )
}

export function useClinicalInterpretation() {
  const context = useContext(ClinicalInterpretationContext)
  if (context === undefined) {
    throw new Error('useClinicalInterpretation must be used within ClinicalInterpretationProvider')
  }
  return context
}
