import Image from 'next/image'

export function HeroSection() {
  return (
    <section className="flex items-center justify-center px-6 pt-32 pb-20">
      <div className="flex flex-col items-center justify-center space-y-8 max-w-3xl">
        {/* Logo group */}
        <div className="flex flex-col items-center gap-2">
          {/* Woman + text logo row - always side by side */}
          <div className="flex items-center gap-3 md:gap-4">
            <Image
              src="/images/logos/logo_helena_woman.svg"
              alt=""
              width={80}
              height={100}
              className="h-20 sm:h-24 md:h-40 w-auto"
              priority
            />
            <Image
              src="/images/logos/logo_helena.svg"
              alt="Helena Bioinformatics"
              width={500}
              height={80}
              className="h-12 sm:h-16 md:h-28 w-auto"
              priority
            />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-foreground font-medium">Intelligence for genomics</p>
        </div>

        <p className="text-base md:text-lg text-muted-foreground text-center">
          Software company integrating artificial intelligence into bioinformatics research and clinical genomics.
        </p>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Sofia, Bulgaria</span>
          <span className="text-border">|</span>
          <span>EU Infrastructure</span>
        </div>
      </div>
    </section>
  )
}
