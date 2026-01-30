/**
 * File Compression Utilities with Inline Web Worker
 * 
 * Worker code is inlined - no external files needed
 * Keeps UI responsive during compression
 */

/**
 * Check if compression is supported
 */
export function isCompressionSupported(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof Worker !== 'undefined'
}

/**
 * Create inline compression worker
 */
function createCompressionWorker(): Worker {
  const workerCode = `
    self.onmessage = async function(e) {
      const { file } = e.data
      
      try {
        const compressionStream = new CompressionStream('gzip')
        const fileStream = file.stream()
        const compressedStream = fileStream.pipeThrough(compressionStream)
        
        const reader = compressedStream.getReader()
        const chunks = []
        let totalSize = 0
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          if (value) {
            chunks.push(value)
            totalSize += value.length
            
            const estimatedCompressed = file.size / 10
            const progress = Math.min(95, Math.round((totalSize / estimatedCompressed) * 100))
            
            self.postMessage({ type: 'progress', progress })
          }
        }
        
        const compressedBlob = new Blob(chunks, { type: 'application/gzip' })
        
        self.postMessage({
          type: 'complete',
          progress: 100,
          blob: compressedBlob,
          originalSize: file.size,
          compressedSize: compressedBlob.size
        })
        
      } catch (error) {
        self.postMessage({ type: 'error', error: error.message })
      }
    }
  `
  
  const blob = new Blob([workerCode], { type: 'application/javascript' })
  const workerUrl = URL.createObjectURL(blob)
  return new Worker(workerUrl)
}

/**
 * Compress file using inline Web Worker (non-blocking)
 */
export async function compressFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  if (!isCompressionSupported()) {
    throw new Error('CompressionStream or Web Workers not supported')
  }

  const startTime = performance.now()

  return new Promise((resolve, reject) => {
    const worker = createCompressionWorker()
    
    worker.onmessage = (e) => {
      const { type, progress, blob, originalSize, compressedSize, error } = e.data
      
      switch (type) {
        case 'progress':
          onProgress?.(progress)
          break
          
        case 'complete':
          const compressionTime = performance.now() - startTime
          console.log(`[COMPRESSION] ${file.name}: ${originalSize} → ${compressedSize} bytes in ${compressionTime.toFixed(0)}ms`)
          
          const compressedFileName = file.name.endsWith('.gz') 
            ? file.name 
            : `${file.name}.gz`
          
          const compressedFile = new File([blob], compressedFileName, {
            type: 'application/gzip',
            lastModified: Date.now()
          })
          
          worker.terminate()
          resolve(compressedFile)
          break
          
        case 'error':
          worker.terminate()
          reject(new Error(error))
          break
      }
    }
    
    worker.onerror = (error) => {
      worker.terminate()
      reject(error)
    }
    
    worker.postMessage({ file })
  })
}

/**
 * Should compress? (ONLY .vcf files >10MB)
 */
export function shouldCompress(file: File): boolean {
  const fileName = file.name.toLowerCase()
  const fileSizeMB = file.size / (1024 * 1024)
  
  if (fileName.endsWith('.vcf.gz') || 
      fileName.endsWith('.gz') ||
      fileName.endsWith('.zip') || 
      fileName.endsWith('.bz2') ||
      fileName.endsWith('.bgz')) {
    return false
  }
  
  if (!fileName.endsWith('.vcf')) {
    return false
  }
  
  if (fileSizeMB < 10) {
    return false
  }
  
  return true
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
 * Estimate compression benefit
 */
export function estimateCompressionBenefit(
  file: File,
  networkSpeedMbps: number = 100
): number {
  const fileSizeMB = file.size / (1024 * 1024)
  const networkSpeedMBps = networkSpeedMbps / 8
  
  const compressionTimeSec = fileSizeMB / 100
  const uploadTimeOriginal = fileSizeMB / networkSpeedMBps
  const compressedSizeMB = fileSizeMB / 10
  const uploadTimeCompressed = compressedSizeMB / networkSpeedMBps
  
  const timeSaved = (uploadTimeOriginal - uploadTimeCompressed) - compressionTimeSec
  
  return timeSaved
}
