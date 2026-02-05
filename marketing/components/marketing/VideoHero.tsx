"use client"

export function VideoHero() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-4 max-w-4xl">
        <h1 className="text-5xl font-bold text-primary">
          Helix Insight
        </h1>
        <p className="text-xl text-muted-foreground">
          AI-Powered Genetic Variant Analysis
        </p>
      </div>

      <div className="w-full max-w-4xl aspect-video bg-card border border-border rounded-lg overflow-hidden shadow-lg">
        <video
          className="w-full h-full"
          controls
          preload="metadata"
        >
          <source src="/video/helixinsight_preview.mp4#t=2" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors shadow-md">
        Request a Demo
      </button>
    </div>
  )
}
