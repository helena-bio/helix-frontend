/**
 * AvatarCropModal Component
 *
 * Professional avatar editor with zoom, pan, and circular crop.
 * Renders cropped result to canvas and uploads via API.
 */
'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { X, Loader2, ZoomIn, ZoomOut } from 'lucide-react'
import { tokenUtils } from '@/lib/auth/token'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008'
const CROP_SIZE = 280
const OUTPUT_SIZE = 256

interface AvatarCropModalProps {
  imageFile: File
  onSave: () => void
  onCancel: () => void
}

export function AvatarCropModal({ imageFile, onSave, onCancel }: AvatarCropModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const imgRef = useRef<HTMLImageElement | null>(null)

  // Load file as data URL
  useEffect(() => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setImageUrl(url)

      const img = new Image()
      img.onload = () => {
        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
        imgRef.current = img
      }
      img.src = url
    }
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  // Base scale: fit image so shortest side covers the crop area
  const baseScale = useMemo(() => {
    if (!naturalSize.w || !naturalSize.h) return 1
    return CROP_SIZE / Math.min(naturalSize.w, naturalSize.h)
  }, [naturalSize])

  const scale = baseScale * zoom
  const scaledW = naturalSize.w * scale
  const scaledH = naturalSize.h * scale

  // Clamp offset so image always covers the crop circle
  const clampOffset = useCallback((ox: number, oy: number, z?: number) => {
    const s = baseScale * (z ?? zoom)
    const sw = naturalSize.w * s
    const sh = naturalSize.h * s
    const maxX = Math.max(0, (sw - CROP_SIZE) / 2)
    const maxY = Math.max(0, (sh - CROP_SIZE) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    }
  }, [baseScale, zoom, naturalSize])

  // Re-clamp when zoom changes
  useEffect(() => {
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom))
  }, [zoom, clampOffset])

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [offset])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    const raw = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }
    setOffset(clampOffset(raw.x, raw.y))
  }, [isDragging, dragStart, clampOffset])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleZoomChange = useCallback((v: number) => {
    setZoom(Math.max(1, Math.min(3, Math.round(v * 20) / 20)))
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    handleZoomChange(zoom + delta)
  }, [zoom, handleZoomChange])

  // Image position: centered + offset
  const imgX = (CROP_SIZE - scaledW) / 2 + offset.x
  const imgY = (CROP_SIZE - scaledH) / 2 + offset.y

  // Save: crop to canvas, upload
  const handleSave = useCallback(async () => {
    if (!imgRef.current) return
    setSaving(true)
    setError('')

    try {
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')!

      // Source rectangle in original image coordinates
      const srcX = -imgX / scale
      const srcY = -imgY / scale
      const srcSize = CROP_SIZE / scale

      // Circular clip
      ctx.beginPath()
      ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
      ctx.clip()

      ctx.drawImage(
        imgRef.current,
        srcX, srcY, srcSize, srcSize,
        0, 0, OUTPUT_SIZE, OUTPUT_SIZE
      )

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', 0.9)
      )
      if (!blob) throw new Error('Failed to create image')

      const formData = new FormData()
      formData.append('file', blob, 'avatar.webp')

      const token = tokenUtils.get()
      const response = await fetch(`${API_URL}/auth/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || 'Upload failed')
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setSaving(false)
    }
  }, [imgX, imgY, scale, onSave])

  const imageReady = imageUrl && naturalSize.w > 0

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} />

      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-[400px] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Edit photo</h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop area */}
        <div className="flex flex-col items-center px-5 py-6 space-y-5">
          {!imageReady ? (
            <div className="flex items-center justify-center" style={{ width: CROP_SIZE, height: CROP_SIZE }}>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Crop container with overflow hidden */}
              <div
                className="relative select-none overflow-hidden rounded-full"
                style={{
                  width: CROP_SIZE,
                  height: CROP_SIZE,
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onWheel={handleWheel}
              >
                <img
                  src={imageUrl}
                  alt="Crop preview"
                  draggable={false}
                  className="absolute pointer-events-none"
                  style={{
                    width: scaledW,
                    height: scaledH,
                    left: imgX,
                    top: imgY,
                  }}
                />
              </div>

              {/* Zoom slider */}
              <div className="flex items-center gap-3 w-full max-w-[280px]">
                <button
                  onClick={() => handleZoomChange(zoom - 0.2)}
                  disabled={zoom <= 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-primary"
                />
                <button
                  onClick={() => handleZoomChange(zoom + 0.2)}
                  disabled={zoom >= 3}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 border border-border rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !imageReady}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}
