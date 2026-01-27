/**
 * Download clinical interpretation report in various formats
 */

import { marked } from 'marked'
import html2pdf from 'html2pdf.js'

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
    li { margin-bottom: 4pt; }
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
 * Download PDF report with proper formatting
 */
async function downloadPdf(content: string, filename: string) {
  try {
    // Convert markdown to HTML
    const htmlContent = await marked.parse(content)
    
    // Create styled HTML
    const styledHtml = `
      <div style="
        font-family: Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #000;
        max-width: 210mm;
        padding: 20mm;
      ">
        <style>
          h1 { font-size: 18pt; font-weight: bold; margin-top: 16pt; margin-bottom: 8pt; }
          h2 { font-size: 16pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; }
          h3 { font-size: 14pt; font-weight: bold; margin-top: 12pt; margin-bottom: 4pt; }
          p { margin-top: 0; margin-bottom: 8pt; }
          ul, ol { margin-left: 20pt; padding-left: 10pt; }
          li { margin-bottom: 4pt; }
          strong { font-weight: bold; }
          em { font-style: italic; }
          code {
            font-family: 'Courier New', monospace;
            background-color: #f5f5f5;
            padding: 2px 4px;
            font-size: 10pt;
          }
          pre {
            background-color: #f5f5f5;
            padding: 10pt;
            border: 1px solid #ddd;
            overflow-x: auto;
            font-size: 9pt;
          }
        </style>
        ${htmlContent}
      </div>
    `
    
    // Create temporary element
    const element = document.createElement('div')
    element.innerHTML = styledHtml
    
    // Configure html2pdf options with proper types
    const opt = {
      margin: 10,
      filename: `${filename}.pdf`,
      image: { 
        type: 'jpeg' as const, 
        quality: 0.98 
      },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const
      }
    }
    
    // Generate PDF
    await html2pdf().set(opt).from(element).save()
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
