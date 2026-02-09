/**
 * NDJSON Streaming Web Worker
 *
 * Fetches, decompresses (browser-handled), parses NDJSON lines,
 * and posts parsed objects back to main thread in batches.
 *
 * This keeps all JSON.parse() calls off the main thread.
 *
 * Messages IN:
 *   { type: 'start', url: string, batchSize: number }
 *
 * Messages OUT:
 *   { type: 'metadata', data: object }
 *   { type: 'batch', genes: object[], totalSoFar: number }
 *   { type: 'complete', totalGenes: number, totalVariants: number }
 *   { type: 'error', message: string }
 */

self.onmessage = async function(e) {
  if (e.data.type !== 'start') return

  const { url, batchSize = 500 } = e.data

  try {
    const response = await fetch(url)

    if (!response.ok) {
      self.postMessage({ type: 'error', message: `HTTP ${response.status}: ${response.statusText}` })
      return
    }

    if (!response.body) {
      self.postMessage({ type: 'error', message: 'No response body' })
      return
    }

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader()

    let buffer = ''
    let batch = []
    let totalGenesLoaded = 0
    let totalGenesCount = 0
    let totalVariantsCount = 0

    while (true) {
      const { value, done } = await reader.read()

      if (done) break

      buffer += value
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue

        try {
          const parsed = JSON.parse(line)

          if (parsed.type === 'metadata') {
            totalGenesCount = parsed.total_genes
            totalVariantsCount = parsed.total_variants
            self.postMessage({ type: 'metadata', data: parsed })
          } else if (parsed.type === 'gene') {
            batch.push(parsed.data)
            totalGenesLoaded++

            // Send batch to main thread
            if (batch.length >= batchSize) {
              self.postMessage({
                type: 'batch',
                genes: batch,
                totalSoFar: totalGenesLoaded,
                totalGenes: totalGenesCount,
              })
              batch = []
            }
          } else if (parsed.type === 'complete') {
            // Flush remaining batch
            if (batch.length > 0) {
              self.postMessage({
                type: 'batch',
                genes: batch,
                totalSoFar: totalGenesLoaded,
                totalGenes: totalGenesCount,
              })
              batch = []
            }
            self.postMessage({
              type: 'complete',
              totalGenes: totalGenesLoaded,
              totalVariants: totalVariantsCount,
            })
          }
        } catch (parseErr) {
          // Skip malformed lines
        }
      }
    }

    // Handle case where stream ends without 'complete' message
    if (batch.length > 0) {
      self.postMessage({
        type: 'batch',
        genes: batch,
        totalSoFar: totalGenesLoaded,
        totalGenes: totalGenesCount,
      })
    }

    // Always send complete
    self.postMessage({
      type: 'complete',
      totalGenes: totalGenesLoaded,
      totalVariants: totalVariantsCount,
    })

  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || 'Unknown error' })
  }
}
