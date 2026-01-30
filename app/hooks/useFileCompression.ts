/**
 * React hook for client-side file compression with progress tracking
 */

import { useState, useCallback } from 'react'
import { compressFile, isCompressed, estimateCompressionBenefit, isCompressionSupported } from '@/lib/utils/file-compression'

interface CompressionState {
  isCompressing: boolean
  progress: number
  error: string | null
  compressionRatio: number | null
  timeSaved: number | null
}

export function useFileCompression() {
  const [state, setState] = useState<CompressionState>({
    isCompressing: false,
    progress: 0,
    error: null,
    compressionRatio: null,
    timeSaved: null
  })

  const compress = useCallback(async (file: File): Promise<File> => {
    // Reset state
    setState({
      isCompressing: true,
      progress: 0,
      error: null,
      compressionRatio: null,
      timeSaved: null
    })

    try {
      // Check if already compressed
      if (isCompressed(file.name)) {
        setState(prev => ({ ...prev, isCompressing: false }))
        return file
      }

      // Check browser support
      if (!isCompressionSupported()) {
        setState(prev => ({ 
          ...prev, 
          isCompressing: false,
          error: 'Browser does not support compression'
        }))
        return file
      }

      // Compress file
      const result = await compressFile(file, (progress) => {
        setState(prev => ({ ...prev, progress }))
      })

      // Create new File object with .gz extension
      const compressedFile = new File(
        [result.compressedBlob],
        file.name.endsWith('.vcf') ? `${file.name}.gz` : `${file.name}.gz`,
        { type: 'application/gzip' }
      )

      setState({
        isCompressing: false,
        progress: 100,
        error: null,
        compressionRatio: result.compressionRatio,
        timeSaved: result.compressionTime
      })

      return compressedFile

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Compression failed'
      setState({
        isCompressing: false,
        progress: 0,
        error: errorMessage,
        compressionRatio: null,
        timeSaved: null
      })
      
      // Return original file on error
      return file
    }
  }, [])

  const shouldCompress = useCallback((file: File): boolean => {
    if (isCompressed(file.name)) return false
    if (!isCompressionSupported()) return false
    
    // Estimate benefit (assume 100Mbit connection as baseline)
    const estimate = estimateCompressionBenefit(file.size, 100)
    return estimate.shouldCompress
  }, [])

  return {
    ...state,
    compress,
    shouldCompress,
    isSupported: isCompressionSupported()
  }
}
