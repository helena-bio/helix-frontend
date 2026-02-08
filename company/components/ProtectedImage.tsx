"use client"
import Image from 'next/image'

export function ProtectedImage({ src, width, height, className }: {
  src: string
  width: number
  height: number
  className?: string
}) {
  return (
    <div className={`relative ${className || ''}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        className="w-full h-full rounded-lg object-cover object-top pointer-events-none select-none"
        draggable={false}
      />
      <div className="absolute inset-0 rounded-lg" />
    </div>
  )
}
