"use client"

/**
 * ReviewBoardContext - Manages starred variant state per session.
 *
 * Loads starred items from API on session change.
 * Provides isStarred/toggleStar for star buttons across all views.
 * Owner-only mutations (API returns 403 for non-owners).
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { listReviewBoard, starVariant, unstarVariant, listNotes, deleteNote } from '@/lib/api/variant-analysis'
import type { ReviewBoardItem } from '@/types/variant.types'
import { useSession } from './SessionContext'

interface ReviewBoardContextType {
  /** All starred items for the current session */
  items: ReviewBoardItem[]
  /** Number of starred variants */
  count: number
  /** Whether data is loading */
  isLoading: boolean
  /** Check if a variant is starred */
  isStarred: (variantIdx: number) => boolean
  /** Toggle star state. Returns true if now starred, false if unstarred. */
  toggleStar: (variantIdx: number) => Promise<boolean>
  /** Reload from API */
  refresh: () => Promise<void>
  /** Last error message (cleared on next action) */
  errorMessage: string | null
}

const ReviewBoardContext = createContext<ReviewBoardContextType | undefined>(undefined)

interface ReviewBoardProviderProps {
  children: ReactNode
}

export function ReviewBoardProvider({ children }: ReviewBoardProviderProps) {
  const { currentSessionId } = useSession()
  const [items, setItems] = useState<ReviewBoardItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Set of starred variant_idx for O(1) lookup
  const [starredSet, setStarredSet] = useState<Set<number>>(new Set())

  const loadItems = useCallback(async () => {
    if (!currentSessionId) {
      setItems([])
      setStarredSet(new Set())
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await listReviewBoard(currentSessionId)
      setItems(response.items)
      setStarredSet(new Set(response.items.map((i) => i.variant_idx)))
    } catch (err) {
      console.error('Failed to load review board:', err)
      setErrorMessage('Failed to load review board')
    } finally {
      setIsLoading(false)
    }
  }, [currentSessionId])

  // Reload when session changes
  useEffect(() => {
    loadItems()
  }, [loadItems])

  const isStarred = useCallback(
    (variantIdx: number): boolean => starredSet.has(variantIdx),
    [starredSet]
  )

  const toggleStar = useCallback(
    async (variantIdx: number): Promise<boolean> => {
      if (!currentSessionId) return false
      setErrorMessage(null)

      const wasStarred = starredSet.has(variantIdx)

      try {
        if (wasStarred) {
          // Optimistic update
          setStarredSet((prev) => {
            const next = new Set(prev)
            next.delete(variantIdx)
            return next
          })
          setItems((prev) => prev.filter((i) => i.variant_idx !== variantIdx))

          await unstarVariant(currentSessionId, variantIdx)

          // Delete all notes for this variant on unstar
          try {
            const { notes } = await listNotes(currentSessionId, variantIdx)
            await Promise.all(notes.map((n) => deleteNote(currentSessionId, n.id)))
          } catch (noteErr) {
            console.error("Failed to delete notes on unstar:", noteErr)
          }
          return false
        } else {
          // Optimistic update
          setStarredSet((prev) => new Set(prev).add(variantIdx))

          const newItem = await starVariant(currentSessionId, variantIdx)
          setItems((prev) => [...prev, newItem])
          return true
        }
      } catch (err: any) {
        // Revert optimistic update
        if (wasStarred) {
          setStarredSet((prev) => new Set(prev).add(variantIdx))
          await loadItems()
        } else {
          setStarredSet((prev) => {
            const next = new Set(prev)
            next.delete(variantIdx)
            return next
          })
        }

        if (err?.status === 403 || err?.message?.includes('403')) {
          setErrorMessage('Only the case owner can modify the review board')
        } else if (err?.status === 409) {
          // Already starred, sync state
          await loadItems()
          return true
        } else {
          setErrorMessage('Failed to update review board')
        }
        return wasStarred
      }
    },
    [currentSessionId, starredSet, loadItems]
  )

  const value: ReviewBoardContextType = {
    items,
    count: items.length,
    isLoading,
    isStarred,
    toggleStar,
    refresh: loadItems,
    errorMessage,
  }

  return (
    <ReviewBoardContext.Provider value={value}>
      {children}
    </ReviewBoardContext.Provider>
  )
}

export function useReviewBoard(): ReviewBoardContextType {
  const context = useContext(ReviewBoardContext)
  if (!context) {
    throw new Error('useReviewBoard must be used within ReviewBoardProvider')
  }
  return context
}
