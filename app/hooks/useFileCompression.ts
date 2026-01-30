/**
 * React hook for file compression
 * 
 * Wraps file compression utilities with React state management
 */

import { useState, useCallback } from 'react'
import { 
  compressFile as compressFileUtil,
  shouldCompress as shouldCompressUtil,
  isCompressed as isCompressedUtil,
  isCompressionSupported as isCompressionSupportedUtil
} from '@/lib/utils/file-compression'

interface CompressionState {
  isCompressing: boolean
  progress: number
  error: string | null
}

export function useFileCompression() {
  const [state, setState] = useState<CompressionState>({
    isCompressing: false,
    progress: 0,
    error: null
  })

  const compress = useCallback(async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<File> => {
    setState({ isCompressing: true, progress: 0, error: null })

    try {
      // Check if already compressed - FIXED: pass File object
      if (isCompressedUtil(file)) {
        setState(prev => ({ ...prev, isCompressing: false }))
        return file
      }

      // Compress file with progress tracking
      const compressedFile = await compressFileUtil(file, (progress) => {
        setState(prev => ({ ...prev, progress }))
        onProgress?.(progress) // Forward to external callback
      })

      setState({ isCompressing: false, progress: 100, error: null })
      return compressedFile

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Compression failed'
      setState({ isCompressing: false, progress: 0, error: errorMessage })
      throw error
    }
  }, [])

  const shouldCompress = useCallback((file: File): boolean => {
    return shouldCompressUtil(file)
  }, [])

  const isSupported = isCompressionSupportedUtil()

  return {
    compress,
    shouldCompress,
    isSupported,
    isCompressing: state.isCompressing,
    progress: state.progress,
    error: state.error
  }
}
