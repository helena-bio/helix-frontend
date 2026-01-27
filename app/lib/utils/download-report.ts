/**
 * Download clinical interpretation report in various formats
 */

import { marked } from 'marked'
import { jsPDF } from 'jspdf'
import { MdTextRender, type RenderOption } from 'jspdf-md-renderer'

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
    // Create PDF document - exact config from library example
    const doc = new jsPDF({
      unit: 'mm',
      orientation: 'p',
      format: 'a4',
      putOnlyUsedFonts: true,
      hotfixes: ['px_scaling'],
      userUnit: 96
    })
    
    // A4 page configuration from example
    const width = 210
    const height = 297
    const xmargin = 8
    const topmargin = height * 0.1
    const xpading = 15
    const maxLineWidth = width - (2 * xpading)
    const maxContentHeight = height
    const lineSpace = 6.2
    const defaultIndent = 8
    const defaultLineHeightFactor = 1.4
    const defaultFontSize = 11
    const defaultTitleFontSize = defaultFontSize + 2
    
    let y = topmargin
    
    // Configure options with proper RenderOption type
    const options: RenderOption = {
      cursor: {
        x: xpading,
        y: y
      },
      page: {
        format: 'a4',
        orientation: 'p',
        defaultFontSize: defaultFontSize,
        defaultLineHeightFactor: defaultLineHeightFactor,
        defaultTitleFontSize: defaultTitleFontSize,
        indent: defaultIndent,
        lineSpace: lineSpace,
        maxContentHeight: maxContentHeight,
        maxContentWidth: maxLineWidth,
        topmargin: topmargin,
        xmargin: xmargin,
        xpading: xpading
      },
      endCursorYHandler: (endY) => { 
        y = endY 
      },
      font: {
        bold: {
          name: 'helvetica',
          style: 'bold'
        },
        regular: {
          name: 'helvetica',
          style: 'normal'
        },
        light: {
          name: 'helvetica',
          style: 'light'
        } 
      }
    }
    
    // Render markdown to PDF
    await MdTextRender(doc, content, options)
    
    // Set document metadata
    doc.setProperties({
      title: filename,
      subject: 'Clinical Genetic Interpretation Report',
      author: 'Helix Insight',
      creator: 'Helix Insight Platform'
    })
    
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
