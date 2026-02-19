/**
 * Session Disk Cache - IndexedDB persistent storage for summaries.
 *
 * Summaries are small (~330KB variants, ~76KB phenotype) and don't change
 * after processing. Perfect for disk caching with TTL.
 *
 * Flow: IndexedDB hit -> instant restore (0ms) -> skip network
 * Flow: IndexedDB miss -> fetch from server -> save to IndexedDB
 *
 * Database: helix-session-cache
 * Stores: variant-summaries, phenotype-summaries, screening-summaries, clinical-profiles
 * TTL: 7 days
 * Max entries per store: 100
 */
const DB_NAME = 'helix-session-cache'
const DB_VERSION = 5
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_ENTRIES = 100
export type StoreName = 'variant-summaries' | 'phenotype-summaries' | 'screening-summaries' | 'clinical-profiles' | 'clinical-interpretations'
interface CacheEntry<T> {
  sessionId: string
  data: T
  savedAt: number
}
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('variant-summaries')) {
        db.createObjectStore('variant-summaries', { keyPath: 'sessionId' })
      }
      if (!db.objectStoreNames.contains('phenotype-summaries')) {
        db.createObjectStore('phenotype-summaries', { keyPath: 'sessionId' })
      }
      if (!db.objectStoreNames.contains('screening-summaries')) {
        db.createObjectStore('screening-summaries', { keyPath: 'sessionId' })
      }
      if (!db.objectStoreNames.contains('clinical-profiles')) {
        db.createObjectStore('clinical-profiles', { keyPath: 'sessionId' })
      }
      if (!db.objectStoreNames.contains('clinical-interpretations')) {
        db.createObjectStore('clinical-interpretations', { keyPath: 'sessionId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
export async function getCached<T>(
  store: StoreName,
  sessionId: string
): Promise<T | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readonly')
      const req = tx.objectStore(store).get(sessionId)
      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined
        if (!entry) {
          resolve(null)
          return
        }
        // TTL check
        if (Date.now() - entry.savedAt > TTL_MS) {
          deleteEntry(store, sessionId).catch(() => {})
          resolve(null)
          return
        }
        resolve(entry.data)
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}
export async function setCache<T>(
  store: StoreName,
  sessionId: string,
  data: T
): Promise<void> {
  try {
    const db = await openDB()
    const entry: CacheEntry<T> = {
      sessionId,
      data,
      savedAt: Date.now(),
    }
    const tx = db.transaction(store, 'readwrite')
    const objectStore = tx.objectStore(store)
    objectStore.put(entry)
    // Cleanup: keep max entries
    const countReq = objectStore.count()
    countReq.onsuccess = () => {
      if (countReq.result > MAX_ENTRIES) {
        const cursorReq = objectStore.openCursor()
        let deleted = 0
        const toDelete = countReq.result - MAX_ENTRIES
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result
          if (cursor && deleted < toDelete) {
            cursor.delete()
            deleted++
            cursor.continue()
          }
        }
      }
    }
  } catch {
    // Cache write failure is non-critical
  }
}
async function deleteEntry(store: StoreName, sessionId: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(sessionId)
  } catch {
    // Ignore
  }
}
