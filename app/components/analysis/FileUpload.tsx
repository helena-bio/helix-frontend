"use client"

/**
 * FileUpload Component - Production Ready with Progress Tracking
 *
 * Features:
 * - Drag & drop with visual feedback
 * - Real API integration with mutations
 * - Upload progress tracking (REAL progress via XMLHttpRequest)
 * - File validation (client-side)
 * - Error handling with retry
 * - Accessibility (ARIA, keyboard)
 * - Performance optimizations (useCallback, useMemo)
 */

import { useCallback, useMemo, useState, useRef, type ChangeEvent, type DragEvent } from 'react'
import { Upload, FileCode, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUploadVCF } from '@/hooks/mutations'
import { toast } from 'sonner'

// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
const ALLOWED_EXTENSIONS = ['.vcf', '.vcf.gz']

interface FileUploadProps {
  onUploadSuccess?: (sessionId: string) => void
  onUploadError?: (error: Error) => void
}

export function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  // State
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  // Mutations
  const uploadMutation = useUploadVCF()

  // Computed values
  const isUploading = uploadMutation.isPending
  const uploadError = uploadMutation.error

  const fileSize = useMemo(() => {
    if (!selectedFile) return null
    const mb = selectedFile.size / (1024 * 1024)
    return mb < 1
      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
      : `${mb.toFixed(2)} MB`
  }, [selectedFile])

  const canSubmit = useMemo(() => {
    return !!(selectedFile && !isUploading && !validationError)
  }, [selectedFile, isUploading, validationError])

  // Validation
  const validateFile = useCallback((file: File): string | null => {
    // Check extension
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))

    if (!hasValidExtension) {
      return `Invalid file type. Please upload ${ALLOWED_EXTENSIONS.join(' or ')} files.`
    }

    // Check size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 2GB.`
    }

    if (file.size === 0) {
      return 'File is empty.'
    }

    return null
  }, [])

  // Handlers - Drag & Drop
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (dragCounterRef.current === 1) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      const error = validateFile(file)

      if (error) {
        setValidationError(error)
        toast.error('Invalid file', { description: error })
        return
      }

      setSelectedFile(file)
      setValidationError(null)
      toast.success('File selected', { description: file.name })
    }
  }, [validateFile])

  // Handlers - File Input
  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      const error = validateFile(file)

      if (error) {
        setValidationError(error)
        toast.error('Invalid file', { description: error })
        return
      }

      setSelectedFile(file)
      setValidationError(null)
      toast.success('File selected', { description: file.name })
    }
  }, [validateFile])

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null)
    setValidationError(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Handlers - Submit
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !selectedFile) return

    setUploadProgress(0)

    try {
      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        analysisType: 'germline',
        genomeBuild: 'GRCh38',
        onProgress: setUploadProgress,
      })

      toast.success('Upload successful', {
        description: `Session ${result.id} created`,
      })

      onUploadSuccess?.(result.id)
    } catch (error) {
      const err = error as Error
      toast.error('Upload failed', {
        description: err.message,
      })
      onUploadError?.(err)
    }
  }, [canSubmit, selectedFile, uploadMutation, onUploadSuccess, onUploadError])

  const handleRetry = useCallback(() => {
    uploadMutation.reset()
    setUploadProgress(0)
    handleSubmit()
  }, [uploadMutation, handleSubmit])

  // Render - Loading State
  if (isUploading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-8">
        <div className="w-full max-w-md bg-card border rounded-lg p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10">
            <FileCode className="h-8 w-8 text-primary animate-pulse" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Uploading File</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we upload your VCF file...
            </p>
          </div>

          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{selectedFile?.name}</span>
              <span>{uploadProgress}%</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render - Error State
  if (uploadError) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-8">
        <div className="w-full max-w-md bg-card border border-destructive rounded-lg p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Upload Failed</h3>
            <p className="text-sm text-muted-foreground">
              {uploadError.message}
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={handleRetry}>Try Again</Button>
            <Button variant="outline" onClick={() => {
              uploadMutation.reset()
              handleRemoveFile()
            }}>
              Start Over
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Render - Main Upload UI
  return (
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Upload VCF File</h1>
          <p className="text-muted-foreground">
            Start your analysis by uploading a genetic variant file
          </p>
        </div>

        {/* File Upload Zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg transition-all
            ${isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-border hover:border-primary/50 hover:bg-accent/5'
            }
            ${selectedFile ? 'p-6' : 'p-12'}
          `}
          role="button"
          tabIndex={0}
          aria-label="File upload area"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleBrowseClick()
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            className="sr-only"
            disabled={isUploading}
            aria-label="File input"
          />

          {selectedFile ? (
            // Selected File Display
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 p-2 rounded bg-primary/10">
                  <FileCode className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{fileSize}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                disabled={isUploading}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            // Empty State
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="p-6 rounded-full bg-primary/10">
                <FileCode className="h-12 w-12 text-primary" />
              </div>

              <div>
                <p className="text-lg font-medium mb-2">
                  Drag and drop your VCF file here
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports .vcf and .vcf.gz files (max 2GB)
                </p>
              </div>

              <Button size="lg" onClick={handleBrowseClick} disabled={isUploading}>
                <Upload className="h-5 w-5 mr-2" />
                Select File
              </Button>
            </div>
          )}
        </div>

        {/* Validation Error */}
        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        {selectedFile && (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleRemoveFile} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              size="lg"
              className="min-w-[120px]"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Upload & Analyze
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
