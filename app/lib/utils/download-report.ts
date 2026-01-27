/**
 * Download clinical interpretation report in various formats
 */

import { marked } from 'marked'
import jsPDF from 'jspdf'

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
 * Uses HTML wrapper with Word MIME type for better compatibility
 */
async function downloadDocx(content: string, filename: string) {
  try {
    // Convert markdown to HTML
    const htmlContent = await marked.parse(content)
    
    // Create Word-compatible HTML with proper styling
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
    code { 
      font-family: 'Courier New', monospace; 
      background-color: #f5f5f5;
      padding: 2px 4px;
    }
    pre {
      background-color: #f5f5f5;
      padding: 10pt;
      border: 1px solid #ddd;
      overflow-x: auto;
    }
    strong { font-weight: bold; }
    em { font-style: italic; }
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
 * Download PDF report
 */
async function downloadPdf(content: string, filename: string) {
  try {
    // Convert markdown to HTML
    const htmlContent = await marked.parse(content)
    
    // Create a temporary container
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.width = '210mm' // A4 width
    container.style.padding = '20mm'
    container.style.fontFamily = 'Arial, sans-serif'
    container.style.fontSize = '11pt'
    container.style.lineHeight = '1.5'
    container.innerHTML = htmlContent
    document.body.appendChild(container)

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Get all text content and split into lines
    const lines = container.innerText.split('\n')
    let y = 20 // Start position
    const lineHeight = 7
    const maxWidth = 170 // Max text width (A4 width - margins)
    const pageHeight = 277 // A4 height in mm

    pdf.setFontSize(11)

    for (const line of lines) {
      if (line.trim()) {
        // Check if we need a new page
        if (y > pageHeight - 20) {
          pdf.addPage()
          y = 20
        }

        // Split long lines
        const splitLines = pdf.splitTextToSize(line, maxWidth)
        for (const splitLine of splitLines) {
          pdf.text(splitLine, 20, y)
          y += lineHeight
        }
      } else {
        y += lineHeight / 2 // Empty line spacing
      }
    }

    // Clean up
    document.body.removeChild(container)

    // Download
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw new Error('Failed to generate PDF file')
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
