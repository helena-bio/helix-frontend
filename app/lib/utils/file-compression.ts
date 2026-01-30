/**
 * File Compression Utilities
 * 
 * Native browser compression using CompressionStream API
 * Supports: Chrome 80+, Firefox 113+, Safari 16.4+
 */

/**
 * Check if compression is supported in current browser
 */
export function isCompressionSupported(): boolean {
  return typeof CompressionStream !== 'undefined'
}

/**
 * Compress file using native browser CompressionStream
 * 
 * @param file - File to compress
 * @param onProgress - Optional progress callback (0-100)
 * @returns Compressed file as .gz
 */
export async function compressFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  if (!isCompressionSupported()) {
    throw new Error('CompressionStream not supported in this browser')
  }

  const startTime = performance.now()

  // Create compression stream
  const compressionStream = new CompressionStream('gzip')
  
  // Stream file through compression
  const fileStream = file.stream()
  const compressedStream = fileStream.pipeThrough(compressionStream)
  
  // Read compressed data
  const reader = compressedStream.getReader()
  const chunks: Uint8Array[] = []
  let totalSize = 0
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      if (value) {
        chunks.push(value)
        totalSize += value.length
        
        // Estimate progress (compressed size is unknown upfront)
        // Use heuristic: assume 10:1 compression ratio
        const estimatedCompressed = file.size / 10
        const progress = Math.min(95, Math.round((totalSize / estimatedCompressed) * 100))
        onProgress?.(progress)
      }
    }
  } finally {
    reader.releaseLock()
  }
  
  onProgress?.(100)

  // Combine chunks into single blob - FIX TypeScript issue
  const compressedBlob = new Blob(chunks as BlobPart[], { type: 'application/gzip' })
  const compressedSize = compressedBlob.size

  const compressionTime = performance.now() - startTime
  
  console.log(`[COMPRESSION] ${file.name}: ${file.size} → ${compressedSize} bytes in ${compressionTime.toFixed(0)}ms`)
  
  // Create new file with .gz extension
  const compressedFileName = file.name.endsWith('.gz') 
    ? file.name 
    : `${file.name}.gz`
  
  return new File([compressedBlob], compressedFileName, {
    type: 'application/gzip',
    lastModified: Date.now()
  })
}

/**
 * Estimate if compression would be beneficial
 * 
 * Rules:
 * - Already compressed files (.gz, .zip, .bz2): NO
 * - Small files (<10MB): NO (overhead not worth it)
 * - Text-based files (.vcf, .txt, .csv): YES
 * - Large files (>10MB): YES
 * 
 * @param file - File to check
 * @returns True if compression recommended
 */
export function shouldCompress(file: File): boolean {
  const fileName = file.name.toLowerCase()
  const fileSizeMB = file.size / (1024 * 1024)
  
  // Already compressed
  if (fileName.endsWith('.gz') || 
      fileName.endsWith('.zip') || 
      fileName.endsWith('.bz2') ||
      fileName.endsWith('.bgz')) {
    return false
  }
  
  // Too small (overhead > benefit)
  if (fileSizeMB < 10) {
    return false
  }
  
  // Text-based genomics files (high compression ratio expected)
  if (fileName.endsWith('.vcf') || 
      fileName.endsWith('.txt') ||
      fileName.endsWith('.csv') ||
      fileName.endsWith('.tsv') ||
      fileName.endsWith('.bed')) {
    return true
  }
  
  return false
}

/**
 * Check if file is already compressed
 */
export function isCompressed(file: File): boolean {
  const fileName = file.name.toLowerCase()
  return fileName.endsWith('.gz') || 
         fileName.endsWith('.zip') || 
         fileName.endsWith('.bz2') ||
         fileName.endsWith('.bgz')
}

/**
 * Estimate compression benefit (time saved vs time spent)
 * 
 * Factors:
 * - Compression time: ~1s per 100MB
 * - Network speed: estimate from file size
 * - Compression ratio: assume 10:1 for VCF
 * 
 * @param file - File to analyze
 * @param networkSpeedMbps - Network speed in Mbps (default: 100)
 * @returns Estimated time saved in seconds (positive = worth it)
 */
export function estimateCompressionBenefit(
  file: File,
  networkSpeedMbps: number = 100
): number {
  const fileSizeMB = file.size / (1024 * 1024)
  const networkSpeedMBps = networkSpeedMbps / 8 // Convert Mbps to MB/s
  
  // Estimate compression time (empirical: ~1s per 100MB)
  const compressionTimeSec = fileSizeMB / 100
  
  // Estimate upload time without compression
  const uploadTimeOriginal = fileSizeMB / networkSpeedMBps
  
  // Estimate upload time with compression (assume 10:1 ratio)
  const compressedSizeMB = fileSizeMB / 10
  const uploadTimeCompressed = compressedSizeMB / networkSpeedMBps
  
  // Time saved = (original upload - compressed upload) - compression overhead
  const timeSaved = (uploadTimeOriginal - uploadTimeCompressed) - compressionTimeSec
  
  return timeSaved
}
