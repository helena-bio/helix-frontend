/**
 * Download clinical interpretation report in various formats
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.helixinsight.bio'

export type ReportFormat = 'md' | 'docx' | 'pdf'

/**
 * Download markdown report (client-side)
 */
function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download report via backend service (PDF or DOCX)
 */
async function downloadFromBackend(
  content: string,
  filename: string,
  format: 'pdf' | 'docx'
) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:9007'
    const endpoint = `${backendUrl}/api/v1/report/download`

    console.log(`${format.toUpperCase()} download:`, endpoint)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
        filename: filename,
        format: format
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`${format.toUpperCase()} generation failed: ${response.status} - ${errorText}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error(`${format.toUpperCase()} generation failed:`, error)
    throw new Error(`Failed to generate ${format.toUpperCase()} file. Backend service not available.`)
  }
}

/**
 * Download clinical interpretation report
 */
export async function downloadClinicalReport(
  interpretation: string,
  format: ReportFormat,
  sessionId: string
) {
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `clinical-report-${sessionId}-${timestamp}`

  try {
    switch (format) {
      case 'md':
        // Client-side markdown download
        downloadMarkdown(interpretation, filename)
        break

      case 'docx':
        // Backend DOCX generation
        await downloadFromBackend(interpretation, filename, 'docx')
        break

      case 'pdf':
        // Backend PDF generation
        await downloadFromBackend(interpretation, filename, 'pdf')
        break
    }
  } catch (error) {
    console.error(`Download failed for format ${format}:`, error)
    throw error
  }
}

/**
 * Download binary report from a GET endpoint (service-generated PDF)
 */
async function downloadBinaryFromService(
  endpoint: string,
  filename: string
) {
  const response = await fetch(endpoint)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Report download failed: ${response.status} - ${errorText}`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download phenotype findings PDF report
 * Generated server-side from DuckDB phenotype matching results
 */
export async function downloadPhenotypeFindingsReport(sessionId: string) {
  const endpoint = `${API_BASE_URL}/phenotype/api/sessions/${sessionId}/phenotype/report/pdf`
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `phenotype-findings-${sessionId}-${timestamp}.pdf`

  try {
    console.log('Phenotype findings PDF download:', endpoint)
    await downloadBinaryFromService(endpoint, filename)
  } catch (error) {
    console.error('Phenotype findings PDF download failed:', error)
    throw error
  }
}
