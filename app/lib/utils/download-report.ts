/**
 * Download clinical interpretation report in various formats
 */

import { marked } from 'marked'

export type ReportFormat = 'md' | 'docx' | 'pdf'

/**
 * Download markdown report
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
 * Download DOCX report
 */
async function downloadDocx(content: string, filename: string) {
  try {
    const htmlContent = await marked.parse(content)
    
    const wordHtml = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
  <meta charset='utf-8'>
  <title>${filename}</title>
  <style>
    body {
      font-family: 'Calibri', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      margin: 1in;
    }
    h1 { font-size: 18pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
    h2 { font-size: 16pt; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt; }
    h3 { font-size: 14pt; font-weight: bold; margin-top: 8pt; margin-bottom: 3pt; }
    p { margin-top: 0; margin-bottom: 8pt; }
    ul, ol { margin-left: 20pt; }
    li { margin-bottom: 4pt; }
    strong { font-weight: bold; }
    em { font-style: italic; }
    table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
    th, td { border: 1px solid #ddd; padding: 8pt; text-align: left; }
    th { background-color: #4a90e2; color: white; font-weight: bold; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>
`
    
    const blob = new Blob([wordHtml], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.docx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('DOCX generation failed:', error)
    throw new Error('Failed to generate DOCX file')
  }
}

/**
 * Download PDF report via backend service
 */
async function downloadPdf(content: string, filename: string) {
  try {
    // CORRECT URL: matches backend endpoint /report/download
    const response = await fetch('http://localhost:9007/report/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
        filename: filename
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`PDF generation failed: ${response.status} - ${errorText}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw new Error('Failed to generate PDF file. Backend service not available.')
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
        downloadMarkdown(interpretation, filename)
        break
      case 'docx':
        await downloadDocx(interpretation, filename)
        break
      case 'pdf':
        await downloadPdf(interpretation, filename)
        break
    }
  } catch (error) {
    console.error(`Download failed for format ${format}:`, error)
    throw error
  }
}
