"use client"
import { useDemoModal } from '@/contexts'
export function VideoHero() {
  const { openModal } = useDemoModal()
  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">
          From variants to understanding
        </h1>
        <p className="text-xl text-muted-foreground">
          AI-Powered Genetic Variant Analysis
        </p>
      </div>
      <div className="w-full max-w-4xl aspect-video bg-muted/30 border border-border rounded-lg overflow-hidden shadow-lg">
        <video
          className="w-full h-full object-cover"
          controls
          preload="metadata"
          poster="/video/helixinsight_preview.jpg"
        >
          <source src="/video/helixinsight_preview.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <button
        onClick={openModal}
        className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors shadow-md"
      >
        Request a Demo
      </button>
    </div>
  )
}
