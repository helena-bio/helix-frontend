/**
 * AvatarCropModal Component
 *
 * Avatar editor with zoom (CSS transform) and pan.
 * Circular crop preview, uploads cropped WebP via API.
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
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const imgRef = useRef<HTMLImageElement | null>(null)

  // Load image
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

  // Base dimensions: scale so shortest side = CROP_SIZE
  const baseDims = useMemo(() => {
    if (!naturalSize.w || !naturalSize.h) return { w: CROP_SIZE, h: CROP_SIZE }
    const ratio = naturalSize.w / naturalSize.h
    if (ratio >= 1) {
      // Landscape or square: height = CROP_SIZE, width = wider
      return { w: CROP_SIZE * ratio, h: CROP_SIZE }
    } else {
      // Portrait: width = CROP_SIZE, height = taller
      return { w: CROP_SIZE, h: CROP_SIZE / ratio }
    }
  }, [naturalSize])

  // Max pan: image edge can't go past crop edge
  const clampPan = useCallback((px: number, py: number, z?: number) => {
    const s = z ?? zoom
    const maxX = Math.max(0, (baseDims.w * s - CROP_SIZE) / 2)
    const maxY = Math.max(0, (baseDims.h * s - CROP_SIZE) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, px)),
      y: Math.max(-maxY, Math.min(maxY, py)),
    }
  }, [baseDims, zoom])

  // Re-clamp pan when zoom changes
  useEffect(() => {
    setPan((prev) => clampPan(prev.x, prev.y, zoom))
  }, [zoom, clampPan])

  // Drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pan])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    setPan(clampPan(e.clientX - dragStart.x, e.clientY - dragStart.y))
  }, [isDragging, dragStart, clampPan])

  const handlePointerUp = useCallback(() => setIsDragging(false), [])

  // Zoom
  const handleZoom = useCallback((v: number) => {
    setZoom(Math.max(1, Math.min(3, Math.round(v * 20) / 20)))
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    handleZoom(zoom + (e.deltaY > 0 ? -0.1 : 0.1))
  }, [zoom, handleZoom])

  // Save
  const handleSave = useCallback(async () => {
    if (!imgRef.current) return
    setSaving(true)
    setError('')

    try {
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')!

      // Map crop area back to natural image coordinates
      const baseScale = naturalSize.w / baseDims.w
      // Center of crop in base-image space (before zoom)
      const centerX = (baseDims.w / 2 - pan.x / zoom) * baseScale
      const centerY = (baseDims.h / 2 - pan.y / zoom) * baseScale
      const srcSize = (CROP_SIZE / zoom) * baseScale

      const srcX = centerX - srcSize / 2
      const srcY = centerY - srcSize / 2

      // Circular clip
      ctx.beginPath()
      ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
      ctx.clip()

      ctx.drawImage(imgRef.current, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.9))
      if (!blob) throw new Error('Failed to create image')

      const formData = new FormData()
      formData.append('file', blob, 'avatar.webp')

      const token = tokenUtils.get()
      const res = await fetch(`${API_URL}/auth/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Upload failed')
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setSaving(false)
    }
  }, [naturalSize, baseDims, pan, zoom, onSave])

  const imageReady = imageUrl && naturalSize.w > 0

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} />

      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-[400px] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Edit photo</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
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
              {/* Square container with circular clip */}
              <div
                className="relative select-none overflow-hidden"
                style={{
                  width: CROP_SIZE,
                  height: CROP_SIZE,
                  borderRadius: '50%',
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onWheel={handleWheel}
              >
                {/* Image: fixed base size, zoom via CSS transform */}
                <img
                  src={imageUrl}
                  alt="Crop preview"
                  draggable={false}
                  className="absolute pointer-events-none origin-center"
                  style={{
                    width: baseDims.w,
                    height: baseDims.h,
                    left: (CROP_SIZE - baseDims.w) / 2 + pan.x,
                    top: (CROP_SIZE - baseDims.h) / 2 + pan.y,
                    transform: `scale(${zoom})`,
                  }}
                />
              </div>

              {/* Zoom slider */}
              <div className="flex items-center gap-3 w-full max-w-[280px]">
                <button
                  onClick={() => handleZoom(zoom - 0.2)}
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
                  onChange={(e) => handleZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-primary"
                />
                <button
                  onClick={() => handleZoom(zoom + 0.2)}
                  disabled={zoom >= 3}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive text-center">{error}</p>}
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
