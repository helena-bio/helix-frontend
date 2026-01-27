/**
 * Download clinical interpretation report in various formats
 */

import { marked } from 'marked'
import { jsPDF } from 'jspdf'
import { MdTextRender } from 'jspdf-md-renderer'

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
 * Download PDF using jspdf-md-renderer
 */
async function downloadPdf(content: string, filename: string) {
  try {
    // Create PDF document
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    })
    
    // Configure options for markdown rendering with proper types
    const options = {
      cursor: { x: 10, y: 10 },
      page: {
        format: 'a4' as const,
        unit: 'mm' as const,
        orientation: 'portrait' as const,
        maxContentWidth: 190,
        maxContentHeight: 277,
        lineSpace: 1.5,
        defaultLineHeightFactor: 1.2,
        defaultFontSize: 11,
        defaultTitleFontSize: 14,
        topmargin: 10,
        xpading: 10,
        xmargin: 10,
        indent: 10,
      },
      font: {
        bold: { name: 'helvetica' as const, style: 'bold' as const },
        regular: { name: 'helvetica' as const, style: 'normal' as const },
        light: { name: 'helvetica' as const, style: 'light' as const },
      },
      endCursorYHandler: (y: number) => {
        console.log('PDF generation complete. Final Y position:', y)
      }
    }
    
    // Render markdown to PDF
    await MdTextRender(doc, content, options)
    
    // Download the PDF
    doc.save(`${filename}.pdf`)
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
