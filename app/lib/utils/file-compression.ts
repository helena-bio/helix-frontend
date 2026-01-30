/**
 * Client-side file compression utilities
 * 
 * Uses native CompressionStream API for gzip compression
 * Significantly reduces upload time for slow connections
 */

interface CompressionResult {
  compressedBlob: Blob
  originalSize: number
  compressedSize: number
  compressionRatio: number
  compressionTime: number
}

/**
 * Check if file is already compressed
 */
export function isCompressed(filename: string): boolean {
  return filename.endsWith('.gz') || 
         filename.endsWith('.zip') || 
         filename.endsWith('.bz2')
}

/**
 * Compress file using native browser CompressionStream API
 * 
 * Browser support: Chrome 80+, Firefox 113+, Safari 16.4+
 */
export async function compressFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<CompressionResult> {
  const startTime = performance.now()
  const originalSize = file.size

  // Check browser support
  if (!('CompressionStream' in window)) {
    throw new Error('Browser does not support CompressionStream API')
  }

  try {
    // Create compression stream
    const compressionStream = new CompressionStream('gzip')
    
    // Stream file through compression
    const readableStream = file.stream()
    const compressedStream = readableStream.pipeThrough(compressionStream)
    
    // Track progress
    let processedBytes = 0
    const chunks: Uint8Array[] = []
    
    const reader = compressedStream.getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      chunks.push(value)
      processedBytes += value.length
      
      // Report progress (approximate based on input)
      if (onProgress) {
        const progress = Math.min((processedBytes / originalSize) * 100, 99)
        onProgress(progress)
      }
    }
    
    // Combine chunks into single blob
    const compressedBlob = new Blob(chunks, { type: 'application/gzip' })
    const compressedSize = compressedBlob.size
    
    const compressionTime = performance.now() - startTime
    
    if (onProgress) onProgress(100)
    
    return {
      compressedBlob,
      originalSize,
      compressedSize,
      compressionRatio: originalSize / compressedSize,
      compressionTime: compressionTime / 1000 // seconds
    }
    
  } catch (error) {
    throw new Error(`Compression failed: ${error}`)
  }
}

/**
 * Estimate compression benefit
 * 
 * Returns estimated time savings based on connection speed
 */
export function estimateCompressionBenefit(
  fileSize: number,
  connectionSpeedMbps: number = 100 // Default 100Mbit
): {
  shouldCompress: boolean
  estimatedSavings: number // seconds
  explanation: string
} {
  // VCF files compress ~10x
  const compressionRatio = 10
  const compressedSize = fileSize / compressionRatio
  
  // Estimate compression time (varies by CPU, use conservative estimate)
  const compressionTimePerGB = 10 // seconds per GB
  const compressionTime = (fileSize / (1024 ** 3)) * compressionTimePerGB
  
  // Calculate upload times
  const uploadSpeedBytesPerSec = (connectionSpeedMbps * 1024 * 1024) / 8
  const uploadTimeUncompressed = fileSize / uploadSpeedBytesPerSec
  const uploadTimeCompressed = compressedSize / uploadSpeedBytesPerSec
  
  const totalTimeWithCompression = compressionTime + uploadTimeCompressed
  const timeSavings = uploadTimeUncompressed - totalTimeWithCompression
  
  const shouldCompress = timeSavings > 10 // Only if saves >10 seconds
  
  let explanation = ''
  if (shouldCompress) {
    explanation = `Compression will save ~${Math.round(timeSavings)} seconds (${Math.round(uploadTimeUncompressed / 60)} min → ${Math.round(totalTimeWithCompression / 60)} min)`
  } else {
    explanation = `Fast connection detected - compression not beneficial`
  }
  
  return {
    shouldCompress,
    estimatedSavings: timeSavings,
    explanation
  }
}

/**
 * Check if CompressionStream API is supported
 */
export function isCompressionSupported(): boolean {
  return 'CompressionStream' in window
}
